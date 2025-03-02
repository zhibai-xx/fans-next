import React from 'react';
import { ImageCard } from './ImageCard';
import { ImageGridProps } from '@/types/image';

export const ImageGrid: React.FC<ImageGridProps> = ({ images, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {images.map((image, index) => (
        <ImageCard
          key={image.id}
          image={image}
          priority={index < 4} // 前4张图片优先加载
        />
      ))}
    </div>
  );
};