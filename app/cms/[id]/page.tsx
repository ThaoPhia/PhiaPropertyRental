'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PropertyForm from '@/components/PropertyForm';
import { Property } from '@/lib/types';

export default function CMSEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paramsId, setParamsId] = useState<string>('');

  useEffect(() => {
    params.then(({ id }) => setParamsId(id));
  }, [params]);

  useEffect(() => {
    if (!paramsId) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/properties/${paramsId}`);
        if (!response.ok) {
          setError('Property not found');
          return;
        }
        const data = await response.json();
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch property');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [paramsId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            PhiaRentalLLC
          </Link>
          <div className="space-x-4">
            <Link href="/properties" className="text-gray-600 hover:text-blue-600">
              Browse Properties
            </Link>
            <Link href="/cms" className="text-blue-600 font-semibold">
              CMS
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/cms" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to CMS
        </Link>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading property...</p>
          </div>
        ) : property ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Property</h2>
            <PropertyForm initialData={property} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Property not found</p>
            <Link href="/cms">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
                Return to CMS
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

