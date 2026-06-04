const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

/**
 * Dynamically load the Razorpay Checkout script.
 * Safe to call multiple times — resolves immediately if already loaded.
 * @returns {Promise<void>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.Razorpay) {
      resolve()
      return
    }

    // Script tag already injected but not yet ready
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', resolve)
      existing.addEventListener('error', () =>
        reject(new Error('Razorpay script failed to load'))
      )
      return
    }

    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.body.appendChild(script)
  })
}

/**
 * Load Razorpay and open the payment modal.
 *
 * @param {{
 *   amount: number,        // Amount in PAISE (rupees × 100)
 *   orderId: string,       // Razorpay Order ID from your backend
 *   name: string,          // Customer name
 *   email: string,         // Customer email
 *   phone: string,         // Customer phone (10 digits)
 *   onSuccess: (response: { razorpay_payment_id: string, razorpay_order_id: string, razorpay_signature: string }) => void,
 *   onFailure: (error: Error) => void,
 * }} options
 * @returns {Promise<void>}
 */
export const initiateRazorpayPayment = async ({
  amount,
  orderId,
  name,
  email,
  phone,
  isTestMode = false,
  onSuccess,
  onFailure,
}) => {
  try {
    await loadRazorpayScript()
  } catch (err) {
    onFailure(err)
    return
  }

  // Normalize phone: strip leading + so Razorpay prefill works reliably
  const normalizedPhone = phone ? phone.replace(/^\+/, '') : ''

  const options = {
    key: isTestMode
      ? (import.meta.env.VITE_RAZORPAY_TEST_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID)
      : import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount,                         // paise
    currency: 'INR',
    name: 'Queens Jewellery',
    description: 'Order Payment',
    image: '/logo.png',             // update with actual logo path
    ...(orderId ? { order_id: orderId } : {}),
    prefill: {
      name,
      email,
      contact: normalizedPhone,
    },
    theme: {
      color: '#B76E79',             // rose-gold brand colour
    },
    handler: (response) => {
      onSuccess(response)
    },
    modal: {
      ondismiss: () => {
        onFailure(new Error('Payment cancelled by user'))
      },
    },
  }

  const rzp = new window.Razorpay(options)

  rzp.on('payment.failed', (response) => {
    onFailure(
      new Error(
        response.error?.description || 'Payment failed. Please try again.'
      )
    )
  })

  rzp.open()
}
