const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Deterministic rule-based recovery fallback diagnostic.
 * Used when Gemini is not configured, or fails.
 */
function getRuleBasedFallback(paymentData, customerHistory) {
  const amount = paymentData.amount || 0;
  const failureReason = (paymentData.failureReason || '').toLowerCase();
  const successfulPayments = customerHistory.totalSuccessfulPayments || 0;
  const failedPayments = customerHistory.totalFailedPayments || 0;
  const attempts = paymentData.attempts || 0;
  
  let riskLevel = 'MEDIUM';
  let recoveryProbability = 0.50;
  let rootCause = 'TEMPORARY_BANK_FAILURE';
  let recommendedAction = 'CREATE_PAYMENT_LINK';
  let reason = 'Fallback: Balanced account profile. A payment link is recommended.';
  let maxAttempts = 2;
  let escalationRequired = false;

  // Rule 1: High Transaction Value
  if (amount > 50000) {
    riskLevel = 'HIGH';
    recoveryProbability = 0.35;
    rootCause = 'HIGH_VALUE_TRANSACTION';
    recommendedAction = 'ESCALATE_TO_MERCHANT';
    reason = `Fallback: Transaction amount of ₹${amount} exceeds the automated recovery limit of ₹50,000.`;
    maxAttempts = 1;
    escalationRequired = true;
  }
  // Rule 2: Exhausted Attempts
  else if (attempts >= 2) {
    riskLevel = 'HIGH';
    recoveryProbability = 0.05;
    rootCause = 'RECOVERY_LIMIT_REACHED';
    recommendedAction = 'STOP';
    reason = 'Fallback: Maximum recovery attempts exceeded. Automatically stopping to prevent customer fatigue.';
    maxAttempts = 2;
    escalationRequired = true;
  }
  // Rule 3: Chronic failure customer
  else if (failedPayments >= 4 && successfulPayments === 0) {
    riskLevel = 'HIGH';
    recoveryProbability = 0.10;
    rootCause = 'REPEATED_FAILURE';
    recommendedAction = 'ESCALATE_TO_MERCHANT';
    reason = `Fallback: Customer has ${failedPayments} consecutive failed payments and zero successful transactions. Escalating to merchant.`;
    maxAttempts = 1;
    escalationRequired = true;
  }
  // Rule 4: Insufficient Funds
  else if (failureReason.includes('insufficient') || failureReason.includes('balance') || failureReason.includes('funds')) {
    riskLevel = 'MEDIUM';
    recoveryProbability = 0.60;
    rootCause = 'INSUFFICIENT_FUNDS';
    recommendedAction = 'CREATE_PAYMENT_LINK';
    reason = 'Fallback: Failed due to insufficient funds. Creating payment link so customer can retry with alternative account or when funds are added.';
    maxAttempts = 2;
    escalationRequired = false;
  }
  // Rule 5: Authentication failure / abandoned checkout
  else if (failureReason.includes('auth') || failureReason.includes('otp') || failureReason.includes('cancel') || failureReason.includes('abandoned')) {
    riskLevel = 'MEDIUM';
    recoveryProbability = 0.70;
    rootCause = 'AUTHENTICATION_FAILED';
    recommendedAction = 'CREATE_PAYMENT_LINK';
    reason = 'Fallback: Customer cancelled the authentication flow or OTP timed out. A payment link is generated to allow manual retry.';
    maxAttempts = 2;
    escalationRequired = false;
  }
  // Rule 6: Strong customer history, temporary bank failure
  else if (successfulPayments >= 5 && (failureReason.includes('bank') || failureReason.includes('network') || failureReason.includes('system') || failureReason.length === 0)) {
    riskLevel = 'LOW';
    recoveryProbability = 0.90;
    rootCause = 'TEMPORARY_BANK_FAILURE';
    recommendedAction = 'RETRY_PAYMENT';
    reason = `Fallback: Customer has high loyalty (${successfulPayments} successful payments) and failure is temporary. Scheduling automatic payment retry.`;
    maxAttempts = 2;
    escalationRequired = false;
  }
  // Rule 7: Weak customer history, but not completely bad
  else if (failedPayments > successfulPayments) {
    riskLevel = 'HIGH';
    recoveryProbability = 0.40;
    rootCause = 'REPEATED_FAILURE';
    recommendedAction = 'CREATE_PAYMENT_LINK';
    reason = `Fallback: Customer has ${failedPayments} failures vs ${successfulPayments} successes. Generating payment link but monitoring closely.`;
    maxAttempts = 1;
    escalationRequired = false;
  }

  return {
    riskLevel,
    recoveryProbability,
    rootCause,
    recommendedAction,
    reason,
    maxAttempts,
    escalationRequired
  };
}

