'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Category {
  id: string
  name: string
}

interface CategoryTabsProps {
  categories: Category[]
}

export function CategoryTabs({ categories }: CategoryTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || 'all'

  const handleCategoryChange = (categoryId: string) => {
    router.push(`/videos?category=${categoryId}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryChange(category.id)}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            currentCategory === category.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}