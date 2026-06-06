const { onCall, HttpsError } = require('firebase-functions/v2/https')
const REGION = 'asia-south1' // Mumbai — lowest latency for India
// v2 — forces redeploy to pick up updated secrets
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const Razorpay = require('razorpay')
const crypto = require('crypto')

admin.initializeApp()

// ── Secrets (set via: firebase functions:secrets:set RAZORPAY_KEY_ID etc.) ────
const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET')

// ─── Helper ───────────────────────────────────────────────────────────────────
function getRazorpay(keyId, keySecret) {
  return new Razorpay({ key_id: keyId.trim(), key_secret: keySecret.trim() })
}

/**
 * createRazorpayOrder
 * Called by client before opening Razorpay checkout.
 * Creates a server-side order with a locked amount.
 *
 * Input:  { amount: number (rupees), currency?: string, receipt?: string }
 * Output: { orderId, amount, currency }
 */
exports.createRazorpayOrder = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], region: REGION },
  async (request) => {
    const { amount, currency = 'INR', receipt } = request.data

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new HttpsError('invalid-argument', 'Valid amount in rupees is required.')
    }

    const razorpay = getRazorpay(RAZORPAY_KEY_ID.value(), RAZORPAY_KEY_SECRET.value())

    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // convert rupees → paise
        currency,
        receipt: receipt || `qj_${Date.now()}`,
      })

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      }
    } catch (err) {
      console.error('Razorpay order creation failed:', err)
      throw new HttpsError('internal', 'Failed to create payment order. Please try again.')
    }
  }
)

/**
 * verifyRazorpayPayment
 * Called by client after Razorpay payment success.
 * Verifies the payment signature server-side before saving the order.
 *
 * Input:  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Output: { verified: true }
 */
exports.verifyRazorpayPayment = onCall(
  { secrets: [RAZORPAY_KEY_SECRET], region: REGION },
  async (request) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.data

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpsError('invalid-argument', 'Missing payment verification fields.')
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET.value())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch — possible payment tampering')
      throw new HttpsError('permission-denied', 'Payment verification failed.')
    }

    return { verified: true }
  }
)

/**
 * processRazorpayRefund
 * Admin-only. Initiates a refund via Razorpay API and updates Firestore atomically.
 *
 * Input:  { paymentId, amount (rupees), refundId, orderId, adminNote? }
 * Output: { razorpayRefundId, status }
 */
exports.processRazorpayRefund = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], region: REGION },
  async (request) => {
    // Admin-only: email-authenticated users only
    if (!request.auth?.token?.email) {
      throw new HttpsError('unauthenticated', 'Admin authentication required.')
    }

    const { paymentId, amount, refundId, orderId, adminNote = '' } = request.data

    if (!paymentId || !amount || !orderId) {
      throw new HttpsError('invalid-argument', 'Missing required fields: paymentId, amount, orderId.')
    }

    const razorpay = getRazorpay(RAZORPAY_KEY_ID.value(), RAZORPAY_KEY_SECRET.value())

    let rzRefund
    try {
      rzRefund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(amount * 100), // rupees → paise
        speed: 'normal',
        notes: { orderId, reason: adminNote || 'Refund approved by admin' },
      })
    } catch (err) {
      console.error('Razorpay refund failed:', err)
      const message = err.error?.description || err.message || 'Razorpay refund failed. Please try again.'
      throw new HttpsError('internal', message)
    }

    // Update Firestore atomically
    const db = admin.firestore()
    const batch = db.batch()

    // Only update refund doc if a refundId was provided (customer-submitted refund request)
    if (refundId) {
      batch.update(db.collection('refunds').doc(refundId), {
        status: 'approved',
        adminNote: adminNote || 'Refund approved by admin',
        razorpayRefundId: rzRefund.id,
        razorpayRefundStatus: rzRefund.status,
        updatedAt: new Date().toISOString(),
      })
    }

    batch.update(db.collection('orders').doc(orderId), {
      refunded: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status: 'refunded',
        note: adminNote || 'Refund approved by admin',
        timestamp: new Date().toISOString(),
      }),
    })

    await batch.commit()

    return { razorpayRefundId: rzRefund.id, status: rzRefund.status }
  }
)
