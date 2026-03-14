'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
  parent_id: string | null
  show_in_navbar: boolean
  children?: Category[]
}

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[]
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    sort_order: '0',
    parent_id: '',
    show_in_navbar: false,
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      
      if (error) {
        console.log('Error fetching categories, trying without show_in_navbar:', error)
        // Fallback: fetch with only known columns
        const { data: fallbackData } = await supabase
          .from('categories')
          .select('id, name, slug, description, image_url, is_active, sort_order, parent_id')
          .order('sort_order')
        
        if (fallbackData) {
          // Add default show_in_navbar and image_url to false/null for all
          const categoriesWithDefault = fallbackData.map(cat => ({
            ...cat,
            show_in_navbar: false,
            image_url: null
          }))
          setCategories(categoriesWithDefault)
        }
        setLoading(false)
        return
      }

      if (data) {
        // Ensure show_in_navbar and image_url exist, default to false/null if not
        const categoriesWithDefault = data.map(cat => ({
          ...cat,
          show_in_navbar: cat.show_in_navbar ?? false,
          image_url: cat.image_url ?? null
        }))
        setCategories(categoriesWithDefault)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
    setLoading(false)
  }

  // Build hierarchical tree structure
  const categoryTree = useMemo(() => {
    const categoryMap = new Map<string, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []

    // First pass: create all category objects with empty children arrays
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree structure
    categories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id)!
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id)!.children.push(categoryWithChildren)
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })

    // Sort children by sort_order
    const sortChildren = (cats: CategoryWithChildren[]) => {
      cats.sort((a, b) => a.sort_order - b.sort_order)
      cats.forEach(cat => sortChildren(cat.children))
    }
    sortChildren(rootCategories)

    return rootCategories
  }, [categories])

  // Filter categories based on search and status
  const filteredTree = useMemo(() => {
    const filterTree = (cats: CategoryWithChildren[]): CategoryWithChildren[] => {
      return cats
        .filter(cat => {
          const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cat.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
          
          const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'active' && cat.is_active) ||
            (filterStatus === 'inactive' && !cat.is_active)
          
          // Include if matches criteria or has matching children
          if (matchesSearch && matchesStatus) return true
          
          const filteredChildren = filterTree(cat.children)
          return filteredChildren.length > 0
        })
        .map(cat => ({
          ...cat,
          children: filterTree(cat.children)
        }))
    }
    
    return filterTree(categoryTree)
  }, [categoryTree, searchQuery, filterStatus])

  // Flatten tree for counting
  const flattenCategories = (cats: CategoryWithChildren[]): Category[] => {
    return cats.reduce<Category[]>((acc, cat) => {
      acc.push(cat)
      acc.push(...flattenCategories(cat.children))
      return acc
    }, [])
  }

  const flatFiltered = flattenCategories(filteredTree)

  // Stats
  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    inactive: categories.filter(c => !c.is_active).length,
    topLevel: categories.filter(c => !c.parent_id).length,
    subCategories: categories.filter(c => c.parent_id).length,
    inNavbar: categories.filter(c => c.show_in_navbar).length,
  }), [categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Build category data - include show_in_navbar only if it's set to true
    const categoryData: any = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      image_url: formData.image_url || null,
      sort_order: parseInt(formData.sort_order),
      parent_id: formData.parent_id || null,
    }

    // Only add show_in_navbar if it's true (to avoid errors if column doesn't exist)
    if (formData.show_in_navbar) {
      categoryData.show_in_navbar = true
    }

    try {
      if (editingCategory) {
        await supabase.from('categories').update(categoryData).eq('id', editingCategory.id)
      } else {
        await supabase.from('categories').insert(categoryData)
      }
    } catch (err) {
      console.error('Error saving category:', err)
      // Try without show_in_navbar if it fails
      const categoryDataWithoutNavbar = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        sort_order: parseInt(formData.sort_order),
        parent_id: formData.parent_id || null,
      }
      
      if (editingCategory) {
        await supabase.from('categories').update(categoryDataWithoutNavbar).eq('id', editingCategory.id)
      } else {
        await supabase.from('categories').insert(categoryDataWithoutNavbar)
      }
    }

    setShowModal(false)
    setEditingCategory(null)
    resetForm()
    fetchCategories()
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      sort_order: category.sort_order.toString(),
      parent_id: category.parent_id || '',
      show_in_navbar: category.show_in_navbar ?? false,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    // Check if category has children
    const hasChildren = categories.some(c => c.parent_id === id)
    const categoryName = categories.find(c => c.id === id)?.name
    
    if (hasChildren) {
      alert(`Cannot delete "${categoryName}" because it has subcategories. Please delete or reassign the subcategories first.`)
      return
    }

    if (confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      await supabase.from('categories').delete().eq('id', id)
      fetchCategories()
    }
  }

  const toggleActive = async (category: Category) => {
    await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)
    fetchCategories()
  }

  const toggleNavbar = async (category: Category) => {
    try {
      await supabase
        .from('categories')
        .update({ show_in_navbar: !category.show_in_navbar })
        .eq('id', category.id)
    } catch (err) {
      console.error('Error toggling navbar:', err)
      alert('Failed to update navbar visibility. Please ensure the database migration has been run.')
    }
    fetchCategories()
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `categories/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        alert('Failed to upload image')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrl })
    } catch (err) {
      console.error('Error uploading image:', err)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, image_url: e.target.value })
  }

  const removeImage = () => {
    setFormData({ ...formData, image_url: '' })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      sort_order: '0',
      parent_id: '',
      show_in_navbar: false,
    })
  }

  const handleDuplicate = (category: Category) => {
    setEditingCategory(null)
    setFormData({
      name: `${category.name} (Copy)`,
      slug: `${category.slug}-copy`,
      description: category.description || '',
      image_url: category.image_url || '',
      sort_order: (category.sort_order + 1).toString(),
      parent_id: category.parent_id || '',
      show_in_navbar: false,
    })
    setShowModal(true)
  }

  // Render category row with hierarchy
  const renderCategoryRow = (category: CategoryWithChildren, level: number = 0, isLast: boolean = false, siblingCount: number = 1) => {
    const hasChildren = category.children.length > 0
    const paddingLeft = level * 32 + 16

    return (
      <div key={category.id}>
        <div 
          className={`flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
            !category.is_active ? 'opacity-60' : ''
          }`}
          style={{ paddingLeft }}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-6">
            {hasChildren && (
              <button
                onClick={() => {
                  // Toggle expansion state if we add that feature
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${
            hasChildren ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {category.image_url ? (
              <img 
                src={category.image_url} 
                alt={category.name} 
                className="w-full h-full object-cover"
              />
            ) : hasChildren ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{category.name}</span>
              {hasChildren && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {category.children.length} subcategories
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 truncate">{category.slug}</div>
            {category.description && (
              <div className="text-xs text-gray-400 truncate mt-1">{category.description}</div>
            )}
          </div>

          {/* Sort Order */}
          <div className="text-sm text-gray-500 w-16 text-center">
            <span className="inline-block w-8 text-center bg-gray-100 rounded px-2 py-1">
              {category.sort_order}
            </span>
          </div>

          {/* Status */}
          <div className="w-24">
            <button
              onClick={() => toggleActive(category)}
              className={`w-full px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category.is_active
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.is_active ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Active
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Inactive
                </span>
              )}
            </button>
          </div>

          {/* Navbar Toggle */}
          <div className="w-24">
            <button
              onClick={() => toggleNavbar(category)}
              className={`w-full px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category.show_in_navbar
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={category.show_in_navbar ? 'Click to hide from navbar' : 'Click to show in navbar'}
            >
              {category.show_in_navbar ? (
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Nav
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Hide
                </span>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(category)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit category"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleDuplicate(category)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Duplicate category"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete category"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Render children recursively */}
        {category.children.map((child, index) => 
          renderCategoryRow(child, level + 1, index === category.children.length - 1, category.children.length)
        )}
      </div>
    )
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage your product categories and hierarchy</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingCategory(null)
            setShowModal(true)
          }}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Categories</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Top Level</p>
                <p className="text-xl font-bold text-gray-900">{stats.topLevel}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h18M4 12h18M4 18h7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">In Navbar</p>
                <p className="text-xl font-bold text-gray-900">{stats.inNavbar}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search categories by name, slug, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-gray-600 sm:whitespace-nowrap">Status:</span>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    filterStatus === 'all' 
                      ? 'bg-black text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                    filterStatus === 'active' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('inactive')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                    filterStatus === 'inactive' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>
          
          {/* Results count */}
          {searchQuery || filterStatus !== 'all' ? (
            <p className="text-sm text-gray-500 mt-3">
              Showing {flatFiltered.length} of {categories.length} categories
            </p>
          ) : null}
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {/* Table Header - Hidden on mobile, visible on tablet+ */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-500">
            <div className="md:col-span-1"></div>
            <div className="md:col-span-1"></div>
            <div className="md:col-span-4">Category</div>
            <div className="md:col-span-1 text-center">Order</div>
            <div className="md:col-span-2 text-center">Status</div>
            <div className="md:col-span-2 text-center">Navbar</div>
            <div className="md:col-span-1 text-right">Actions</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {flatFiltered.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by creating your first category'}
                </p>
                {!searchQuery && filterStatus === 'all' && (
                  <button
                    onClick={() => {
                      resetForm()
                      setEditingCategory(null)
                      setShowModal(true)
                    }}
                    className="mt-4 text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Add Category →
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile View - Card Layout */}
                <div className="md:hidden">
                  {flatFiltered.map((category) => (
                    <div 
                      key={category.id} 
                      className={`p-4 border-b border-gray-100 ${!category.is_active ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                            category.children?.length ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {category.image_url ? (
                              <img 
                                src={category.image_url} 
                                alt={category.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : category.children?.length ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{category.name}</span>
                              {category.children?.length ? (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                  {category.children.length} sub
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm text-gray-500 truncate">/{category.slug}</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleActive(category)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              category.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => toggleNavbar(category)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              category.show_in_navbar
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {category.show_in_navbar ? 'Nav' : 'Hide'}
                          </button>
                          <span className="text-xs text-gray-400">Order: {category.sort_order}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(category)}
                          className="flex-1 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(category)}
                          className="flex-1 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop View - Table Layout */}
                <div className="hidden md:block">
                  {filteredTree.map((category) => renderCategoryRow(category))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <span>Folder = Has subcategories</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <span>Tag = Subcategory</span>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                    placeholder="e.g., Electronics, Clothing, Books"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">The display name for this category</p>
                </div>

                {/* Slug Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                      /products/
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="category-slug"
                      className="flex-1 border border-gray-300 rounded-r-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Used in URLs: yourdomain.com/products/{formData.slug || 'category-slug'}</p>
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description for this category..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  />
                </div>

                {/* Category Image - Only for parent categories */}
                {!formData.parent_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Image
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Add an image for this parent category (recommended size: 400x400px)</p>
                    
                    {/* Current Image Preview */}
                    {formData.image_url && (
                      <div className="mb-3">
                        <div className="relative inline-block">
                          <img 
                            src={formData.image_url} 
                            alt="Category preview" 
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upload New Image */}
                    {!formData.image_url && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                          id="category-image-upload"
                        />
                        <label
                          htmlFor="category-image-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          {uploadingImage ? (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2"></div>
                              <span className="text-sm text-gray-500">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-gray-500">Click to upload an image</span>
                              <span className="text-xs text-gray-400 mt-1">or</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}

                    {/* Image URL Input */}
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">Or enter image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.image_url}
                          onChange={handleImageUrlChange}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Parent Category & Sort Order Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Parent Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Category
                    </label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                    >
                      <option value="">None (Top Level)</option>
                      {categories
                        .filter(c => !c.parent_id && c.id !== editingCategory?.id)
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Leave empty for main categories</p>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                  </div>
                </div>

                {/* Show in Navbar Toggle */}
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <input
                    type="checkbox"
                    id="show_in_navbar"
                    checked={formData.show_in_navbar}
                    onChange={(e) => setFormData({ ...formData, show_in_navbar: e.target.checked })}
                    className="w-5 h-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="show_in_navbar" className="font-medium text-gray-900 cursor-pointer">
                      Show in navigation menu
                    </label>
                    <p className="text-sm text-gray-500">
                      Display this category in the website header navigation
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {formData.name && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
                    <div className="flex items-center gap-3">
                      {formData.image_url ? (
                        <img 
                          src={formData.image_url} 
                          alt={formData.name} 
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{formData.name}</p>
                        <p className="text-sm text-gray-500">/products/{formData.slug || 'category-slug'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
