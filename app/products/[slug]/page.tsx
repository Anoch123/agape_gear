'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  material: string | null
  stock_quantity: number
  is_featured: boolean
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (data) {
        setProduct(data)
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0])
        }
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0])
        }
      }
      setLoading(false)
    }

    fetchProduct()
  }, [slug])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(price)
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    setAdding(true)
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      // Check if item exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .eq('size', selectedSize)
        .eq('color', selectedColor)
        .single()

      if (existingItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)
      } else {
        // Insert new item
        await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
            size: selectedSize,
            color: selectedColor,
          })
      }

      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAdding(false)
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      selectedImage === index ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            
            <div className="flex items-center gap-4 mt-4">
              <span className="text-2xl font-bold text-black">
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <>
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(product.compare_at_price)}
                  </span>
                  <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                    SAVE {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-600 mt-4">{product.description}</p>

            {/* Stock Status */}
            <div className="mt-4">
              {product.stock_quantity > 0 ? (
                <span className="text-green-600 font-medium">In Stock ({product.stock_quantity} available)</span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900">Color</h3>
                <div className="flex gap-2 mt-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-md text-sm font-medium border-2 transition-colors ${
                        selectedColor === color
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900">Size</h3>
                <div className="flex gap-2 mt-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-md text-sm font-medium border-2 transition-colors ${
                        selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                >
                  -
                </button>
                <span className="text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="w-10 h-10 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="mt-8">
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stock_quantity === 0}
                className={`w-full py-4 rounded-md text-lg font-medium transition-colors ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-black text-white hover:bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {adding ? 'Adding...' : addedToCart ? 'Added to Cart!' : 'Add to Cart'}
              </button>
            </div>

            {/* Product Info */}
            {product.material && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900">Material</h3>
                <p className="text-gray-600 mt-1">{product.material}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
