'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Comment {
    id: string
    author: {
        id: string
        name: string
        avatar: string
    }
    content: string
    timestamp: string
    likes: number
    dislikes: number
    isLiked: boolean
    isDisliked: boolean
    replies?: Comment[]
}

interface VideoCommentsProps {
    videoId: string
    commentsCount: number
}

// 模拟评论数据
const mockComments: Comment[] = [
    {
        id: '1',
        author: {
            id: '101',
            name: '张三',
            avatar: '/assets/zjy2.jpg'
        },
        content: '张婧仪的演技真的太棒了！期待她更多作品。',
        timestamp: '2小时前',
        likes: 24,
        dislikes: 1,
        isLiked: false,
        isDisliked: false,
        replies: [
            {
                id: '1-1',
                author: {
                    id: '102',
                    name: '李四',
                    avatar: '/assets/zjy2.jpg'
                },
                content: '同意！她在《与凤行》中的表现尤其精彩。',
                timestamp: '1小时前',
                likes: 12,
                dislikes: 0,
                isLiked: true,
                isDisliked: false
            }
        ]
    },
    {
        id: '2',
        author: {
            id: '103',
            name: '王五',
            avatar: '/assets/zjy2.jpg'
        },
        content: '这个采访透露了很多剧中的幕后故事，太有意思了！',
        timestamp: '4小时前',
        likes: 32,
        dislikes: 2,
        isLiked: false,
        isDisliked: false
    },
    {
        id: '3',
        author: {
            id: '104',
            name: '赵六',
            avatar: '/assets/zjy2.jpg'
        },
        content: '希望能看到更多这样的内容，非常喜欢！',
        timestamp: '昨天',
        likes: 18,
        dislikes: 0,
        isLiked: false,
        isDisliked: false
    }
]

