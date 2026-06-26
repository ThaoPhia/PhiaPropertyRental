'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const address = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
  const highlights = Array.isArray(property.highlights) ? property.highlights : [];
  const hasHighlights = highlights.length > 0;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <Link
        href={`/properties/${property.id}`}
        className="relative block h-72 md:h-[26rem] w-full overflow-hidden bg-slate-100"
      >
        {property.image_url ? (
          <Image
            src={property.image_url}
            alt={property.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(min-width: 1024px) 80vw, 100vw"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-slate-500">
            Property image coming soon
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-white/90 px-3 py-1 font-medium text-slate-900 capitalize">
              {property.type}
            </span>
            <span className="rounded-full bg-blue-100/95 px-3 py-1 font-medium text-blue-900 capitalize">
              {property.status}
            </span>
            <span className="rounded-full bg-emerald-100/95 px-3 py-1 font-medium text-emerald-900">
              ${property.monthlyRent.toLocaleString()}/mo
            </span>
          </div>
          <h3 className="mt-3 text-2xl md:text-3xl font-semibold text-white">{property.name}</h3>
          <p className="mt-1 text-sm md:text-base text-white/90">{address}</p>
        </div>
      </Link>

      <div className="p-5 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Bedrooms</p>
            <p className="text-xl font-semibold text-slate-900">{property.bedrooms}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Bathrooms</p>
            <p className="text-xl font-semibold text-slate-900">{property.bathrooms}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sq Ft</p>
            <p className="text-xl font-semibold text-slate-900">{property.squareFeet.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Available</p>
            <p className="text-sm font-semibold text-slate-900">
              {property.dateAvailable ? new Date(property.dateAvailable).toLocaleDateString() : 'Now'}
            </p>
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed md:text-base">{property.details}</p>

        {hasHighlights && (
          <div className="mt-5 flex flex-wrap gap-2">
            {highlights.slice(0, 4).map((highlight, index) => (
              <span
                key={`${highlight.icon}-${index}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
              >
                {highlight.text}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-slate-500">Professionally managed by Phia Rental LLC</span>
          <Button asChild className="px-5 text-sm font-semibold">
            <Link href={`/properties/${property.id}`}>
              View Full Details
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
