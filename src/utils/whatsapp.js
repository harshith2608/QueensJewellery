import { formatPrice } from './formatters'

/**
 * Build a formatted WhatsApp order message from cart contents.
 * @param {Array<{ name: string, quantity: number, price: number, variant?: string }>} cartItems
 * @param {number} total - Final total after discount
 * @param {{ code: string, discount: number } | null} coupon - Applied coupon, if any
 * @returns {string} Plain-text message ready to be URL-encoded
 */
export const buildWhatsAppOrderMessage = (cartItems, total, coupon = null) => {
  const separator = '─'.repeat(28)

  const itemLines = cartItems
    .map((item) => {
      const variantLabel = item.variant ? ` (${item.variant})` : ''
      const lineTotal = formatPrice(item.price * item.quantity)
      return `• ${item.name}${variantLabel}\n  Qty: ${item.quantity}  |  ${formatPrice(item.price)} each  =  ${lineTotal}`
    })
    .join('\n')

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  let couponLine = ''
  if (coupon) {
    couponLine = `\nCoupon (${coupon.code}): -${formatPrice(coupon.discount)}`
  }

  const message = [
    '👑 *Queens Jewellery — New Order Enquiry*',
    separator,
    '*Items:*',
    itemLines,
    separator,
    `Subtotal: ${formatPrice(subtotal)}${couponLine}`,
    `*Total: ${formatPrice(total)}*`,
    separator,
    'Please confirm availability and share payment details. Thank you! 🙏',
  ].join('\n')

  return message
}

/**
 * Open WhatsApp in a new tab with a pre-filled message.
 * @param {string} phoneNumber - E.164 without '+', e.g. "919876543210"
 * @param {string} message - Plain-text message (will be URI-encoded)
 */
export const openWhatsApp = (phoneNumber, message) => {
  // Strip any non-digit characters from the phone number
  const cleaned = phoneNumber.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  const url = `https://wa.me/${cleaned}?text=${encoded}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
