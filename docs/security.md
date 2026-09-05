# Security Controls & Policy Guardrails - RecoverAI

RecoverAI implements security controls across the API, database, and webhook layers.

---

## 1. Webhook Signature Verification

All incoming Razorpay webhooks (`POST /api/webhooks/razorpay`) undergo HMAC SHA-256 signature verification:
- The raw request body buffer (`req.rawBody`) is captured before JSON parsing.
- An HMAC SHA-256 hash is computed using `process.env.RAZORPAY_WEBHOOK_SECRET`.
- The computed digest is compared against the `x-razorpay-signature` header using `crypto.timingSafeEqual` logic.
- Unauthorized or tampered webhook payloads are rejected with HTTP 400 and logged to the Audit Log.

## 2. Webhook Idempotency

To prevent replay attacks or duplicate processing of webhook notifications:
- The unique Razorpay Event ID (`payload.id`) is stored in the `WebhookEvent` MongoDB collection.
- Duplicate event IDs are acknowledged with HTTP 200 and ignored.

## 3. Policy & Safety Engine Boundaries

The Policy Engine prevents dangerous automated actions:
- `MAX_AUTOMATIC_RETRIES = 2`: Hard ceiling on automated payment retries.
- `MAX_RECOVERY_AMOUNT = 50000`: High-value transactions automatically escalate to merchant ops.
- `MIN_CONFIDENCE_THRESHOLD = 0.50`: Rejects automated execution if AI probability is below 50%.

## 4. API & Authentication

- Passwords are hashed using `bcryptjs` with salt factor 10.
- Admin endpoints require JWT authorization tokens signed with `JWT_SECRET`.
- Express security headers are enforced via `helmet`.
