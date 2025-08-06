import React, { useState } from 'react';
import AdvancedUploadModal from './upload/AdvancedUploadModal';
import { Button } from '@/components/ui/button';

interface VideoUploadButtonProps {
  onUploadComplete?: (mediaIds: string[]) => void;
}

export const VideoUploadButton: React.FC<VideoUploadButtonProps> = ({
  onUploadComplete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          />
        </svg>
        上传视频
      </Button>

      <AdvancedUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="video"
        onUploadComplete={(mediaIds) => {
          onUploadComplete?.(mediaIds);
        }}
      />
    </>
  );
}; 