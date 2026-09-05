# Batch Evaluation Methodology - RecoverAI

RecoverAI includes an offline batch evaluation harness (`src/scripts/evaluate.js`) that runs benchmark tests across a labeled synthetic dataset of **500 payment failure cases**.

---

## Dataset Schema

Each test case record in `data/sample-payments.csv` includes:
- `CaseID`: Unique identifier
- `Amount`: Transaction value in INR
- `FailureReason`: Specific gateway error code or description
- `SuccessfulPayments`: Historical successful transactions for customer
- `FailedPayments`: Historical failed transactions for customer
- `Attempts`: Current recovery attempt count
- `ExpectedAction`: Ground truth labeled optimal action (`RETRY_PAYMENT`, `CREATE_PAYMENT_LINK`, `ESCALATE_TO_MERCHANT`, `STOP`)
- `ExpectedRisk`: Ground truth labeled risk classification (`LOW`, `MEDIUM`, `HIGH`)
- `ExpectedOutcome`: Ground truth expected recovery outcome (`RECOVERED` or `NOT_RECOVERED`)

---

## Metric Formulas

1. **AI Action Accuracy**:
   $$\text{Accuracy} = \frac{\text{Correct Action Predictions}}{\text{Total Cases (500)}} \times 100$$

2. **Risk Classification Accuracy**:
   $$\text{Risk Accuracy} = \frac{\text{Correct Risk Level Predictions}}{\text{Total Cases (500)}} \times 100$$

3. **Recovery Rate**:
   $$\text{Recovery Rate} = \frac{\text{Sum of Recovered Transaction Amounts}}{\text{Sum of Total Revenue at Risk}} \times 100$$

4. **Stop Rule Violations**:
   Number of times an automated action bypassed Policy Engine limits (Target: 0).
