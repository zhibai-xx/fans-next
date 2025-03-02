"use client";
import React from 'react';
import { ImageGrid } from '@/app/images/components/ImageGrid';
import { ImageItem } from '@/types/image';
import { Select } from "antd";

// 模拟数据 - 实际项目中应该从API获取
const images: ImageItem[] = [
    {
        id: '1',
        url: '/assets/zjy2.jpg',
        width: 1000,
        height: 1495,
        author: {
            id: '1',
            name: '摄影师小王',
            avatar: '/assets/zjy3.png'
        },
        likes: 156,
        isBookmarked: false,
        tags: ['风景', '自然']
    },
    {
        id: '2',
        url: '/assets/zjy4.jpg',
        width: 1920,
        height: 1080,
        author: {
            id: '1',
            name: '摄影师小王',
            avatar: '/assets/zjy3.png'
        },
        likes: 156,
        isBookmarked: false,
        tags: ['风景', '自然']
    },
    // ... 更多图片数据
];

const handleChange = (value: string) => {
    console.log(`selected ${value}`);
};

export default function ImagesPage() {
    const displayedImages = [
        ...Array(3).fill(images[0]),
        ...Array(3).fill(images[1]),
        ...Array(3).fill(images[0])
    ];
    return (
        <div className="max-w-[2000px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">精选图片</h1>
                <div className="flex space-x-4">
                    <Select
                        defaultValue="最新发布"
                        style={{ width: 120 }}
                        onChange={handleChange}
                        options={[
                            { value: 'jack', label: '最新发布' },
                            { value: 'lucy', label: '最多收藏' },
                            { value: 'Yiminghe', label: '最多点赞' },
                        ]}
                    />
                </div>
            </div>
            <ImageGrid images={displayedImages} />
        </div>
    );
}