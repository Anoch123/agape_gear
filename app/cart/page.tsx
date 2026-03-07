'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  size: string
  color: string
  products: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    stock_quantity: number
  }
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchCart = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setCartItems(data)
      setLoading(false)
    }

    fetchCart()
  }, [router, supabase])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(price)
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId)
      return
    }

    setUpdating(itemId)
    
    await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId)

    // Update local state
    setCartItems(cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ))
    setUpdating(null)
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    setCartItems(cartItems.filter(item => item.id !== itemId))
    setUpdating(null)
  }

  const subtotal = cartItems.reduce((sum, item) => 
    sum + (item.products.price * item.quantity), 0
  )

  const shipping = subtotal > 5000 ? 0 : 500
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  const handleCheckout = () => {
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <Link href="/products" className="text-black font-medium hover:underline">
              Continue Shopping →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-4 flex gap-4"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.products.images && item.products.images[0] ? (
                      <img
                        src={item.products.images[0]}
                        alt={item.products.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <Link 
                      href={`/products/${item.products.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-black"
                    >
                      {item.products.name}
                    </Link>
                    <div className="text-sm text-gray-500 mt-1">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.size && item.color && <span> | </span>}
                      {item.color && <span>Color: {item.color}</span>}
                    </div>
                    <div className="text-lg font-bold text-black mt-2">
                      {formatPrice(item.products.price)}
                    </div>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                      disabled={updating === item.id}
                    >
                      ×
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                        disabled={updating === item.id}
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                        disabled={updating === item.id || item.quantity >= item.products.stock_quantity}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link href="/products" className="text-black font-medium hover:underline">
                ← Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Free' : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {shipping > 0 && (
                  <p className="text-sm text-gray-500 mt-4">
                    Add {formatPrice(Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) - subtotal)} more for free shipping!
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
