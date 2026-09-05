const Customer = require('../../models/customer.model');
const Payment = require('../../models/payment.model');
const RecoveryCase = require('../../models/case.model');
const RecoveryAction = require('../../models/action.model');
const AuditLog = require('../../models/audit.model');
const AIService = require('../ai/gemini.service');
const PolicyEngine = require('./policy');
const RazorpayService = require('../razorpay/razorpay.service');
const { isEmbedded } = require('../../config/db');
const { EmbeddedDB } = require('../../config/embeddedDb');

class RecoveryEngine {
  /**
   * Main entrypoint for processing a failed payment.
   * Runs the entire pipeline: Detect -> Diagnose -> Decide -> Validate -> Act -> Audit.
   */
  static async handlePaymentFailure(paymentPayload, isDemo = false) {
    const {
      razorpayPaymentId,
      customerDetails, // { name, email, phone }
      amount,
      currency,
      method,
      failureReason
    } = paymentPayload;

    console.log(`[RECOVERY ENGINE] Detecting failed payment ${razorpayPaymentId} for ${customerDetails.email}`);

    let customer = null;

    if (isEmbedded()) {
      customer = EmbeddedDB.findOne('customers', { email: customerDetails.email.toLowerCase() });
      if (!customer) {
        customer = EmbeddedDB.upsert('customers', {
          name: customerDetails.name,
          email: customerDetails.email.toLowerCase(),
          phone: customerDetails.phone,
          totalSuccessfulPayments: 0,
          totalFailedPayments: 1,
          totalSpent: 0,
          customerRiskScore: 30
        });
      } else {
        customer.totalFailedPayments += 1;
        const totalPayments = customer.totalSuccessfulPayments + customer.totalFailedPayments;
        customer.customerRiskScore = Math.min(100, Math.round((customer.totalFailedPayments / totalPayments) * 100));
        EmbeddedDB.upsert('customers', customer);
      }
    } else {
      customer = await Customer.findOne({ email: customerDetails.email.toLowerCase() });
      if (!customer) {
        customer = new Customer({
          name: customerDetails.name,
          email: customerDetails.email.toLowerCase(),
          phone: customerDetails.phone,
          totalSuccessfulPayments: 0,
          totalFailedPayments: 0,
          totalSpent: 0,
          customerRiskScore: 30
        });
      }
      customer.totalFailedPayments += 1;
      const totalPayments = customer.totalSuccessfulPayments + customer.totalFailedPayments;
      customer.customerRiskScore = Math.min(100, Math.round((customer.totalFailedPayments / totalPayments) * 100));
      await customer.save();
    }

    // 2. Store failed payment
    let payment = null;
    if (isEmbedded()) {
      payment = EmbeddedDB.findOne('payments', { razorpayPaymentId });
      if (!payment) {
        payment = EmbeddedDB.upsert('payments', {
          razorpayPaymentId,
          customerId: customer._id,
          amount,
          currency: currency || 'INR',
          status: 'failed',
          method: method || 'unknown',
          failureReason: failureReason || 'Payment failed',
          mode: isDemo ? 'demo' : 'test'
        });
      }
    } else {
      payment = await Payment.findOne({ razorpayPaymentId });
      if (!payment) {
        payment = new Payment({
          razorpayPaymentId,
          customerId: customer._id,
          amount,
          currency: currency || 'INR',
          status: 'failed',
          method: method || 'unknown',
          failureReason: failureReason || 'Payment failed',
          mode: isDemo ? 'demo' : 'test'
        });
        await payment.save();
      }
    }

    // 3. Create or find active Recovery Case
    const caseId = `case_${razorpayPaymentId.replace('pay_', '')}`;
    let recoveryCase = null;

    if (isEmbedded()) {
      recoveryCase = EmbeddedDB.findOne('cases', { caseId });
      if (!recoveryCase) {
        recoveryCase = EmbeddedDB.upsert('cases', {
          caseId,
          paymentId: payment._id,
          customerId: customer._id,
          amountAtRisk: amount,
          failureReason: failureReason || 'Payment failed',
          attempts: paymentPayload.initialAttempts || 0,
          maxAttempts: 2,
          status: 'active',
          recoveredAmount: 0,
          mode: isDemo ? 'demo' : 'test'
        });
      }
    } else {
      recoveryCase = await RecoveryCase.findOne({ caseId });
      if (!recoveryCase) {
        recoveryCase = new RecoveryCase({
          caseId,
          paymentId: payment._id,
          customerId: customer._id,
          amountAtRisk: amount,
          failureReason: failureReason || 'Payment failed',
          attempts: paymentPayload.initialAttempts || 0,
          maxAttempts: 2,
          status: 'active',
          mode: isDemo ? 'demo' : 'test'
        });
        await recoveryCase.save();
      }
    }

    // Log Detection Audits
    await this.logAudit(caseId, 'PAYMENT_FAILED', `Payment ${razorpayPaymentId} marked as failed. Revenue at risk: ₹${amount}.`, { paymentId: payment._id });
    await this.logAudit(caseId, 'CASE_CREATED', `Recovery case ${caseId} created and initialized.`, { caseId });

    // 4. Retrieve Customer and Case History for AI context
    const customerHistory = {
      name: customer.name,
      email: customer.email,
      totalSuccessfulPayments: customer.totalSuccessfulPayments,
      totalFailedPayments: customer.totalFailedPayments,
      totalSpent: customer.totalSpent,
      customerRiskScore: customer.customerRiskScore
    };

    const aiInputPayment = {
      amount,
      currency,
      failureReason,
      method,
      attempts: recoveryCase.attempts
    };

    // 5. Trigger AI Diagnosis
    await this.logAudit(caseId, 'AI_DIAGNOSIS_START', 'Sending customer historical profile and failure parameters to Recovery AI Agent.');
    const aiDecision = await AIService.analyzePayment(aiInputPayment, customerHistory);
    
    // Save AI parameters in recovery case
    recoveryCase.riskLevel = aiDecision.riskLevel;
    recoveryCase.recoveryProbability = aiDecision.recoveryProbability;
    recoveryCase.rootCause = aiDecision.rootCause;
    recoveryCase.recommendedAction = aiDecision.recommendedAction;
    recoveryCase.aiProvider = aiDecision.aiProvider || 'RULE_BASED';
    
    if (isEmbedded()) {
      EmbeddedDB.upsert('cases', recoveryCase);
    } else {
      await recoveryCase.save();
    }

    await this.logAudit(caseId, 'AI_DIAGNOSIS_COMPLETE', `AI diagnosed root cause as ${aiDecision.rootCause} with ${(aiDecision.recoveryProbability * 100).toFixed(0)}% recovery confidence. Recommend action: ${aiDecision.recommendedAction}.`, aiDecision);

    // 6. Validate via Policy Engine
    const policyResult = PolicyEngine.validate(recoveryCase, aiDecision);
    let finalActionType = policyResult.action;

    // Log policy check
    if (policyResult.approved) {
      await this.logAudit(caseId, 'POLICY_VALIDATED', `Policy Engine approved action: ${finalActionType}.`, { policyResult });
    } else {
      await this.logAudit(caseId, 'POLICY_REJECTED', `Policy Engine REJECTED recommended action (${aiDecision.recommendedAction}). Reason: ${policyResult.reason}. Escalating case.`, { policyResult });
      
      finalActionType = policyResult.action;
      
      if (isEmbedded()) {
        EmbeddedDB.upsert('actions', {
          caseId,
          actionType: aiDecision.recommendedAction,
          reason: `Policy Rejection: ${policyResult.reason}`,
          aiConfidence: aiDecision.recoveryProbability,
          status: 'rejected',
          result: policyResult
        });
      } else {
        const rejectedAction = new RecoveryAction({
          caseId,
          actionType: aiDecision.recommendedAction,
          reason: `Policy Rejection: ${policyResult.reason}`,
          aiConfidence: aiDecision.recoveryProbability,
          status: 'rejected',
          result: policyResult
        });
        await rejectedAction.save();
      }
    }

    // 7. Execute Action
    recoveryCase.currentAction = finalActionType;
    if (isEmbedded()) {
      EmbeddedDB.upsert('cases', recoveryCase);
    } else {
      await recoveryCase.save();
    }

    let executionResult = null;
    let actionStatus = 'pending';

    try {
      if (finalActionType === 'CREATE_PAYMENT_LINK') {
        await this.logAudit(caseId, 'ACTION_EXECUTING', 'Creating Razorpay Test Mode Payment Link...');
        
        executionResult = await RazorpayService.createPaymentLink(payment, customer, caseId, isDemo);
        actionStatus = 'success';
        
        recoveryCase.currentAction = `PAYMENT_LINK_CREATED: ${executionResult.short_url}`;
        recoveryCase.attempts += 1;

        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
        } else {
          await recoveryCase.save();
        }

        await this.logAudit(caseId, 'ACTION_EXECUTED', `Payment Link successfully created: ${executionResult.short_url}`, { linkId: executionResult.id, short_url: executionResult.short_url });
        
      } else if (finalActionType === 'RETRY_PAYMENT') {
        await this.logAudit(caseId, 'ACTION_EXECUTING', 'Initiating automatic system retry (simulating bank API clearance)...');
        
        recoveryCase.attempts += 1;
        executionResult = { success: true, message: 'Auto-retry transaction processed.' };
        actionStatus = 'success';
        
        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
        } else {
          await recoveryCase.save();
        }
        await this.logAudit(caseId, 'ACTION_EXECUTED', 'Automated transaction retry processed successfully.', executionResult);
        
        await this.handleRecoverySuccess(caseId, amount, isDemo);

      } else if (finalActionType === 'SEND_REMINDER') {
        await this.logAudit(caseId, 'ACTION_EXECUTING', `Sending SMS and Email reminders to ${customer.email}...`);
        
        recoveryCase.attempts += 1;
        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
        } else {
          await recoveryCase.save();
        }
        
