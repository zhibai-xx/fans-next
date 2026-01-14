'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  defaultValue?: string
  autoFocus?: boolean
}

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

export function SearchBar({
  onSearch,
  placeholder = '搜索视频、作者...',
  defaultValue = '',
  autoFocus = false
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
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

  useEffect(() => {
    setQuery(defaultValue)
  }, [defaultValue])

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

  const persistHistory = (value: string) => {
    const newHistory = [
      value,
      ...searchHistory.filter(s => s !== value)
    ].slice(0, 10)

    setSearchHistory(newHistory)
    localStorage.setItem('videoSearchHistory', JSON.stringify(newHistory))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = query.trim()
    if (!value) {
      if (onSearch) {
        onSearch('')
      } else {
        router.push('/videos')
      }
      setShowSuggestions(false)
      return
    }

    persistHistory(value)

    if (onSearch) {
      onSearch(value)
    } else {
      // 导航到搜索结果页
      router.push(`/videos/search?q=${encodeURIComponent(value)}`)
    }

    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)

    persistHistory(suggestion)

    if (onSearch) {
      onSearch(suggestion)
    } else {
      router.push(`/videos/search?q=${encodeURIComponent(suggestion)}`)
    }

    setShowSuggestions(false)
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            autoFocus={autoFocus}
            className="w-full rounded-full border-gray-200/60 bg-white/80 py-3 pl-10 pr-10 text-base transition-all duration-200 focus:border-[color:var(--theme-accent)]"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full p-0 text-gray-500 hover:bg-[color:var(--theme-accent-soft)] hover:text-gray-700"
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
          className="absolute mt-2 w-full rounded-2xl border border-gray-200/60 bg-white/95 shadow-xl z-10 dark:border-gray-800 dark:bg-gray-900"
        >
          <ul className="py-2">
            {searchHistory.length > 0 && query === '' && (
              <li className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                最近搜索
              </li>
            )}

            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-[color:var(--theme-accent-soft)] dark:text-gray-200"
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
