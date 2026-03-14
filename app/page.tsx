'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import ProductCarousel from '@/components/widgets/ProductCarousel'

interface HeroSettings {
  hero_title: string
  hero_subtitle: string
  hero_image: string
  mobile_hero_image: string
  hero_cta_text: string
  hero_cta_link: string
}

interface Category {
  id: string
  name: string
  slug: string
  image_url: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  images: string[]
  is_featured: boolean
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [accessoriesProducts, setAccessoriesProducts] = useState<Product[]>([])
  const [tshirts, setTshirts] = useState<Product[]>([])

  const [categories, setCategories] = useState<Category[]>([])
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null)
  
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Fetch hero settings
      const { data: heroData } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['hero_title', 'hero_subtitle', 'hero_image', 'mobile_hero_image', 'hero_cta_text', 'hero_cta_link'])

      if (heroData && heroData.length > 0) {
        const hero: HeroSettings = {
          hero_title: '',
          hero_subtitle: '',
          hero_image: '',
          mobile_hero_image: '',
          hero_cta_text: '',
          hero_cta_link: ''
        }
        heroData.forEach((item: { key: string; value: string }) => {
          if (item.key in hero) {
            hero[item.key as keyof HeroSettings] = item.value || ''
          }
        })
        setHeroSettings(hero)
      }

      // Fetch featured products
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(10)

      if (data) setFeaturedProducts(data)

      // Fetch new products
      const { data: newProductsData } = await supabase
        .from('products')
        .select('*, categories!inner(slug)')
        .eq('is_active', true)
        .eq('categories.slug', 'new')
        .limit(10)

      if (newProductsData) setNewProducts(newProductsData)

      // Fetch categories with images
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('sort_order')

      // Filter categories that have images locally
      if (categoriesData) {
        setCategories(categoriesData.filter(c => c.image_url && c.image_url !== ''))
      }

      // Fetch accessories products
      const { data: accessoriesData } = await supabase
        .from('products')
        .select('*, categories!inner(slug)')
        .eq('is_active', true)
        .eq('categories.slug', 'accessories')
        .limit(10)

      if (accessoriesData) setAccessoriesProducts(accessoriesData)

      // Fetch tshrits products
      const { data: tshirtsData } = await supabase
        .from('products')
        .select('*, categories!inner(slug)')
        .eq('is_active', true)
        .eq('categories.slug', 'men-t-shirts')
        .limit(10)

      if (tshirtsData) setTshirts(tshirtsData)

      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      {(heroSettings?.hero_image || heroSettings?.hero_title) ? (
        <div className="relative bg-black text-white w-full overflow-hidden min-h-[500px] md:h-screen">
          {/* Full-bleed background image */}
          {heroSettings?.hero_image && (
            <img
              src={heroSettings?.hero_image}
              alt="Hero"
              className="hidden md:block absolute inset-0 w-full h-full object-cover object-center"
            />
          )}
          {heroSettings?.mobile_hero_image && (
            <img
              src={heroSettings?.mobile_hero_image}
              alt="Hero"
              className="md:hidden absolute inset-0 w-full h-full object-cover object-center"
            />
          )}

          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          {/* Content wrapper */}
          <div className="relative flex flex-col justify-between w-full min-h-[500px] md:h-screen">

            {/* Title — top-left on desktop, centred on mobile */}
            <div className="px-6 pt-8 md:px-14 md:pt-14 flex justify-center md:justify-start">
              <h1
                style={{
                  fontFamily: "'Barlow Condensed', 'Impact', 'Arial Narrow', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(3rem, 10vw, 9rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  textShadow: "0 2px 24px rgba(0,0,0,0.4)",
                }}
              >
                {heroSettings?.hero_title}
              </h1>
            </div>

            {/* Subtitle */}
            {heroSettings?.hero_subtitle && (
              <div className="px-6 md:px-14 mt-4 flex justify-center md:justify-start">
                <p
                  className="text-gray-200 text-base md:text-lg max-w-md text-center md:text-left"
                  style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
                >
                  {heroSettings?.hero_subtitle}
                </p>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* CTA */}
            <div className="px-6 pb-10 md:px-55 md:pb-14 flex justify-center md:justify-start">
              <a
                href={heroSettings?.hero_cta_link || '/products'}
                style={{
                  display: "inline-block",
                  background: "#ffffff",
                  color: "#000000",
                  fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "14px 40px",
                  borderRadius: "9999px",
                  border: "2px solid #ffffff",
                  textDecoration: "none",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#000000";
                }}
              >
                {heroSettings?.hero_cta_text}
              </a>
            </div>
          </div>

          <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap');
            `}</style>
        </div>
      ) : (
        ''
      )}

      {/* Featured Products */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div>
          <ProductCarousel products={featuredProducts} productsTitle="Featured" shopAllLink="/products?filter=featured" />
          <ProductCarousel products={newProducts} productsTitle="New Arrivals" shopAllLink="/products?filter=new" />

          {/* Categories as Tall Cards under New Arrivals */}
          {categories.length > 0 && (
            <section className="py-12 md:py-16 bg-gray-100 w-full">
              <div className="w-full px-0">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      className="group relative block overflow-hidden"
                    >
                      {/* Tall Card - Aspect ratio for tall appearance */}
                      <div className="aspect-[3/5] md:aspect-[2/3] relative h-full min-h-[300px] md:min-h-[400px]">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-lg">{category.name}</span>
                          </div>
                        )}
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        {/* Category Name */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                          <h3 className="text-white text-lg md:text-xl font-bold uppercase tracking-wide">
                            {category.name}
                          </h3>
                          <span className="text-white/80 text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Shop Now →
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}

          <ProductCarousel products={accessoriesProducts} productsTitle="Accessories" shopAllLink="/products?filter=accessories" />

          {/* Advertisement Section */}
          <section className="w-full py-5 md:py-16 px-4">
            <div className="relative w-full h-[300px] md:h-[400px] max-w-7xxl mx-auto overflow-hidden rounded-2xl group">

              {/* Background Image */}
              <img
                src="/ad-banner.png"
                alt="Special Offer"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-start justify-center min-h-[260px] md:min-h-[340px] px-8 md:px-16 py-10 text-white">

                <span className="text-sm uppercase tracking-[3px] text-white/70 mb-3">
                  Limited Time
                </span>

                <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                  Summer Collection
                </h2>

                <p className="text-white/80 max-w-md mb-6 text-sm md:text-base">
                  Discover premium streetwear designed for comfort and style.
                  Get exclusive discounts on selected items.
                </p>

                <a
                  href="/products"
                  className="inline-block bg-white text-black px-8 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-300 hover:bg-gray-200"
                >
                  Shop Now
                </a>

              </div>
            </div>
          </section>

          <ProductCarousel products={tshirts || []} productsTitle="T-Shirts" shopAllLink="/products?filter=men-t-shirts" />
        </div>
      )}
    </div>
  )
}
