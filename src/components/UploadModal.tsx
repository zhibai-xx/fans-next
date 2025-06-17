import React from 'react';
import { AdvancedUploadModal } from './upload/AdvancedUploadModal';

interface Tag {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'image' | 'video';
  onSubmit?: (data: {
    name: string;
    description: string;
    tags: string[];
    category?: Category;
    file: File;
  }) => void;
  existingTags?: Tag[];
  categories?: Category[];
  onUploadComplete?: (mediaIds: string[]) => void;
}

/**
 * 兼容性包装器，将旧的 UploadModal 接口映射到新的 AdvancedUploadModal
 * @deprecated 请直接使用 AdvancedUploadModal
 */
export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  type,
  onUploadComplete,
}) => {
  return (
    <AdvancedUploadModal
      isOpen={isOpen}
      onClose={onClose}
      type={type}
      onUploadComplete={onUploadComplete}
    />
  );
}; 