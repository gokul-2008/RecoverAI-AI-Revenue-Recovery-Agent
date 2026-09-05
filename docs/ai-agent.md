# AI Agent Documentation - RecoverAI

The **RecoverAI Agent** leverages Google Gemini (`gemini-1.5-flash`) via the `@google/generative-ai` SDK to evaluate payment failure contexts and prescribe optimal recovery actions.

---

## Data Inputs Evaluated

The AI agent analyzes:
1. **Transaction Parameters**: Payment amount, currency, failure reason code/description, payment method (UPI, Card, Netbanking), current recovery attempt count.
2. **Customer Historical Profile**: Successful payment counts, failed payment counts, total lifetime value (LTV), customer risk score.

---

## Structured Output JSON Schema

The AI agent produces a strictly formatted JSON object matching this schema:

```json
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "recoveryProbability": 0.82,
  "rootCause": "TEMPORARY_BANK_FAILURE" | "INSUFFICIENT_FUNDS" | "AUTHENTICATION_FAILED" | "ABANDONED_CHECKOUT" | "REPEATED_FAILURE" | "RECOVERY_LIMIT_REACHED" | "HIGH_VALUE_TRANSACTION",
  "recommendedAction": "RETRY_PAYMENT" | "CREATE_PAYMENT_LINK" | "SEND_REMINDER" | "ESCALATE_TO_MERCHANT" | "STOP",
  "reason": "Detailed diagnostic reasoning sentence citing historical facts and failure code...",
  "maxAttempts": 2,
  "escalationRequired": false
}
```

---

## Rule-Based Fallback Diagnostic Engine

If the Gemini API key is unconfigured or returns a network error, `AIService` falls back to a deterministic diagnostic matrix:

- **Amount > ₹50,000**: Classifies as `HIGH` risk, recommends `ESCALATE_TO_MERCHANT`.
- **Attempts ≥ 2**: Classifies as `HIGH` risk, recommends `STOP`.
- **0 Successful Payments & ≥ 4 Failures**: Classifies as `HIGH` risk, recommends `ESCALATE_TO_MERCHANT`.
- **Insufficient Funds**: Classifies as `MEDIUM` risk, recommends `CREATE_PAYMENT_LINK`.
- **Authentication Failure / OTP Timeout**: Classifies as `MEDIUM` risk, recommends `CREATE_PAYMENT_LINK`.
- **≥ 5 Successful Payments & Temporary Degradation**: Classifies as `LOW` risk (90% confidence), recommends `RETRY_PAYMENT`.
