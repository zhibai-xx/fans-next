'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ShortcutProps {
  keyboardKey: string
  description: string
}

const Shortcut = ({ keyboardKey, description }: ShortcutProps) => (
  <div className="flex items-center justify-between mb-2">
    <span className="text-gray-300">{description}</span>
    <kbd className="px-2 py-1 bg-gray-800 text-white rounded border border-gray-700 min-w-[32px] text-center">
      {keyboardKey}
    </kbd>
  </div>
)

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-gray-400 hover:text-white transition-colors"
        aria-label="键盘快捷键"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* 快捷键对话框 */}
      <div className={cn(
        "fixed inset-0 bg-black/80 z-50 flex items-center justify-center transition-opacity",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">键盘快捷键</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Shortcut keyboardKey="空格" description="播放/暂停" />
            <Shortcut keyboardKey="K" description="播放/暂停 (同空格)" />
            <Shortcut keyboardKey="F" description="全屏" />
            <Shortcut keyboardKey="M" description="静音/取消静音" />
            <Shortcut keyboardKey="←" description="快退 10 秒" />
            <Shortcut keyboardKey="→" description="快进 10 秒" />
            <Shortcut keyboardKey="↑" description="增加音量" />
            <Shortcut keyboardKey="↓" description="减小音量" />
          </div>
        </div>
      </div>
    </>
  )
} 