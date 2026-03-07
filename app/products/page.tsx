'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compare_at_price: number | null
  images: string[]
  sizes: string[]
  colors: string[]
  is_featured: boolean
  gender?: string
  fit?: string
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const searchParams = useSearchParams()
  
  // Get category from URL
  const selectedCategory = searchParams.get('category') || 'all'
  
  // Format category name from URL for display
  const categoryName = selectedCategory === 'all' 
    ? 'All Products' 
    : selectedCategory.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  
  // Filter states
  const [openFilters, setOpenFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('manual')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedFits, setSelectedFits] = useState<string[]>([])
  const [stockStatus, setStockStatus] = useState<string>('all')

  const genderOptions = [
    { label: 'Men', value: 'men' },
    { label: 'Women', value: 'women' },
    { label: 'Unisex', value: 'unisex' },
  ]

  const fitOptions = [
    { label: 'Regular Fit', value: 'regular' },
    { label: 'Slim Fit', value: 'slim' },
    { label: 'Oversize Fit', value: 'oversize' },
    { label: 'Loose Fit', value: 'loose' },
    { label: 'Muscle Fit', value: 'muscle' },
  ]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()

      // Simple query first - just fetch active products
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)

      console.log('Selected category:', selectedCategory)
      console.log('Stock status:', stockStatus)
      console.log('Selected genders:', selectedGenders)
      console.log('Selected fits:', selectedFits)
      console.log('Price min:', priceMin, 'max:', priceMax)

      // Category filter - get from URL parameter directly
      if (selectedCategory !== 'all') {
        // Get category ID from slug and filter products
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', selectedCategory)
          .single()
        
        console.log('Category data:', categoryData, 'error:', categoryError)
        
        if (categoryData && !categoryError) {
          // Get all subcategory IDs in one query
          const { data: allCategories } = await supabase
            .from('categories')
            .select('id, parent_id')
            .eq('is_active', true)
          
          const childIds = allCategories?.filter(c => c.parent_id === categoryData.id).map(c => c.id) || []
          const categoryIds = [categoryData.id, ...childIds]
          console.log('Filtering by category IDs:', categoryIds)
          query = query.in('category_id', categoryIds)
        }
      }

      // Search filter
      const searchParam = searchParams.get('search')
      if (searchParam) {
        query = query.or(`name.ilike.%${searchParam}%,description.ilike.%${searchParam}%`)
      }

      // Price filter
      if (priceMin && !isNaN(parseFloat(priceMin))) {
        query = query.gte('price', parseFloat(priceMin))
      }
      if (priceMax && !isNaN(parseFloat(priceMax))) {
        query = query.lte('price', parseFloat(priceMax))
      }

      // Stock status filter - only apply if not 'all'
      if (stockStatus === 'in_stock') {
        query = query.gt('stock_quantity', 0)
      } else if (stockStatus === 'out_of_stock') {
        query = query.eq('stock_quantity', 0)
      }

      // Gender filter - only apply if selected
      if (selectedGenders.length > 0) {
        query = query.in('gender', selectedGenders)
      }

      // Fit filter - only apply if selected
      if (selectedFits.length > 0) {
        query = query.in('fit', selectedFits)
      }

      // Sorting
      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true })
          break
        case 'price-desc':
          query = query.order('price', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'name':
          query = query.order('name', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data: productsData, error } = await query
      console.log('Products fetched:', productsData?.length, 'error:', error)
      if (productsData) setProducts(productsData)
      setLoading(false)
    }

    fetchData()
  }, [selectedCategory, sortBy, priceMin, priceMax, selectedGenders, selectedFits, stockStatus, searchParams])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(price)
  }

  const toggleFilter = (filterId: string) => {
    setOpenFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    )
  }

  const handleGenderChange = (value: string) => {
    setSelectedGenders(prev => 
      prev.includes(value)
        ? prev.filter(g => g !== value)
        : [...prev, value]
    )
  }

  const handleFitChange = (value: string) => {
    setSelectedFits(prev => 
      prev.includes(value)
        ? prev.filter(f => f !== value)
        : [...prev, value]
    )
  }

  const clearFilters = () => {
    setPriceMin('')
    setPriceMax('')
    setSelectedGenders([])
    setSelectedFits([])
    setSortBy('manual')
    setStockStatus('all')
  }

  // Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={isMobile ? 'p-4' : ''}>
      {/* Availability Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleFilter('availability')}
          className="flex items-center justify-between w-full py-2 border-b border-gray-200"
        >
          <span className="text-sm font-medium text-gray-900">Availability</span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${openFilters.includes('availability') ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openFilters.includes('availability') && (
          <div className="py-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="stockStatus"
                checked={stockStatus === 'all'}
                onChange={() => setStockStatus('all')}
                className="w-4 h-4 border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm text-gray-600">All</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="stockStatus"
                checked={stockStatus === 'in_stock'}
                onChange={() => setStockStatus('in_stock')}
                className="w-4 h-4 border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm text-gray-600">In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="stockStatus"
                checked={stockStatus === 'out_of_stock'}
                onChange={() => setStockStatus('out_of_stock')}
                className="w-4 h-4 border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm text-gray-600">Out of Stock</span>
            </label>
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleFilter('price')}
          className="flex items-center justify-between w-full py-2 border-b border-gray-200"
        >
          <span className="text-sm font-medium text-gray-900">Price</span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${openFilters.includes('price') ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openFilters.includes('price') && (
          <div className="py-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>
          </div>
        )}
      </div>

      {/* Gender Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleFilter('gender')}
          className="flex items-center justify-between w-full py-2 border-b border-gray-200"
        >
          <span className="text-sm font-medium text-gray-900">Gender</span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${openFilters.includes('gender') ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openFilters.includes('gender') && (
          <div className="py-3 space-y-2">
            {genderOptions.map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGenders.includes(option.value)}
                  onChange={() => handleGenderChange(option.value)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-600">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Fit Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleFilter('fit')}
          className="flex items-center justify-between w-full py-2 border-b border-gray-200"
        >
          <span className="text-sm font-medium text-gray-900">Fit</span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${openFilters.includes('fit') ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openFilters.includes('fit') && (
          <div className="py-3 space-y-2">
            {fitOptions.map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFits.includes(option.value)}
                  onChange={() => handleFitChange(option.value)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-600">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="pt-1">
        <label className="text-sm font-medium text-gray-900 block mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
        >
          <option value="manual">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(priceMin || priceMax || selectedGenders.length > 0 || selectedFits.length > 0 || stockStatus !== 'all') && (
        <button
          onClick={clearFilters}
          className="mt-4 text-sm text-red-600 hover:text-red-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8">
        {/* Header with Hamburger and Title */}
        <div className="flex items-center gap-4 mb-4">
          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Breadcrumbs */}
          <nav className="flex-1">
            <ol className="flex items-center gap-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-black">Home</Link></li>
              <li>/</li>
              <li><Link href="/products" className="hover:text-black">Collections</Link></li>
              <li>/</li>
              <li className="text-black font-medium">{categoryName}</li>
            </ol>
          </nav>
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <h4 className="text-4xl md:text-5xl font-semibold text-gray-900">{categoryName}</h4>
        </div>

        <div className="flex gap-8">
          {/* Left Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Filter Button */}
            <div className="flex items-center justify-end mb-6 lg:mb-8">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 text-black font-medium hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-left">
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-black">
                        {product.name}
                      </h3>
                      {product.colors && product.colors.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {product.colors.length} {product.colors.length === 1 ? 'Color' : 'Colors'}
                        </p>
                      )}
                      {product.fit && (
                        <p className="text-sm text-gray-500">
                          {product.fit.charAt(0).toUpperCase() + product.fit.slice(1)} Fit
                        </p>
                      )}
                      <p className="text-base font-medium text-gray-900 mt-2">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {mobileFiltersOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 opacity-40 z-40 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 lg:hidden rounded-t-2xl max-h-[80vh] overflow-y-auto transform transition-transform duration-300 ease-in-out">
            <div className="sticky top-0 p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <h2 className="text-lg font-medium">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 pb-8">
              <FilterSidebar isMobile />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Wrapper component with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
