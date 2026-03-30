'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '../components/SearchBar'
import { ModernVideoGrid } from '../components/ModernVideoGrid'
import { useSearchVideos } from '@/hooks/useVideos'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() || ''

  const {
    data,
    isLoading,
    isFetching,
    isError
  } = useSearchVideos(query, { status: 'APPROVED' })

  const videos = useMemo(() => data?.data ?? [], [data])
  const total = data?.pagination?.total ?? videos.length

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">搜索结果{query ? `：${query}` : ''}</h1>
        <SearchBar defaultValue={query} autoFocus />
      </div>

      {query.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white/70 dark:bg-gray-900/40 rounded-2xl shadow-sm">
          输入关键词开始探索更多精彩视频
        </div>
      ) : isError ? (
        <div className="p-12 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl">
          搜索出错，请稍后再试
        </div>
      ) : isLoading || isFetching ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : videos.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white/70 dark:bg-gray-900/40 rounded-2xl shadow-sm">
          未找到与 <span className="font-semibold text-gray-700 dark:text-gray-300">{query}</span> 相关的视频
        </div>
      ) : (
        <>
          <p className="text-gray-500">
            共找到 <span className="font-semibold text-gray-900 dark:text-gray-100">{total}</span> 个结果
          </p>
          <ModernVideoGrid videos={videos} />
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  )
}
