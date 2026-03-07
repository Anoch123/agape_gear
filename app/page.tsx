'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  const [loading, setLoading] = useState(true)
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null)

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

      if (data) setFeaturedProducts(data)
      setLoading(false)
    }

    fetchData()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">

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
        <ProductCarousel products={featuredProducts} productsTitle="Featured" shopAllLink="/products" />
      )}
    </div>
  )
}
