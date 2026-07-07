'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import { Fullscreen, Thumbnails, Zoom } from 'yet-another-react-lightbox/plugins';
import { Button } from '@/components/ui/button';

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [index, setIndex] = useState(-1);

  const slides = useMemo(
    () =>
      images.map((src, imageIndex) => ({
        src,
        width: 1600,
        height: 1200,
        alt: `${title} image ${imageIndex + 1}`,
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
              className="relative h-auto aspect-[4/3] overflow-hidden rounded-lg border-gray-200 bg-gray-100 p-0"
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
        zoom={{ maxZoomPixelRatio: 4, zoomInMultiplier: 1.5  }}
      />
    </div>
  );
}
