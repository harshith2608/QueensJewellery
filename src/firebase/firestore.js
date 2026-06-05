import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  increment,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './config'

// ─── Collection references ───────────────────────────────────────────────────

const categoriesRef = collection(db, 'categories')
const productsRef = collection(db, 'products')
const ordersRef = collection(db, 'orders')
const notificationsRef = collection(db, 'stock_notifications')
const testOrdersRef = collection(db, 'test_orders')
const couponsRef = collection(db, 'coupons')
const reviewsRef = collection(db, 'reviews')
const usersRef = collection(db, 'users')

// ─── Categories ───────────────────────────────────────────────────────────────

/** Get all active categories ordered by displayOrder (customer-facing). */
export const getCategories = async () => {
  const snap = await getDocs(categoriesRef)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

/** Get all categories including inactive ones (admin use). */
export const getAllCategories = async () => {
  const snap = await getDocs(categoriesRef)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

/** Add a new category document. */
export const addCategory = (data) => addDoc(categoriesRef, data)

/** Update an existing category. */
export const updateCategory = (id, data) =>
  updateDoc(doc(db, 'categories', id), data)

/** Delete a category by ID. */
export const deleteCategory = (id) => deleteDoc(doc(db, 'categories', id))

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * Get products with optional filters.
 * @param {{ categoryId?: string, featured?: boolean, limit?: number }} opts
 */
export const getProducts = async ({ categoryId, featured, limit } = {}) => {
  const constraints = []
  if (categoryId) constraints.push(where('categoryId', '==', categoryId))
  if (featured !== undefined) constraints.push(where('featured', '==', featured))

  const q = constraints.length ? query(productsRef, ...constraints) : productsRef
  const snap = await getDocs(q)
  let results = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.active !== false)
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))

  if (limit) results = results.slice(0, limit)
  return results
}

