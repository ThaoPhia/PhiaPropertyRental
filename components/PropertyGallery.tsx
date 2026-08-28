'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import type { SlideImage } from 'yet-another-react-lightbox';
import { Fullscreen, Thumbnails, Zoom } from 'yet-another-react-lightbox/plugins';
import { Button } from '@/components/ui/button';
import { PropertyImage } from '@/lib/types/types';

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [index, setIndex] = useState(-1);

  type PropertyGallerySlide = SlideImage & {
    description?: string;
  };

  const slides = useMemo(
    (): PropertyGallerySlide[] =>
      images.map((image, imageIndex) => ({
        src: image.url,
        width: 1600,
        height: 1200,
        alt: image.description || `${title} image ${imageIndex + 1}`,
        description: image.description || undefined,
      })),
    [images, title]
  );

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery</h2>
      <div className="max-h-[404px] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {slides.map((slide, photoIndex) => (
            <Button
              key={`${slide.src}-${photoIndex}`}
              type="button"
              onClick={() => setIndex(photoIndex)}
              variant="outline"
              className="relative h-auto aspect-[4/3] overflow-hidden rounded-lg border-gray-200 bg-gray-100 p-0 cursor-pointer"
            >
              <Image
                src={slide.src}
                alt={slide.alt || `${title} image ${photoIndex + 1}`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                loading="eager"
                className="object-cover"
              />
            </Button>
          ))}
        </div>
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Fullscreen, Thumbnails, Zoom]}
        render={{
          slideFooter: ({ slide }) =>
            'description' in slide && typeof slide.description === 'string' && slide.description.trim() ? (
              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-3 text-center text-sm text-white">
                {slide.description}
              </div>
            ) : null,
        }}
        zoom={{ maxZoomPixelRatio: 3, zoomInMultiplier: 1.5  }}
      />
    </div>
  );
}
