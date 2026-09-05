const RecoveryCase = require('../models/case.model');
const AuditLog = require('../models/audit.model');
const RecoveryAction = require('../models/action.model');
const RecoveryEngine = require('../services/recovery/engine');
const PolicyEngine = require('../services/recovery/policy');
const RazorpayService = require('../services/razorpay/razorpay.service');
const Customer = require('../models/customer.model');
const Payment = require('../models/payment.model');
const { isEmbedded } = require('../config/db');
const { EmbeddedDB } = require('../config/embeddedDb');

class CasesController {
  /**
   * Get list of recovery cases with filters
   */
  static async getCases(req, res) {
    try {
      const { status, riskLevel, mode, q } = req.query;

      if (isEmbedded()) {
        let cases = EmbeddedDB.find('cases');
        if (status) cases = cases.filter(c => c.status === status);
        if (riskLevel) cases = cases.filter(c => c.riskLevel === riskLevel);
        if (mode) cases = cases.filter(c => c.mode === mode);
        
        // Populate customer
        const populated = cases.map(c => {
          const cust = EmbeddedDB.findOne('customers', { _id: c.customerId });
          return {
            ...c,
            customerId: cust ? { name: cust.name, email: cust.email, phone: cust.phone } : null
          };
        });
        return res.status(200).json(populated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      }

      const filter = {};
      if (status) filter.status = status;
      if (riskLevel) filter.riskLevel = riskLevel;
      if (mode) filter.mode = mode;

      let populateQuery = { path: 'customerId', select: 'name email phone' };

      if (q) {
        const customers = await Customer.find({
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }).select('_id');
        
        const customerIds = customers.map(cust => cust._id);
        filter.$or = [
          { caseId: { $regex: q, $options: 'i' } },
          { failureReason: { $regex: q, $options: 'i' } },
          { customerId: { $in: customerIds } }
        ];
      }

      const cases = await RecoveryCase.find(filter)
        .populate(populateQuery)
        .sort({ updatedAt: -1 });

      return res.status(200).json(cases);
    } catch (err) {
      console.error('Error fetching cases:', err);
      return res.status(500).json({ error: 'Internal server error fetching cases' });
    }
  }

  /**
   * Get case details by custom Case ID
   */
  static async getCaseById(req, res) {
    try {
      const { id } = req.params;

      if (isEmbedded()) {
        const recoveryCase = EmbeddedDB.findOne('cases', { caseId: id });
        if (!recoveryCase) {
          return res.status(404).json({ error: 'Recovery case not found' });
        }

        const customer = EmbeddedDB.findOne('customers', { _id: recoveryCase.customerId });
        const payment = EmbeddedDB.findOne('payments', { _id: recoveryCase.paymentId });
        const actions = EmbeddedDB.find('actions', { caseId: id });

        return res.status(200).json({
          recoveryCase: {
            ...recoveryCase,
            customerId: customer || { name: 'Customer' },
            paymentId: payment || { method: 'upi' }
          },
          actions
        });
      }

      const recoveryCase = await RecoveryCase.findOne({ caseId: id })
        .populate('customerId')
        .populate('paymentId');

      if (!recoveryCase) {
        return res.status(404).json({ error: 'Recovery case not found' });
      }

      const actions = await RecoveryAction.find({ caseId: id }).sort({ createdAt: -1 });

      return res.status(200).json({
        recoveryCase,
        actions
      });
    } catch (err) {
      console.error('Error fetching case by ID:', err);
      return res.status(500).json({ error: 'Internal server error fetching case details' });
    }
  }

  /**
   * Get audit log timeline for a case
   */
  static async getCaseAudit(req, res) {
    try {
      const { id } = req.params;
      if (isEmbedded()) {
        const timeline = EmbeddedDB.find('audits', { caseId: id })
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return res.status(200).json(timeline);
      }
      const timeline = await AuditLog.find({ caseId: id }).sort({ createdAt: 1 });
      return res.status(200).json(timeline);
    } catch (err) {
      console.error('Error fetching case audit log:', err);
      return res.status(500).json({ error: 'Internal server error fetching case audit timeline' });
    }
  }

  /**
   * Manually execute/retry recovery action for an active case
   */
  static async executeAction(req, res) {
    try {
      const { id } = req.params;
      let recoveryCase = isEmbedded() 
        ? EmbeddedDB.findOne('cases', { caseId: id })
        : await RecoveryCase.findOne({ caseId: id }).populate('customerId').populate('paymentId');

      if (!recoveryCase) {
        return res.status(404).json({ error: 'Recovery case not found' });
      }

      if (recoveryCase.status !== 'active') {
        return res.status(400).json({ error: `Cannot execute action. Case is in status: ${recoveryCase.status}` });
      }

      const aiDecision = {
        riskLevel: recoveryCase.riskLevel,
        recoveryProbability: recoveryCase.recoveryProbability,
        rootCause: recoveryCase.rootCause,
        recommendedAction: recoveryCase.recommendedAction,
        reason: 'Manual re-execution requested by merchant.'
      };

      const policyResult = PolicyEngine.validate(recoveryCase, aiDecision);
      let actionToExecute = policyResult.action;

      if (!policyResult.approved) {
        await RecoveryEngine.logAudit(id, 'POLICY_REJECTED', `Manual action execution rejected by Policy Engine. Reason: ${policyResult.reason}`, { policyResult });
        
        recoveryCase.status = 'escalated';
        recoveryCase.currentAction = 'ESCALATE_TO_MERCHANT';

        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
          EmbeddedDB.upsert('actions', {
            caseId: id,
            actionType: recoveryCase.recommendedAction,
            reason: `Policy Rejection: ${policyResult.reason}`,
            aiConfidence: recoveryCase.recoveryProbability,
            status: 'rejected',
            result: policyResult
          });
        } else {
          await recoveryCase.save();
          const rejectedAction = new RecoveryAction({
            caseId: id,
            actionType: recoveryCase.recommendedAction,
            reason: `Policy Rejection: ${policyResult.reason}`,
            aiConfidence: recoveryCase.recoveryProbability,
            status: 'rejected',
            result: policyResult
          });
          await rejectedAction.save();
        }

        return res.status(400).json({
          error: 'Action rejected by safety engine policies. Case has been escalated.',
          policyResult
        });
      }

      let executionResult = null;
      let actionStatus = 'pending';

      if (actionToExecute === 'CREATE_PAYMENT_LINK') {
        const customer = isEmbedded() ? EmbeddedDB.findOne('customers', { _id: recoveryCase.customerId }) : recoveryCase.customerId;
        const payment = isEmbedded() ? EmbeddedDB.findOne('payments', { _id: recoveryCase.paymentId }) : recoveryCase.paymentId;

        executionResult = await RazorpayService.createPaymentLink(payment || { amount: recoveryCase.amountAtRisk }, customer || { name: 'Customer', email: 'test@recoverai.demo' }, id);
        actionStatus = 'success';
        recoveryCase.currentAction = `PAYMENT_LINK_CREATED: ${executionResult.short_url}`;
        recoveryCase.attempts += 1;

        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
        } else {
          await recoveryCase.save();
        }

        await RecoveryEngine.logAudit(id, 'ACTION_EXECUTED', `Manual Payment Link created: ${executionResult.short_url}`, { short_url: executionResult.short_url });
      } else if (actionToExecute === 'RETRY_PAYMENT') {
        recoveryCase.attempts += 1;
        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
        } else {
          await recoveryCase.save();
        }

        executionResult = { success: true, message: 'Automated retry simulation completed.' };
        actionStatus = 'success';

        await RecoveryEngine.logAudit(id, 'ACTION_EXECUTED', 'Automated retry cleared successfully.', executionResult);
        await RecoveryEngine.handleRecoverySuccess(id, recoveryCase.amountAtRisk, recoveryCase.mode === 'demo');
      } else {
        actionStatus = 'success';
        executionResult = { message: 'Action successfully ran' };
        recoveryCase.status = actionToExecute === 'STOP' ? 'stopped' : 'escalated';
        recoveryCase.currentAction = actionToExecute;

        if (isEmbedded()) {
          EmbeddedDB.upsert('cases', recoveryCase);
        } else {
          await recoveryCase.save();
        }

        await RecoveryEngine.logAudit(id, `CASE_${actionToExecute}`, `Case set to ${actionToExecute} via manual merchant control.`);
      }

