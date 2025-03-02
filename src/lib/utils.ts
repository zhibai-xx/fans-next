import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 格式化数字显示（例如：1.2万，3.4亿）
 */
export const formatNumber = (num: number): string => {
    if (num >= 100000000) {
        return `${(num / 100000000).toFixed(1)}亿`
    }
    if (num >= 10000) {
        return `${(num / 10000).toFixed(1)}万`
    }
    return num.toLocaleString('zh-CN')
}

/**
 * 格式化视频时长（秒 => mm:ss）
 */
export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 人性化时间显示（例如：3天前，1个月前）
 */
export const formatRelativeTime = (dateString: string): string => {
    return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhCN
    })
}

/**
 * 生成带参数的API URL
 */
export const buildApiUrl = (
    baseUrl: string,
    params: Record<string, string | number>
): string => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        query.append(key, value.toString())
    })
    return `${baseUrl}?${query.toString()}`
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number
) => {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

/**
 * 合并 Tailwind CSS 类名的最佳实践方案
 * 结合了 clsx 和 tailwind-merge 的优势：
 * - clsx: 处理条件类名逻辑
 * - tailwind-merge: 解决 Tailwind 类名冲突
 */
export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs))
  }