/**
 * Formulate prompt for Gemini API.
 */
function buildPrompt(paymentData, customerHistory) {
  return `You are an AI Payment Recovery Agent analyzing a failed payment transaction.
Evaluate the data below and return a JSON object detailing your diagnostic assessment.

PAYMENT DATA:
- Amount: ₹${paymentData.amount}
- Currency: ${paymentData.currency || 'INR'}
- Failure Reason: "${paymentData.failureReason || 'Unknown failure'}"
- Recovery Attempts So Far: ${paymentData.attempts || 0}
- Payment Method: "${paymentData.method || 'Unknown'}"

CUSTOMER PAYMENT HISTORY:
- Name: "${customerHistory.name}"
- Email: "${customerHistory.email}"
- Total Successful Payments: ${customerHistory.totalSuccessfulPayments || 0}
- Total Failed Payments: ${customerHistory.totalFailedPayments || 0}
- Total Spent: ₹${customerHistory.totalSpent || 0}
- Customer Risk Score: ${customerHistory.customerRiskScore || 0}

INSTRUCTIONS:
1. Classify the "riskLevel" of recovery as "LOW", "MEDIUM", or "HIGH".
2. Calculate the "recoveryProbability" as a number between 0.0 and 1.0.
3. Diagnose the "rootCause" as one of: "TEMPORARY_BANK_FAILURE", "INSUFFICIENT_FUNDS", "AUTHENTICATION_FAILED", "ABANDONED_CHECKOUT", "REPEATED_FAILURE", "RECOVERY_LIMIT_REACHED", or "HIGH_VALUE_TRANSACTION".
4. Recommend a "recommendedAction" as one of: "RETRY_PAYMENT", "CREATE_PAYMENT_LINK", "SEND_REMINDER", "ESCALATE_TO_MERCHANT", or "STOP".
5. Give a detailed, clear sentence in "reason" explaining exactly why you chose this action, highlighting specific facts (e.g. number of successful payments, failure code/reason).
6. Set "maxAttempts" (integer, default 2).
7. Set "escalationRequired" (boolean, true if recommendedAction is ESCALATE_TO_MERCHANT or STOP).

You MUST return ONLY a valid JSON object matching this schema. Do not output any markdown code blocks, backticks, or other text. Just the raw JSON.

JSON Schema Example:
{
  "riskLevel": "HIGH",
  "recoveryProbability": 0.82,
  "rootCause": "TEMPORARY_BANK_FAILURE",
  "recommendedAction": "CREATE_PAYMENT_LINK",
  "reason": "Customer has strong payment history and this appears to be a temporary failure.",
  "maxAttempts": 2,
  "escalationRequired": false
}`;
}

/**
 * Main AI Recovery Service
 */
class AIService {
  static async analyzePayment(paymentData, customerHistory) {
    const isMock = process.env.AI_PROVIDER === 'MOCK' || !process.env.GEMINI_API_KEY;
    if (isMock) {
      console.log('AI_PROVIDER is set to MOCK or GEMINI_API_KEY is missing. Using rule-based fallback.');
      const fallbackResult = getRuleBasedFallback(paymentData, customerHistory);
      fallbackResult.aiProvider = 'RULE_BASED';
      return fallbackResult;
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const prompt = buildPrompt(paymentData, customerHistory);
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      
      console.log('Raw response from Gemini API:', textResponse);
      const jsonResponse = JSON.parse(textResponse.trim());
      
      const validatedResponse = {
        riskLevel: jsonResponse.riskLevel || 'MEDIUM',
        recoveryProbability: typeof jsonResponse.recoveryProbability === 'number' ? jsonResponse.recoveryProbability : 0.50,
        rootCause: jsonResponse.rootCause || 'TEMPORARY_BANK_FAILURE',
        recommendedAction: jsonResponse.recommendedAction || 'CREATE_PAYMENT_LINK',
        reason: jsonResponse.reason || 'Gemini AI analysis successfully completed.',
        maxAttempts: typeof jsonResponse.maxAttempts === 'number' ? jsonResponse.maxAttempts : 2,
        escalationRequired: typeof jsonResponse.escalationRequired === 'boolean' ? jsonResponse.escalationRequired : false,
        aiProvider: 'GEMINI'
      };
      
      return validatedResponse;
    } catch (error) {
      console.error('Error invoking Gemini API, falling back to rule-based analysis:', error);
      const fallbackResult = getRuleBasedFallback(paymentData, customerHistory);
      fallbackResult.reason = `Fallback (Gemini API failed): ${fallbackResult.reason}`;
      fallbackResult.aiProvider = 'RULE_BASED';
      return fallbackResult;
    }
  }
}

module.exports = AIService;
