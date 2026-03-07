'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  subtotal: number
  tax: number
  shipping_cost: number
  shipping_name: string | null
  shipping_email: string | null
  shipping_phone: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_postal_code: string | null
  notes: string | null
  created_at: string
  user_id: string | null
  profiles?: { email: string }
  order_items?: OrderItem[]
}

interface OrderItem {
  id: string
  product_name: string
  product_price: number
  quantity: number
  size: string | null
  color: string | null
  subtotal: number
}

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, profiles(email), order_items(*)')
      .order('created_at', { ascending: false })
    
    if (data) setOrders(data)
    setLoading(false)
  }

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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    
    fetchOrders()
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.profiles?.email || 'Guest'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${getStatusColor(order.status)}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Order #{selectedOrder.order_number}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 rounded-md p-4 text-sm">
                    <p><strong>Email:</strong> {selectedOrder.profiles?.email || selectedOrder.shipping_email || 'N/A'}</p>
                    {selectedOrder.shipping_name && (
                      <p><strong>Name:</strong> {selectedOrder.shipping_name}</p>
                    )}
                    {selectedOrder.shipping_phone && (
                      <p><strong>Phone:</strong> {selectedOrder.shipping_phone}</p>
                    )}
                    {selectedOrder.shipping_address && (
                      <p><strong>Address:</strong> {selectedOrder.shipping_address}</p>
                    )}
                    {selectedOrder.shipping_city && (
                      <p><strong>City:</strong> {selectedOrder.shipping_city}</p>
                    )}
                    {selectedOrder.shipping_postal_code && (
                      <p><strong>Postal Code:</strong> {selectedOrder.shipping_postal_code}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Order Items</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Price</th>
                          <th className="px-4 py-2 text-left">Qty</th>
                          <th className="px-4 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedOrder.order_items?.map((item: OrderItem) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">
                              {item.product_name}
                              {item.size && <span className="text-gray-500"> - Size: {item.size}</span>}
                              {item.color && <span className="text-gray-500"> - Color: {item.color}</span>}
                            </td>
                            <td className="px-4 py-2">{formatPrice(item.product_price)}</td>
                            <td className="px-4 py-2">× {item.quantity}</td>
                            <td className="px-4 py-2 text-right">{formatPrice(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Order Summary</h3>
                  <div className="bg-gray-50 rounded-md p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(selectedOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatPrice(selectedOrder.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total</span>
                      <span>{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                    <p className="bg-gray-50 rounded-md p-4 text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
