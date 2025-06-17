"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { ImageGrid } from '@/app/images/components/ImageGrid';
import { ImageItem } from '@/types/image';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// 模拟分页获取数据
const fetchImages = async (page: number): Promise<ImageItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // 模拟延迟
    return Array.from({ length: 10 }, (_, i) => ({
        id: `${page}-${i}`,
        url: `/assets/zjy${i % 4 + 1}.jpg`,
        width: [1000, 1920, 800, 1200][i % 4],
        height: [1495, 1080, 1200, 800][i % 4],
        author: {
            id: '1',
            name: '摄影师小王',
            avatar: '/assets/zjy3.png'
        },
        likes: Math.floor(Math.random() * 100),
        isBookmarked: false,
        tags: ['风景', '自然']
    }));
};

const handleChange = (value: string) => {
    console.log(`selected ${value}`);
};

// 模拟标签数据
const mockTags = [
    { id: '1', name: '风景' },
    { id: '2', name: '人像' },
    { id: '3', name: '美食' },
    { id: '4', name: '建筑' },
];

export default function ImagesPage() {
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [images, setImages] = useState<ImageItem[]>([]);
    const { toast } = useToast();

    // 无限滚动逻辑
    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const newImages = await fetchImages(page);
            setImages(prev => [...prev, ...newImages]);
            setPage(p => p + 1);
            setHasMore(newImages.length > 0);
        } catch (error) {
            toast({
                title: "错误",
                description: "加载更多图片失败",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page]);
    // 初始化加载
    useEffect(() => {
        loadMore();
    }, []);

    // 滚动容器引用
    const containerRef = useInfiniteScroll({
        onLoadMore: loadMore,
        hasMore,
        threshold: '200px'
    });



    return (
        <div
            ref={containerRef}
            className="container mx-auto px-4 py-8 h-screen overflow-y-auto"
        >
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">图片库</h1>
                <ImageUploadButton
                    onUploadComplete={(mediaIds) => {
                        console.log('上传完成:', mediaIds);
                        toast({
                            title: "成功",
                            description: "图片上传成功",
                            variant: "default",
                        });
                        // 重新加载图片列表
                        setImages([]);
                        setPage(1);
                        setHasMore(true);
                        loadMore();
                    }}
                />
            </div>

            <div className="max-w-[2000px] mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">精选图片</h1>
                    <div className="flex space-x-4">
                        <Select defaultValue="jack" onValueChange={handleChange}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="排序方式" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="jack">最新发布</SelectItem>
                                <SelectItem value="lucy">最多收藏</SelectItem>
                                <SelectItem value="Yiminghe">最多点赞</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <ImageGrid images={images} />
                {loading && <div className="text-center py-4"><Spinner /></div>}
                {!hasMore && <div className="text-center py-4 text-gray-500">没有更多图片了</div>}
            </div>
        </div>
    );
}