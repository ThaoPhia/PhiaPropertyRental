'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import { Fullscreen, Thumbnails, Zoom } from 'yet-another-react-lightbox/plugins';

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
            <button
              key={`${slide.src}-${photoIndex}`}
              type="button"
              onClick={() => setIndex(photoIndex)}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
              <Image
                src={slide.src}
                alt={slide.alt || `${title} image ${photoIndex + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Fullscreen, Thumbnails, Zoom]}
      />
    </div>
  );
}
