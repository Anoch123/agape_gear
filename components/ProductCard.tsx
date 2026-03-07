'use client'

import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
}

export default function ProductCard({ product }: { product: Product }) {

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(price)
  }

  return (
    <div className="group w-full">

      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300">

        {/* Product Image */}
        <Link href={`/products/${product.slug}`} className="block relative">

          <div className="aspect-[3/4] bg-gray-100 overflow-hidden">

            {product.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}

          </div>

          {/* Quick Add Icon */}
          <div className="absolute bottom-4 right-4 bg-white p-2.5 rounded-full shadow-lg opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 28 32"
              fill="currentColor"
            >
              <path d="M27.2068 8.04461V5.73468H20.4633V0.575439H7.16151V5.7568H0.505615V31.929H27.1417V12.6276H24.8292V29.635H2.82436C2.8181 29.522 2.81059 29.4311 2.81059 29.3402C2.81059 22.3981 2.80934 15.456 2.81059 8.51397C2.81059 7.99546 2.74552 8.04338 3.30112 8.04338C11.1283 8.04338 18.9554 8.04338 26.7838 8.04338Z" />
              <path d="M15.0124 25.3777V20.1398H20.3469V17.8692H15.0124V12.6313H12.7V17.8692H7.36548V20.1398H12.7V25.3777H15.0124Z" />
            </svg>

          </div>

        </Link>

        {/* Product Info */}
        <Link
          href={`/products/${product.slug}`}
          className="block p-4"
        >

          <h5 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {product.name}
          </h5>

          <p className="text-xs text-gray-400 mt-1">
            1 Color
          </p>

          <p className="text-base font-semibold mt-2 text-black">
            {formatPrice(product.price)}
          </p>

        </Link>

      </div>

    </div>
  )
}