export function VideoComments({ videoId, commentsCount }: VideoCommentsProps) {
    const [comment, setComment] = useState('')
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [sortBy, setSortBy] = useState<'hot' | 'newest'>('hot')
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState('')

    // 模拟加载评论数据
    useEffect(() => {
        const timer = setTimeout(() => {
            setComments(mockComments)
            setIsLoading(false)
        }, 800)

        return () => clearTimeout(timer)
    }, [videoId])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!comment.trim()) return

        // 实际项目中这里应该调用API发布评论
        const newComment: Comment = {
            id: `new-${Date.now()}`,
            author: {
                id: 'current-user',
                name: '我',
                avatar: '/assets/zjy2.jpg'
            },
            content: comment,
            timestamp: '刚刚',
            likes: 0,
            dislikes: 0,
            isLiked: false,
            isDisliked: false
        }

        setComments([newComment, ...comments])
        setComment('')
    }

    const handleReply = (commentId: string) => {
        if (replyTo === commentId) {
            setReplyTo(null)
            setReplyContent('')
        } else {
            setReplyTo(commentId)
            setReplyContent('')
        }
    }

    const submitReply = (commentId: string) => {
        if (!replyContent.trim()) return

        // 实际项目中这里应该调用API发布回复
        const newReply: Comment = {
            id: `reply-${Date.now()}`,
            author: {
                id: 'current-user',
                name: '我',
                avatar: '/assets/zjy2.jpg'
            },
            content: replyContent,
            timestamp: '刚刚',
            likes: 0,
            dislikes: 0,
            isLiked: false,
            isDisliked: false
        }

        setComments(comments.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    replies: [...(c.replies || []), newReply]
                }
            }
            return c
        }))

        setReplyTo(null)
        setReplyContent('')
    }

    const toggleLike = (commentId: string, isReply = false, parentId?: string) => {
        // 实际项目中这里应该调用API
        if (isReply && parentId) {
            setComments(comments.map(c => {
                if (c.id === parentId && c.replies) {
                    return {
                        ...c,
                        replies: c.replies.map(r => {
                            if (r.id === commentId) {
                                const wasLiked = r.isLiked
                                return {
                                    ...r,
                                    isLiked: !r.isLiked,
                                    isDisliked: false,
                                    likes: wasLiked ? r.likes - 1 : r.likes + 1,
                                    dislikes: r.isDisliked ? r.dislikes - 1 : r.dislikes
                                }
                            }
                            return r
                        })
                    }
                }
                return c
            }))
        } else {
            setComments(comments.map(c => {
                if (c.id === commentId) {
                    const wasLiked = c.isLiked
                    return {
                        ...c,
                        isLiked: !c.isLiked,
                        isDisliked: false,
                        likes: wasLiked ? c.likes - 1 : c.likes + 1,
                        dislikes: c.isDisliked ? c.dislikes - 1 : c.dislikes
                    }
                }
                return c
            }))
        }
    }

    const toggleDislike = (commentId: string, isReply = false, parentId?: string) => {
        // 实际项目中这里应该调用API
        if (isReply && parentId) {
            setComments(comments.map(c => {
                if (c.id === parentId && c.replies) {
                    return {
                        ...c,
                        replies: c.replies.map(r => {
                            if (r.id === commentId) {
                                const wasDisliked = r.isDisliked
                                return {
                                    ...r,
                                    isDisliked: !r.isDisliked,
                                    isLiked: false,
                                    dislikes: wasDisliked ? r.dislikes - 1 : r.dislikes + 1,
                                    likes: r.isLiked ? r.likes - 1 : r.likes
                                }
                            }
                            return r
                        })
                    }
                }
                return c
            }))
        } else {
            setComments(comments.map(c => {
                if (c.id === commentId) {
                    const wasDisliked = c.isDisliked
                    return {
                        ...c,
                        isDisliked: !c.isDisliked,
                        isLiked: false,
                        dislikes: wasDisliked ? c.dislikes - 1 : c.dislikes + 1,
                        likes: c.isLiked ? c.likes - 1 : c.likes
                    }
                }
                return c
            }))
        }
    }

    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === 'hot') {
            return b.likes - a.likes
        } else {
            // 简化的时间排序，实际项目应该解析timestamp
            return b.id.localeCompare(a.id)
        }
    })

    const CommentComponent = ({ comment, isReply = false, parentId = '' }: { comment: Comment, isReply?: boolean, parentId?: string }) => (
        <div className={`flex space-x-4 ${isReply ? 'ml-12 mt-3' : ''}`}>
            <div className="flex-shrink-0">
                <Image
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    width={isReply ? 32 : 40}
                    height={isReply ? 32 : 40}
                    className="rounded-full"
                />
            </div>
            <div className="flex-1">
                <div className="flex items-center">
                    <span className="font-medium">{comment.author.name}</span>
                    <span className="ml-2 text-sm text-gray-500">{comment.timestamp}</span>
                </div>
                <p className="mt-1">{comment.content}</p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-muted-foreground">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center space-x-1 h-auto p-0 ${comment.isLiked ? 'text-blue-500 hover:text-blue-600' : 'text-muted-foreground'}`}
                        onClick={() => toggleLike(comment.id, isReply, parentId)}
                    >
                        <svg className="w-4 h-4" fill={comment.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span>{comment.likes}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center space-x-1 h-auto p-0 ${comment.isDisliked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}`}
                        onClick={() => toggleDislike(comment.id, isReply, parentId)}
                    >
                        <svg className="w-4 h-4" fill={comment.isDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                        </svg>
                        <span>{comment.dislikes}</span>
                    </Button>
                    {!isReply && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground"
                            onClick={() => handleReply(comment.id)}
                        >
                            回复
                        </Button>
                    )}
                </div>

                {/* 回复框 */}
                {replyTo === comment.id && (
                    <div className="flex items-start mt-3">
                        <Image
                            src="/assets/zjy2.jpg"
                            alt="Your avatar"
                            width={32}
                            height={32}
                            className="rounded-full mr-2 flex-shrink-0"
                        />
                        <div className="flex-1">
                            <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`回复 ${comment.author.name}...`}
                                className="text-sm"
                                rows={2}
                            />
                            <div className="flex justify-end mt-2 space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReplyTo(null)}
                                >
                                    取消
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => submitReply(comment.id)}
                                    disabled={!replyContent.trim()}
                                >
                                    发布回复
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 回复列表 */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                        {comment.replies.map(reply => (
                            <CommentComponent
                                key={reply.id}
                                comment={reply}
                                isReply={true}
                                parentId={comment.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">评论 ({comments.length})</h3>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">排序方式:</span>
                    <Button
                        variant={sortBy === 'hot' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setSortBy('hot')}
                    >
                        热门
                    </Button>
                    <Button
                        variant={sortBy === 'newest' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setSortBy('newest')}
                    >
                        最新
                    </Button>
                </div>
            </div>

            {/* 评论输入框 */}
            <form onSubmit={handleSubmit} className="flex space-x-4">
                <div className="flex-shrink-0">
                    <Image
                        src="/assets/zjy2.jpg"
                        alt="Your avatar"
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                </div>
                <div className="flex-grow">
                    <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="发一条友善的评论"
                        rows={3}
                    />
                    <div className="flex justify-end mt-2">
                        <Button
                            type="submit"
                            disabled={!comment.trim()}
                        >
                            发布评论
                        </Button>
                    </div>
                </div>
            </form>

            {/* 评论列表 */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-6 mt-6">
                    {sortedComments.map(comment => (
                        <CommentComponent key={comment.id} comment={comment} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    暂无评论，快来抢沙发
                </div>
            )}
        </div>
    )
}