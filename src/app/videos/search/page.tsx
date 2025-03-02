'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VideoGrid } from '../components/VideoGrid'
import { SearchBar } from '../components/SearchBar'
import { VideoItem } from '@/types/video'
import { searchVideos } from '@/lib/video'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        if (query) {
          const data = await searchVideos(query)
          setResults(data)
        } else {
          setResults([])
        }
      } catch (error) {
        console.error('搜索失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">搜索结果: {query}</h1>
        <SearchBar />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <p className="text-gray-500">找到 {results.length} 个结果</p>
          <VideoGrid videos={results} />
        </>
      )}
    </div>
  )
} 