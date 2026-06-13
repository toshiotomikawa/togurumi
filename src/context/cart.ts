import { createContext } from 'react'

export type CartItem = {
  slug: string
  name: string
  price: number
  quantity: number
}

export type CartContextValue = {
  items: CartItem[]
  itemCount: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (slug: string) => void
  updateQuantity: (slug: string, quantity: number) => void
}

export const CartContext = createContext<CartContextValue | null>(null)
