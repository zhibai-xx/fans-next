"use client";

import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { createCroppedBlob } from '@/lib/utils/crop-image';

type AvatarCropperDialogProps = {
  open: boolean;
  imageSrc: string | null;
  fileName?: string;
  fileType?: string;
  onClose: () => void;
  onCropComplete: (file: File, previewUrl: string) => void;
};

const getFileName = (rawName?: string, ext?: string) => {
  if (rawName) {
    return rawName.replace(/\.[^/.]+$/, '') + (ext || '.webp');
  }
  return `avatar-${Date.now()}${ext || '.webp'}`;
};

export const AvatarCropperDialog: React.FC<AvatarCropperDialogProps> = ({
  open,
  imageSrc,
  fileName,
  fileType,
  onClose,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedArea(croppedAreaPixels);
    },
    [],
  );

  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const blob = await createCroppedBlob(imageSrc, croppedArea, {
        mimeType: fileType || 'image/webp',
      });
      const extension =
        fileType?.includes('png') ? '.png' : fileType?.includes('jpeg') ? '.jpg' : '.webp';
      const finalFile = new File([blob], getFileName(fileName, extension), {
        type: blob.type || fileType || 'image/webp',
      });
      const previewUrl = URL.createObjectURL(finalFile);
      onCropComplete(finalFile, previewUrl);
    } catch (error) {
      console.error('头像裁剪失败', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>裁剪头像</DialogTitle>
          <DialogDescription>拖拽图片并调整缩放，保持头像为正方形。</DialogDescription>
        </DialogHeader>

        <div className="relative h-[360px] w-full overflow-hidden rounded-lg bg-muted">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              cropShape="round"
              showGrid={false}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>缩放</span>
            <span>{zoom.toFixed(2)}x</span>
          </div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(value) => setZoom(value[0])}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            取消
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSaving || !croppedArea}>
            {isSaving ? '处理中...' : '应用'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
