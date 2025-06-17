"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { ImageItem } from '@/types/image';
import { HeartIcon, BookmarkIcon, DownloadIcon } from '@/components/icons/ActionIcons';
import { Button } from '@/components/ui/button';

interface ImageCardProps {
  image: ImageItem;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, priority = false,
  className = '', style }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group rounded-lg overflow-hidden ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0">
        <Image
          src={image.url}
          alt={image.title || '图片'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />
      </div>

      {/* 悬浮层 */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-transparent to-black/50 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {/* 顶部操作栏 */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <ActionButton
            icon={<BookmarkIcon />}
            onClick={() => { }}
            active={image.isBookmarked}
          />
          <ActionButton
            icon={<HeartIcon />}
            onClick={() => { }}
            count={image.likes}
          />
          <ActionButton
            icon={<DownloadIcon />}
            onClick={() => { }}
          />
        </div>

        {/* 底部信息 */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-2">
          <Image
            src={image.author.avatar}
            alt={image.author.name}
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="text-white text-sm font-medium">
            {image.author.name}
          </span>
        </div>

        {/* 标签 */}
        {image.tags.length > 0 && (
          <div className="absolute bottom-4 right-4 flex flex-wrap gap-1">
            {image.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-black/30 rounded-full text-white text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  count?: number;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  onClick,
  active = false,
  count
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={`p-2 h-auto w-auto rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors ${active ? 'text-red-500' : 'text-white'
      }`}
  >
    {icon}
    {count !== undefined && (
      <span className="ml-1 text-xs">{count}</span>
    )}
  </Button>
);