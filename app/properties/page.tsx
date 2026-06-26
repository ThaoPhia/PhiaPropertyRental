'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/lib/types';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/properties');
        if (!response.ok) {
          setError('Failed to fetch properties');
          return;
        }

        const data = await response.json();
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white/80 p-6 md:p-10 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-blue-700">Phia Rental LLC</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Beautiful Homes, Carefully Maintained
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600 text-base md:text-lg">
            Explore our curated portfolio of rentals with spacious layouts, premium finishes, and
            ready-to-move-in comfort.
          </p>
          {!loading && properties.length > 0 && (
            <div className="mt-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
              {properties.length} {properties.length === 1 ? 'Property Available' : 'Properties Available'}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        )}

        {!loading && properties.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <p className="text-gray-600 mb-4">No properties found.</p>
            <Link href="/cms">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
                Add a Property
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
