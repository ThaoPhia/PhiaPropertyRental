'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface PropertyFiltersProps {
  cities: string[];
}

export default function PropertyFilters({ cities }: PropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (city) params.set('city', city);

    router.push(`/properties?${params.toString()}`);
  };

  const handleReset = () => {
    setType('');
    setCity('');
    router.push('/properties');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Properties</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="duplex">Duplex</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleFilter}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Filter
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

