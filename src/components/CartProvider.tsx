import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, type CartItem, type CartContextValue } from '../context/cart'

const CART_STORAGE_KEY = 'togurumi-cart'

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart())

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore quota / private mode
    }
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue['addItem'] = (item) => {
      setItems((current) => {
        const existing = current.find((entry) => entry.slug === item.slug)
        if (existing) {
          return current.map((entry) =>
            entry.slug === item.slug ? { ...entry, quantity: entry.quantity + 1 } : entry,
          )
        }
        return [...current, { ...item, quantity: 1 }]
      })
    }

    const removeItem: CartContextValue['removeItem'] = (slug) => {
      setItems((current) => current.filter((entry) => entry.slug !== slug))
    }

    const updateQuantity: CartContextValue['updateQuantity'] = (slug, quantity) => {
      if (quantity <= 0) {
        setItems((current) => current.filter((entry) => entry.slug !== slug))
        return
      }
      setItems((current) => current.map((entry) => (entry.slug === slug ? { ...entry, quantity } : entry)))
    }

    return {
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      addItem,
      removeItem,
      updateQuantity,
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
