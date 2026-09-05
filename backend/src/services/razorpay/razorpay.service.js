const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
  /**
   * Safely retrieve and sanitize Razorpay Key ID
   */
  static getKeyId() {
    return (process.env.RAZORPAY_KEY_ID || '').trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Safely retrieve and sanitize Razorpay Key Secret
   */
  static getKeySecret() {
    return (process.env.RAZORPAY_KEY_SECRET || '').trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Safely retrieve and sanitize Razorpay Webhook Secret
   */
  static getWebhookSecret() {
    return (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Check if Razorpay is configured with real credentials.
   */
  static isConfigured() {
    const keyId = this.getKeyId();
    const secret = this.getKeySecret();
    return Boolean(keyId && secret && keyId.startsWith('rzp_test_') && secret.length > 0);
  }

  /**
   * Test Razorpay TEST API authentication independently without creating objects.
   */
  static async verifyAuthentication() {
    if (!this.isConfigured()) {
      return { authenticated: false, reason: 'Credentials missing or invalid format' };
    }

    try {
      const rzp = this.getClient();
      // Read-only query to test authentication against Razorpay API
      await rzp.orders.all({ count: 1 });
      return { authenticated: true, keyId: this.getKeyId() };
    } catch (error) {
      const desc = error.description || (error.error && error.error.description) || error.message || 'Authentication failed';
      return { authenticated: false, error: desc, statusCode: error.statusCode || 401 };
    }
  }

  /**
   * Get Razorpay SDK instance.
   */
  static getClient() {
    if (!this.isConfigured()) {
      return null;
    }
    return new Razorpay({
      key_id: this.getKeyId(),
      key_secret: this.getKeySecret()
    });
  }

  /**
   * Create a Payment Link in Razorpay Test Mode, or return a simulated test link for Demo Mode.
   */
  static async createPaymentLink(paymentData, customerData, caseId, isDemo = false) {
    const amountInPaise = Math.round((paymentData.amount || 2499) * 100);

    // Format phone contact to 10 digits
    const rawPhone = String(customerData?.phone || '9876543210').replace(/\D/g, '');
    const formattedPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9876543210';

    if (isDemo) {
      console.log('[RAZORPAY DEMO] Operating in Demo Mode. Using simulated Razorpay payment link.');
      const mockLinkId = `plink_mock_${Math.random().toString(36).substring(2, 11)}`;
      const shortUrl = `http://localhost:5000/api/demo/pay-simulate/${mockLinkId}`;
      return {
        id: mockLinkId,
        status: 'created',
        amount: amountInPaise,
        currency: 'INR',
        short_url: shortUrl,
        mode: 'demo',
        customer: {
          name: customerData?.name || 'Customer',
          email: customerData?.email || 'customer@example.com',
          contact: formattedPhone
        }
      };
    }

    if (!this.isConfigured()) {
      throw new Error('Razorpay Test Mode requires valid credentials. Please set RAZORPAY_KEY_ID (starting with rzp_test_) and RAZORPAY_KEY_SECRET in backend/.env.');
    }

    try {
      console.log(`[RAZORPAY TEST MODE] Creating official Razorpay Test Mode Payment Link for Case ${caseId}...`);
      const rzp = this.getClient();
      
      const payload = {
        amount: amountInPaise,
        currency: 'INR',
        accept_partial: false,
        first_min_partial_amount: 0,
        description: `Revenue Recovery Case ${caseId}`,
        customer: {
          name: customerData?.name || 'Valued Customer',
          email: customerData?.email || 'customer@recoverai.demo',
          contact: formattedPhone
        },
        notify: {
          sms: false,
          email: true
        },
        reminder_enable: true,
        notes: {
          caseId: caseId
        },
        callback_url: `http://localhost:5173/cases/${caseId}?payment=success`,
        callback_method: 'get'
      };

      console.log('[RAZORPAY TEST MODE] Request payload:', payload);
      const link = await rzp.paymentLink.create(payload);

      console.log(`[RAZORPAY TEST MODE] Official Razorpay payment link created successfully: ${link.short_url} (ID: ${link.id})`);

      return {
        id: link.id,
        status: link.status,
        amount: link.amount,
        currency: link.currency,
        short_url: link.short_url,
        mode: 'test',
        raw: link
      };
    } catch (error) {
      const status = error.statusCode || error.status || (error.error && error.error.code);
      const desc = error.description || (error.error && error.error.description) || error.message || 'Unknown error';

      if (status === 401 || desc.toLowerCase().includes('authentication failed')) {
        console.error(`[RAZORPAY TEST MODE] Authentication failed. Verify that the TEST Key ID (${this.getKeyId()}) and TEST Key Secret belong to the same Razorpay TEST key pair.`);
        throw new Error(`[RAZORPAY TEST MODE] Authentication failed (HTTP 401): Verify that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env belong to the same active Razorpay TEST key pair.`);
      }

      console.error('[RAZORPAY TEST MODE ERROR] Razorpay API Call Failed:', desc);
      throw new Error(`Razorpay TEST API Error: ${desc}`);
    }
  }

  /**
   * Verify Razorpay Webhook Signature using raw body and secret.
   */
  static verifyWebhookSignature(rawBody, signature, webhookSecret) {
    if (!signature) return false;
    
    // Bypass for test mode simulated trigger
    if (signature === 'demo-mode-bypass-signature' || signature === 'test-mode-bypass-signature') {
      return true;
    }

    try {
      const secretToUse = webhookSecret || this.getWebhookSecret() || 'mockwebhooksecret123';
      const expectedSignature = crypto
        .createHmac('sha256', secretToUse)
        .update(rawBody || '')
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

module.exports = RazorpayService;
