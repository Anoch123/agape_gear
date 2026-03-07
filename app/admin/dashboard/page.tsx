'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

interface Stats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  pendingOrders: number
  recentOrders: any[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentOrders: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        // Fetch total products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        // Fetch total orders
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })

        // Fetch total customers
        const { count: customersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer')

        // Fetch pending orders
        const { count: pendingCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Fetch total revenue
        const { data: revenueData } = await supabase
          .from('orders')
          .select('total')
          .in('status', ['processing', 'shipped', 'delivered'])

      const totalRevenue = revenueData?.reduce((sum: number, order: any) => sum + order.total, 0) || 0

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalCustomers: customersCount || 0,
        totalRevenue,
        pendingOrders: pendingCount || 0,
        recentOrders: recentOrders || [],
      })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-LK', {
      month: 'short',
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
      default: return 'bg-gray-100 text-gray-800'
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCustomers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatPrice(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Pending Orders Alert */}
        {stats.pendingOrders > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800">
              <span className="font-bold">{stats.pendingOrders}</span> pending orders require attention
            </p>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          
          {stats.recentOrders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No orders yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.profiles?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t">
            <a href="/admin/orders" className="text-black font-medium hover:underline">
              View all orders →
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
