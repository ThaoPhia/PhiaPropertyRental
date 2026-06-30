'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminSession } from '@/hooks/useAdminSession';
import { usePropertyById } from '@/hooks/usePropertyById';
import PropertyGallery from '@/components/PropertyGallery';
import { resolvePropertyHighlightIcon } from '@/components/icons/property-highlight-icons';

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [paramsId, setParamsId] = useState<string>('');
  const admin = useAdminSession();
  const { property, loading, error, setError } = usePropertyById(paramsId);

  useEffect(() => {
    params.then(({ id }) => setParamsId(id));
  }, [params]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await fetch(`/api/properties/${paramsId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setError('Failed to delete property');
        return;
      }

      router.push('/properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete property');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Property not found'}</p>
            <Button asChild className="px-6">
              <Link href="/properties">
                Return to Properties
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const availabilityText = property.status === 'occupied'
    ? 'Currently occupied'
    : property.dateAvailable
      ? new Date(property.dateAvailable).toLocaleDateString()
      : 'Soon';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <Link href="/properties" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Properties
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image */}
          {property.image_url && (
            <div className="relative w-full h-96">
              <Image
                src={property.image_url}
                alt={property.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{property.name}</h1>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded capitalize">
                    {property.status}
                  </span>
                  <span className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded capitalize">
                    {property.type}
                  </span>
                </div>
              </div>
              <p className="text-4xl font-bold text-green-600">
                ${property.monthlyRent.toLocaleString()}
                <span className="text-lg font-medium text-gray-500">/mo</span>
              </p>
            </div>

            {/* Address */}
            <div className="mb-6">
              <p className="text-lg text-gray-700">
                {property.address}, {property.city}, {property.state} {property.zipCode}
              </p>
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-100 rounded">
              <div>
                <p className="text-gray-600 text-sm">Bedrooms</p>
                <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Bathrooms</p>
                <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Square Feet</p>
                <p className="text-2xl font-bold text-gray-900">
                  {property.squareFeet.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Availability</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availabilityText}
                </p>
              </div>
            </div>

            <PropertyGallery images={property.images ?? []} title={property.name} />

            {/* Details */}
            {property.details && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Details</h2>
                <p className="text-gray-700 leading-relaxed">{property.details}</p>
              </div>
            )}

            {property.highlights.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {property.highlights.map((highlight, index) => {
                    const HighlightIcon = resolvePropertyHighlightIcon(highlight.icon);
                    return (
                      <div
                        key={`${highlight.icon}-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <HighlightIcon className="h-8 w-8 shrink-0 text-gray-700" />
                        <span className="text-gray-800">{highlight.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 border-t pt-8">
              {admin && (
                <>
                  <Button asChild className="px-6 font-bold">
                    <Link href={`/cms/${property.id}`}>
                      Edit Property
                    </Link>
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="px-6 font-bold"
                  >
                    Delete Property
                  </Button>
                </>
              )}
              <Button asChild variant="secondary" className="px-6 font-bold text-gray-800">
                <Link href="/properties">
                  Back to List
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
