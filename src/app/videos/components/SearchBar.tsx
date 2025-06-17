'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// 模拟搜索建议数据
const searchSuggestions = [
  '张婧仪',
  '张婧仪与凤行',
  '张婧仪采访',
  '张婧仪角色',
  '张婧仪花絮',
  '与凤行幕后',
  '觉醒年代张婧仪'
]

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('videoSearchHistory')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (e) {
        console.error('Failed to parse search history', e)
      }
    }
  }, [])

  // 过滤搜索建议
  useEffect(() => {
    if (query.trim()) {
      const normalizedQuery = query.toLowerCase().trim()
      const filtered = searchSuggestions
        .filter(s => s.toLowerCase().includes(normalizedQuery))
        .slice(0, 5)

      // 添加历史搜索到建议中
      const historyMatches = searchHistory
        .filter(s => s.toLowerCase().includes(normalizedQuery) && !filtered.includes(s))
        .slice(0, 3)

      setSuggestions([...filtered, ...historyMatches])
    } else {
      // 如果查询为空，显示最近的搜索历史
      setSuggestions(searchHistory.slice(0, 5))
    }
  }, [query, searchHistory])

  // 处理点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // 保存到搜索历史
      const newHistory = [
        query,
        ...searchHistory.filter(s => s !== query)
      ].slice(0, 10)

      setSearchHistory(newHistory)
      localStorage.setItem('videoSearchHistory', JSON.stringify(newHistory))

      // 导航到搜索结果页
      router.push(`/videos/search?q=${encodeURIComponent(query)}`)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)

    // 保存到搜索历史
    const newHistory = [
      suggestion,
      ...searchHistory.filter(s => s !== suggestion)
    ].slice(0, 10)

    setSearchHistory(newHistory)
    localStorage.setItem('videoSearchHistory', JSON.stringify(newHistory))

    // 导航到搜索结果页
    router.push(`/videos/search?q=${encodeURIComponent(suggestion)}`)
    setShowSuggestions(false)
  }

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="搜索视频、作者..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-4 pr-10 rounded-full"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Button>
        </div>
      </form>

      {/* 搜索建议下拉框 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionRef}
          className="absolute mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
        >
          <ul className="py-1">
            {searchHistory.length > 0 && query === '' && (
              <li className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                最近搜索
              </li>
            )}

            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}