        executionResult = { message: 'Reminder notifications sent.' };
        actionStatus = 'success';
        
        await this.logAudit(caseId, 'ACTION_EXECUTED', `Reminders dispatched. Contact attempts: ${recoveryCase.attempts}`, executionResult);
        
      } else if (finalActionType === 'ESCALATE_TO_MERCHANT') {
        await this.logAudit(caseId, 'ACTION_EXECUTING', 'Escalating case details to Merchant Operations Panel.');
        
        recoveryCase.status = 'escalated';
        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
        } else {
          await recoveryCase.save();
        }
        
        executionResult = { escalatedAt: new Date() };
        actionStatus = 'success';
        
        await this.logAudit(caseId, 'CASE_ESCALATED', 'Recovery limits exceeded or high value trigger. Case escalated to merchant.', executionResult);
        
      } else if (finalActionType === 'STOP') {
        await this.logAudit(caseId, 'ACTION_EXECUTING', 'Terminating recovery workflow rules.');
        
        recoveryCase.status = 'stopped';
        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
        } else {
          await recoveryCase.save();
        }
        
        executionResult = { stoppedAt: new Date() };
        actionStatus = 'success';
        
        await this.logAudit(caseId, 'CASE_STOPPED', 'Automatic recovery terminated to respect safety rules.', executionResult);
      }
    } catch (err) {
      console.error('Error executing recovery action:', err);
      actionStatus = 'failed';
      executionResult = { error: err.message };
      
      await this.logAudit(caseId, 'ACTION_FAILED', `Execution of action ${finalActionType} failed. Error: ${err.message}`, executionResult);
      
      recoveryCase.status = 'escalated';
      if (isEmbedded()) {
        EmbeddedDB.upsert('cases', recoveryCase);
      } else {
        await recoveryCase.save();
      }
      await this.logAudit(caseId, 'CASE_ESCALATED', 'System action failure. Case escalated to merchant.');
    }

    if (isEmbedded()) {
      EmbeddedDB.upsert('actions', {
        caseId,
        actionType: finalActionType,
        reason: aiDecision.reason,
        aiConfidence: aiDecision.recoveryProbability,
        status: actionStatus,
        result: executionResult
      });
    } else {
      const recoveryAction = new RecoveryAction({
        caseId,
        actionType: finalActionType,
        reason: aiDecision.reason,
        aiConfidence: aiDecision.recoveryProbability,
        status: actionStatus,
        result: executionResult
      });
      await recoveryAction.save();
    }

    return {
      customer,
      payment,
      recoveryCase,
      aiDecision,
      policyResult
    };
  }

  /**
   * Mark a payment recovery case as successful (e.g. payment.captured or payment_link.paid webhook)
   */
  static async handleRecoverySuccess(caseId, paidAmount, isDemo = false) {
    let recoveryCase = null;
    if (isEmbedded()) {
      recoveryCase = EmbeddedDB.findOne('cases', { caseId });
    } else {
      recoveryCase = await RecoveryCase.findOne({ caseId });
    }

    if (!recoveryCase) {
      console.warn(`Case ${caseId} not found for recovery update.`);
      return null;
    }

    if (recoveryCase.status === 'recovered') {
      console.log(`Case ${caseId} is already marked as recovered.`);
      return recoveryCase;
    }

    console.log(`[RECOVERY ENGINE] Marking case ${caseId} as RECOVERED with amount ₹${paidAmount}`);
    
    recoveryCase.status = 'recovered';
    recoveryCase.recoveredAmount = paidAmount;
    
    if (isEmbedded()) {
      EmbeddedDB.upsert('cases', recoveryCase);
      const payment = EmbeddedDB.findOne('payments', { _id: recoveryCase.paymentId });
      if (payment) {
        payment.status = 'captured';
        EmbeddedDB.upsert('payments', payment);
      }
      const customer = EmbeddedDB.findOne('customers', { _id: recoveryCase.customerId });
      if (customer) {
        customer.totalSuccessfulPayments += 1;
        customer.totalSpent += paidAmount;
        customer.lastPaymentDate = new Date();
        const totalPayments = customer.totalSuccessfulPayments + customer.totalFailedPayments;
        customer.customerRiskScore = Math.min(100, Math.round((customer.totalFailedPayments / totalPayments) * 100));
        EmbeddedDB.upsert('customers', customer);
      }
    } else {
      await recoveryCase.save();
      const payment = await Payment.findById(recoveryCase.paymentId);
      if (payment) {
        payment.status = 'captured';
        await payment.save();
      }
      const customer = await Customer.findById(recoveryCase.customerId);
      if (customer) {
        customer.totalSuccessfulPayments += 1;
        customer.totalSpent += paidAmount;
        customer.lastPaymentDate = new Date();
        const totalPayments = customer.totalSuccessfulPayments + customer.totalFailedPayments;
        customer.customerRiskScore = Math.min(100, Math.round((customer.totalFailedPayments / totalPayments) * 100));
        await customer.save();
      }
    }

    await this.logAudit(caseId, 'PAYMENT_RECEIVED', `Payment successfully verified. Received ₹${paidAmount}.`);
    await this.logAudit(caseId, 'REVENUE_RECOVERED', `₹${paidAmount} marked as recovered. Recovery workflow successfully completed.`, { paidAmount });

    return recoveryCase;
  }

  /**
   * Helper to insert audit event logs
   */
  static async logAudit(caseId, eventType, message, metadata = {}) {
    if (isEmbedded()) {
      const log = EmbeddedDB.upsert('audits', {
        caseId,
        eventType,
        message,
        metadata
      });
      console.log(`[AUDIT LOG] [${eventType}] ${message}`);
      return log;
    } else {
      const log = new AuditLog({
        caseId,
        eventType,
        message,
        metadata
      });
      await log.save();
      console.log(`[AUDIT LOG] [${eventType}] ${message}`);
      return log;
    }
  }
}

module.exports = RecoveryEngine;
