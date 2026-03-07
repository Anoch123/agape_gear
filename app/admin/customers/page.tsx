'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  is_active: boolean
  created_at: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
    
    if (data) setCustomers(data)
    setLoading(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const toggleActive = async (customer: Profile) => {
    await supabase
      .from('profiles')
      .update({ is_active: !customer.is_active })
      .eq('id', customer.id)
    
    fetchCustomers()
  }

  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase()
    return (
      customer.email.toLowerCase().includes(query) ||
      customer.full_name?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    )
  })

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-md px-4 py-2"
          />
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className={!customer.is_active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(customer)}
                        className={`${
                          customer.is_active
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {customer.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No customers found
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
