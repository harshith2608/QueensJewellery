/**
 * Format a number as Indian Rupees.
 * e.g. 1234 → "₹1,234"
 * @param {number} amount
 * @returns {string}
 */
export const formatPrice = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a Firestore Timestamp, Date, or ISO string to a human-readable date.
 * e.g. → "12 Jan 2025"
 * @param {import('firebase/firestore').Timestamp | Date | string | number} timestamp
 * @returns {string}
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return ''

  let date
  if (timestamp?.toDate) {
    // Firestore Timestamp
    date = timestamp.toDate()
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else {
    date = new Date(timestamp)
  }

  if (isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Gold & Diamond Ring" → "gold-diamond-ring"
 * @param {string} text
 * @returns {string}
 */
export const slugify = (text) => {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')        // spaces/underscores → hyphen
    .replace(/[^\w-]+/g, '')        // remove non-word chars except hyphens
    .replace(/--+/g, '-')           // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '')        // strip leading/trailing hyphens
}