      if (isEmbedded()) {
        EmbeddedDB.upsert('actions', {
          caseId: id,
          actionType: actionToExecute,
          reason: 'Manual execution trigger',
          aiConfidence: recoveryCase.recoveryProbability,
          status: actionStatus,
          result: executionResult
        });
      } else {
        const recoveryAction = new RecoveryAction({
          caseId: id,
          actionType: actionToExecute,
          reason: 'Manual execution trigger',
          aiConfidence: recoveryCase.recoveryProbability,
          status: actionStatus,
          result: executionResult
        });
        await recoveryAction.save();
      }

      return res.status(200).json({
        message: 'Action executed successfully',
        recoveryCase
      });
    } catch (err) {
      console.error('Error executing manual action:', err);
      return res.status(500).json({ error: `Internal server error: ${err.message}` });
    }
  }

  /**
   * Force Escalate case to merchant manually
   */
  static async escalateCase(req, res) {
    try {
      const { id } = req.params;
      let recoveryCase = isEmbedded() 
        ? EmbeddedDB.findOne('cases', { caseId: id })
        : await RecoveryCase.findOne({ caseId: id });

      if (!recoveryCase) {
        return res.status(404).json({ error: 'Recovery case not found' });
      }

      recoveryCase.status = 'escalated';
      recoveryCase.currentAction = 'ESCALATE_TO_MERCHANT';

      if (isEmbedded()) {
        EmbeddedDB.upsert('cases', recoveryCase);
        EmbeddedDB.upsert('actions', {
          caseId: id,
          actionType: 'ESCALATE_TO_MERCHANT',
          reason: 'Manual agent intervention.',
          status: 'success'
        });
      } else {
        await recoveryCase.save();
        const action = new RecoveryAction({
          caseId: id,
          actionType: 'ESCALATE_TO_MERCHANT',
          reason: 'Manual agent intervention.',
          status: 'success'
        });
        await action.save();
      }

      await RecoveryEngine.logAudit(id, 'CASE_ESCALATED', 'Case manually escalated to merchant by operations agent.');

      return res.status(200).json(recoveryCase);
    } catch (err) {
      console.error('Error escalating case:', err);
      return res.status(500).json({ error: 'Internal server error escalating case' });
    }
  }
}

module.exports = CasesController;
