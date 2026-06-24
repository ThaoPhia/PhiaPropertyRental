'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminSession } from '@/hooks/useAdminSession';
import { usePropertyById } from '@/hooks/usePropertyById';

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
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Property not found'}</p>
            <Link href="/properties">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
                Return to Properties
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded mt-2">
                  {property.type}
                </span>
              </div>
              <p className="text-4xl font-bold text-green-600">
                ${property.price.toLocaleString()}
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
                <p className="text-gray-600 text-sm">Price per Sq Ft</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${Math.round(property.price / property.squareFeet)}
                </p>
              </div>
            </div>

            {property.images && property.images.length > 1 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.images.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="relative h-40 overflow-hidden rounded-lg border border-gray-200">
                      <Image
                        src={imageUrl}
                        alt={`${property.name} image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 border-t pt-8">
              {admin && (
                <>
                  <Link href={`/cms/${property.id}`}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
                      Edit Property
                    </button>
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded"
                  >
                    Delete Property
                  </button>
                </>
              )}
              <Link href="/properties">
                <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded cursor-pointer">
                  Back to List
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
