import React, { useState } from 'react';
import AdvancedUploadModal from './upload/AdvancedUploadModal';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';

interface ImageUploadButtonProps {
  onUploadComplete?: (mediaIds: string[]) => void;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onUploadComplete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 rounded-full border border-white/60 bg-[var(--theme-accent)] px-4 py-2 text-white shadow-sm transition-all hover:brightness-105 hover:shadow-md"
      >
        <ImagePlus className="h-5 w-5" />
        上传图片
      </Button>

      <AdvancedUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="image"
        onUploadComplete={(mediaIds) => {
          onUploadComplete?.(mediaIds);
        }}
      />
    </>
  );
}; 
