/**
 * Policy & Safety Engine for RecoverAI
 * Enforces safety boundaries, spending limits, retry ceilings, and customer experience safeguards.
 */

// Load policy limits from environment or defaults
const MAX_AUTOMATIC_RETRIES = parseInt(process.env.MAX_AUTOMATIC_RETRIES, 10) || 2;
const MAX_REMINDERS = parseInt(process.env.MAX_REMINDERS, 10) || 2;
const MAX_RECOVERY_AMOUNT = parseFloat(process.env.MAX_RECOVERY_AMOUNT) || 50000;
const MIN_CONFIDENCE_THRESHOLD = parseFloat(process.env.MIN_CONFIDENCE_THRESHOLD) || 0.50;

class PolicyEngine {
  /**
   * Validates an AI recommended action against the strict business rules.
   * 
   * @param {Object} caseData - The current RecoveryCase document
   * @param {Object} aiDecision - The structured output from Gemini / Fallback
   * @returns {Object} { approved: boolean, action: string, reason: string }
   */
  static validate(caseData, aiDecision) {
    const { amountAtRisk, attempts, status } = caseData;
    const { recommendedAction, recoveryProbability } = aiDecision;

    // Rule 1: Case is already resolved or terminated
    if (['recovered', 'stopped', 'escalated'].includes(status)) {
      return {
        approved: false,
        action: 'STOP',
        reason: `Policy Enforcement: The recovery case status is '${status}'. No further actions allowed.`
      };
    }

    // Rule 2: Case has already reached maximum attempts
    if (attempts >= caseData.maxAttempts) {
      return {
        approved: false,
        action: 'STOP',
        reason: `Policy Enforcement: Maximum recovery attempts (${caseData.maxAttempts}) reached for this case.`
      };
    }

    // Rule 3: High Value Transaction limit
    if (amountAtRisk > MAX_RECOVERY_AMOUNT) {
      return {
        approved: false,
        action: 'ESCALATE_TO_MERCHANT',
        reason: `Policy Enforcement: Transaction amount (₹${amountAtRisk}) exceeds the maximum threshold for automatic recovery (₹${MAX_RECOVERY_AMOUNT}).`
      };
    }

    // Rule 4: Low AI confidence check
    if (['RETRY_PAYMENT', 'CREATE_PAYMENT_LINK', 'SEND_REMINDER'].includes(recommendedAction) && 
        recoveryProbability < MIN_CONFIDENCE_THRESHOLD) {
      return {
        approved: false,
        action: 'ESCALATE_TO_MERCHANT',
        reason: `Policy Enforcement: AI recovery probability (${(recoveryProbability * 100).toFixed(1)}%) is below the confidence threshold (${(MIN_CONFIDENCE_THRESHOLD * 100)}%).`
      };
    }

    // Rule 5: Retry ceiling checks
    if (recommendedAction === 'RETRY_PAYMENT' && attempts >= MAX_AUTOMATIC_RETRIES) {
      return {
        approved: false,
        action: 'CREATE_PAYMENT_LINK', // Downgrade retry to link
        reason: `Policy Enforcement: Automatic retries (${attempts}) reached the maximum allowed limit of ${MAX_AUTOMATIC_RETRIES}. Downgrading to payment link.`
      };
    }

    // Rule 6: Send reminder limit checks (assumed tracked in attempts or action records)
    if (recommendedAction === 'SEND_REMINDER' && attempts >= MAX_REMINDERS) {
      return {
        approved: false,
        action: 'ESCALATE_TO_MERCHANT',
        reason: `Policy Enforcement: Communication reminders (${attempts}) reached the limit of ${MAX_REMINDERS}. Escalating.`
      };
    }

    // Rule 7: Immediate Stop command
    if (recommendedAction === 'STOP') {
      return {
        approved: true,
        action: 'STOP',
        reason: 'Policy Enforcement: Stopped based on AI recommendation.'
      };
    }

    // Rule 8: Immediate Escalation command
    if (recommendedAction === 'ESCALATE_TO_MERCHANT') {
      return {
        approved: true,
        action: 'ESCALATE_TO_MERCHANT',
        reason: 'Policy Enforcement: Escalated based on AI recommendation.'
      };
    }

    // Approved action
    return {
      approved: true,
      action: recommendedAction,
      reason: 'Policy Enforcement: Action approved by Safety Engine.'
    };
  }
}

module.exports = PolicyEngine;
