"use client";

import { useState, useEffect, memo } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallbackSrc?: string;
  lowQualitySrc?: string;
  aspectRatio?: string;
  containerClassName?: string;
}

const OptimizedImage = memo(({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  lowQualitySrc,
  aspectRatio = 'aspect-square',
  containerClassName,
  className,
  ...props
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(lowQualitySrc || src);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // 소스가 변경되면 로딩 상태 재설정
    setIsLoading(true);
    setImgSrc(lowQualitySrc || src);
    setIsError(false);
  }, [src, lowQualitySrc]);

  return (
    <div className={cn(
      "relative overflow-hidden bg-gray-100", 
      aspectRatio,
      containerClassName
    )}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      
      <Image
        src={isError ? fallbackSrc : imgSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => {
          if (imgSrc === lowQualitySrc && !isError) {
            // 저품질 이미지가 로드되면 고품질 이미지로 전환
            setImgSrc(src as string);
          } else {
            // 최종 이미지가 로드되면 로딩 상태 해제
            setIsLoading(false);
          }
        }}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setIsError(true);
            setImgSrc(fallbackSrc);
          }
          setIsLoading(false);
        }}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;