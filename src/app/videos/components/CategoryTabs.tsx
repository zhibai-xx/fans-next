'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

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
        <Button
          key={category.id}
          variant={currentCategory === category.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryChange(category.id)}
          className="rounded-full"
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}