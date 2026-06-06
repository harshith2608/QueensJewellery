import { createContext, useContext, useEffect, useState } from 'react'

const CART_KEY = 'qj_cart'

const CartContext = createContext(null)

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart)

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    saveCart(cartItems)
  }, [cartItems])

  const addToCart = (product) => {
    setCartItems((prev) => {
      // Use id + selectedSize as unique cart key so same product in different sizes = separate items
      const cartKey = product.selectedSize ? `${product.id}_${product.selectedSize}` : product.id
      const existing = prev.find((item) => item.cartKey === cartKey)
      if (existing) {
        const maxQty = item => item.stock === null ? Infinity : (item.stock ?? 99)
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: Math.min(item.quantity + 1, maxQty(item)) }
            : item
        )
      }
      return [
        ...prev,
        {
          cartKey,
          id: product.id,
          name: product.name,
          price: product.price,
          salePrice: product.salePrice ?? null,
          image: product.media?.find((m) => m.type === 'image')?.url ?? product.media?.[0]?.url ?? '',
          quantity: 1,
          stock: product.stock ?? null,
          selectedSize: product.selectedSize || null,
        },
      ]
    })
  }

  const removeFromCart = (cartKey) => {
    setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey))
  }

  const updateQuantity = (cartKey, qty) => {
    if (qty < 1) {
      removeFromCart(cartKey)
      return
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartKey !== cartKey) return item
        const maxQty = item.stock === null ? Infinity : (item.stock ?? 99)
        return { ...item, quantity: Math.min(qty, maxQty) }
      })
    )
  }

  const clearCart = () => setCartItems([])

  const isInCart = (id) => cartItems.some((item) => item.id === id)

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const cartTotal = cartItems.reduce((sum, item) => {
    const effectivePrice =
      item.salePrice != null && item.salePrice < item.price
        ? item.salePrice
        : item.price
    return sum + effectivePrice * item.quantity
  }, 0)

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