/** Get a single product by ID. */
export const getProductById = async (id) => {
  const snap = await getDoc(doc(db, 'products', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Client-side name search across all active products.
 * Fetches all active products and filters by query string (case-insensitive).
 * @param {string} queryStr
 */
export const searchProducts = async (queryStr) => {
  const q = query(productsRef, where('active', '==', true))
  const snap = await getDocs(q)
  const lower = queryStr.toLowerCase()
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(
      (p) =>
        p.name?.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower) ||
        p.tags?.some((t) => t.toLowerCase().includes(lower))
    )
}

/** Add a new product with a server-generated createdAt timestamp. */
export const addProduct = (data) =>
  addDoc(productsRef, { ...data, createdAt: serverTimestamp() })

/** Update an existing product. */
export const updateProduct = (id, data) =>
  updateDoc(doc(db, 'products', id), data)

/** Delete a product by ID. */
export const deleteProduct = (id) => deleteDoc(doc(db, 'products', id))

/**
 * Decrement product stock by the ordered quantity.
 * - If stock is null/undefined the product is unlimited — skip.
 * - If stock reaches 0, auto-deactivate the product.
 * @param {string} productId
 * @param {number} quantity
 */
export const decrementProductStock = async (productId, quantity) => {
  const ref = doc(db, 'products', productId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const { stock } = snap.data()
  if (stock === null || stock === undefined) return   // unlimited — nothing to do
  const newStock = Math.max(0, stock - quantity)
  const updates = { stock: newStock }
  if (newStock === 0) updates.active = false          // auto-deactivate when sold out
  await updateDoc(ref, updates)
}

/**
 * Get featured, active products.
 * @param {number} [limitN=8]
 */
export const getFeaturedProducts = async (limitN = 8) => {
  const snap = await getDocs(productsRef)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.active !== false && p.featured === true)
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    .slice(0, limitN)
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * Create a new order document.
 * @param {object} data - Order payload; createdAt is set server-side.
 */
export const createOrder = (data, isTestMode = false) =>
  addDoc(isTestMode ? testOrdersRef : ordersRef, {
    ...data,
    ...(isTestMode ? { _test: true } : {}),
    createdAt: serverTimestamp(),
  })

export const getTestOrders = async () => {
  const snap = await getDocs(testOrdersRef)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export const clearTestOrders = async () => {
  const snap = await getDocs(testOrdersRef)
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

/**
 * Get all orders for a specific user, newest first.
 * @param {string} userId
 */
export const getOrdersByUser = async (userId) => {
  const q = query(ordersRef, where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export const getAllOrders = async (status) => {
  const snap = await getDocs(ordersRef)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((o) => !status || o.status === status)
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

/**
 * Update the status of an order and append a status history entry.
 * @param {string} id - Order document ID
 * @param {string} status - New status string
 * @param {string} [note] - Optional note for the status history entry
 */
export const updateOrderStatus = (id, status, note = '') =>
  updateDoc(doc(db, 'orders', id), {
    status,
    updatedAt: serverTimestamp(),
    statusHistory: arrayUnion({
      status,
      note,
      timestamp: new Date().toISOString(),
    }),
  })

// ─── Coupons ──────────────────────────────────────────────────────────────────

/**
 * Look up a coupon by its code string.
 * @param {string} code
 * @returns {Promise<object|null>}
 */
export const getCouponByCode = async (code) => {
  const q = query(couponsRef, where('code', '==', code.toUpperCase()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

/** Get all coupons (admin). */
export const getAllCoupons = async () => {
  const snap = await getDocs(couponsRef)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Add a new coupon. */
export const addCoupon = (data) => addDoc(couponsRef, data)

/** Update an existing coupon. */
export const updateCoupon = (id, data) =>
  updateDoc(doc(db, 'coupons', id), data)

/** Delete a coupon. */
export const deleteCoupon = (id) => deleteDoc(doc(db, 'coupons', id))

/** Atomically increment a coupon's usedCount by 1. */
export const incrementCouponUsage = (id) =>
  updateDoc(doc(db, 'coupons', id), { usedCount: increment(1) })

// ─── Reviews ──────────────────────────────────────────────────────────────────

/** Add a new review with server timestamp. */
export const addReview = (data) =>
  addDoc(reviewsRef, { ...data, createdAt: serverTimestamp() })

/**
 * Get approved reviews for a product, newest first.
 * @param {string} productId
 */
export const getProductReviews = async (productId) => {
  const q = query(
    reviewsRef,
    where('productId', '==', productId),
    where('approved', '==', true),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Get all reviews (admin, including unapproved). */
export const getAllReviews = async () => {
  const q = query(reviewsRef, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Approve or reject a review.
 * @param {string} id
 * @param {boolean} approved
 */
export const updateReviewApproval = (id, approved) =>
  updateDoc(doc(db, 'reviews', id), { approved })

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Fetch user doc; create it with defaults if it doesn't exist yet.
 * @param {string} uid
 * @param {string} phone - E.164 phone number
 * @returns {Promise<object>}
 */
export const getOrCreateUser = async (uid, phone) => {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() }
  }

  const defaults = {
    uid,
    phone,
    name: '',
    email: '',
    addresses: [],
    createdAt: serverTimestamp(),
    role: 'customer',
  }

  await setDoc(userRef, defaults)
  return { id: uid, ...defaults }
}

/** Update user profile data. */
export const updateUser = (uid, data) =>
  updateDoc(doc(db, 'users', uid), data)

/** Get a user document by UID. */
export const getUserById = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/** Fetch the global store settings document. */
export const getSettings = async () => {
  const snap = await getDoc(doc(db, 'settings', 'main'))
  if (!snap.exists()) return {}
  return snap.data()
}

/**
 * Merge-update the global store settings document.
 * @param {object} data
 */
export const updateSettings = (data) =>
  setDoc(doc(db, 'settings', 'main'), data, { merge: true })

// ─── Stock Notifications ───────────────────────────────────────────────────────

/**
 * Save a "notify me" request for an out-of-stock product.
 * Uses a deterministic doc ID (productId_phone) to prevent duplicates
 * without needing a read query — avoids Firestore index + permission issues.
 */
export const addStockNotification = async ({ productId, productName, phone }) => {
  const docId = `${productId}_${phone}`
  const ref = doc(db, 'stock_notifications', docId)
  await setDoc(ref, {
    productId,
    productName,
    phone,
    notified: false,
    createdAt: serverTimestamp(),
  })
  return { duplicate: false }
}

/** Get all pending (not yet notified) stock notification requests. */
export const getPendingNotifications = async () => {
  const q = query(notificationsRef, where('notified', '==', false))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

/** Mark a notification request as notified. */
export const markNotified = (id) =>
  updateDoc(doc(db, 'stock_notifications', id), {
    notified: true,
    notifiedAt: serverTimestamp(),
  })

/** Mark all pending requests for a product as notified. */
export const markAllNotifiedForProduct = async (productId) => {
  const q = query(
    notificationsRef,
    where('productId', '==', productId),
    where('notified', '==', false)
  )
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => markNotified(d.id)))
}

/** Delete a single notification request. */
export const deleteNotification = (id) =>
  deleteDoc(doc(db, 'stock_notifications', id))

// ─── Refunds ──────────────────────────────────────────────────────────────────

const refundsRef = collection(db, 'refunds')

/** Create a new refund request (customer-submitted). */
export const createRefundRequest = (data) =>
  addDoc(refundsRef, { ...data, status: 'pending', createdAt: new Date().toISOString() })

/** Get all refund requests for a specific user. */
export const getRefundsByUser = async (userId) => {
  const q = query(refundsRef, where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/** Get a refund by orderId (to check if one already exists). */
export const getRefundByOrderId = async (orderId) => {
  const q = query(refundsRef, where('orderId', '==', orderId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

/** Get all refund requests (admin). */
export const getAllRefunds = async () => {
  const snap = await getDocs(refundsRef)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/** Update refund status (admin: approve/reject with note). */
export const updateRefundStatus = (id, status, adminNote = '') =>
  updateDoc(doc(db, 'refunds', id), {
    status,
    adminNote,
    updatedAt: new Date().toISOString(),
  })
