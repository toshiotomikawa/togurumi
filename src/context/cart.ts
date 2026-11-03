import { createContext } from 'react'

export type CartItem = {
  slug: string
  name: string
  price: number
  color?: string
  quantity: number
}

export type CartContextValue = {
  items: CartItem[]
  itemCount: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (slug: string, color?: string) => void
  updateQuantity: (slug: string, quantity: number, color?: string) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
