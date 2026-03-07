'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  order_items: {
    id: string
    product_name: string
    quantity: number
    size: string | null
    color: string | null
  }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setOrders(data)
      setLoading(false)
    }

    fetchOrders()
  }, [router, supabase])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">You haven't placed any orders yet</p>
            <a href="/products" className="text-black font-medium hover:underline">
              Start Shopping →
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Number</p>
                    <p className="text-lg font-semibold text-gray-900">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-gray-900">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-bold text-black">{formatPrice(order.total)}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Items</h3>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-900">{item.product_name}</p>
                          {item.size && (
                            <p className="text-sm text-gray-500">Size: {item.size}</p>
                          )}
                          {item.color && (
                            <p className="text-sm text-gray-500">Color: {item.color}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900">× {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
