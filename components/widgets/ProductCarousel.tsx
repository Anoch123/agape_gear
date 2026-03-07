'use client'

import { useRef, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'

export default function ProductCarousel({ products, productsTitle, shopAllLink }: { products: any[], productsTitle: string, shopAllLink: string }) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const cardWidth = scrollRef.current.querySelector('div')?.offsetWidth ?? 320
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -cardWidth : cardWidth,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section className="py-16 bg-gray-100">
            {/* Full-width container — no max-width clipping */}
            <div className="sm:px-0 px-1">

                {/* Header — constrained */}
                <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold uppercase">{productsTitle}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href={shopAllLink}
                            className="border border-black rounded-full px-5 py-2 text-sm font-semibold hover:bg-black hover:text-white transition-colors duration-300"
                        >
                            SHOP ALL
                        </a>
                        <button
                            onClick={() => scroll('left')}
                            className="hidden md:flex border border-gray-300 rounded-full p-3 hover:bg-black hover:text-white transition-colors duration-300"
                            aria-label="Scroll left"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>

                        <button
                            onClick={() => scroll('right')}
                            className="hidden md:flex border border-gray-300 rounded-full p-3 hover:bg-black hover:text-white transition-colors duration-300"
                            aria-label="Scroll right"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Carousel — bleeds past right edge */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        // Offset left so first card bleeds, rest scroll right
                        paddingLeft: 'calc((98vw - min(100vw, 1280px)) / 2)',
                        paddingRight: '48px',
                    }}
                >
                    {products.map((product) => (
                        <div
                            key={product.id}
                            // First card is partially cut off — matches your reference
                            className="flex-shrink-0 w-[280px] md:w-[320px] lg:w-[360px]"
                        >
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

            </div>

            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    )
}