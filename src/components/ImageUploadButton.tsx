import React, { useState } from 'react';
import { AdvancedUploadModal } from './upload/AdvancedUploadModal';
import { Button } from '@/components/ui/button';

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
        className="flex items-center gap-2"
      >
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