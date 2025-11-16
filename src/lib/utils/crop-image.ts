"use client";

import { Area } from 'react-easy-crop';

type CropOptions = {
  mimeType?: string;
  quality?: number;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = src;
  });

export const createCroppedBlob = async (
  imageSrc: string,
  cropArea: Area,
  options: CropOptions = {},
) => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('浏览器不支持 Canvas');
  }

  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  const mimeType = options.mimeType || 'image/webp';
  const quality = options.quality ?? 0.92;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('裁剪失败，请重试'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
};
