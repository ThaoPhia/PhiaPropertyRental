'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PropertyFormData, Property } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PropertyFormProps {
  initialData?: Property;
}

export default function PropertyForm({ initialData }: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const initialImages = Array.from(
    new Set([...(initialData?.images ?? []), ...(initialData?.image_url ? [initialData.image_url] : [])])
  );
  const [currentImages, setCurrentImages] = useState<string[]>(initialImages);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [highlightsJson, setHighlightsJson] = useState(
    initialData?.highlights?.length
      ? JSON.stringify(initialData.highlights, null, 2)
      : JSON.stringify(
          [
            { icon: 'GarageIcon', text: 'Spacious layout' },
            { icon: 'GarageIcon', text: 'Modern amenities' },
          ],
          null,
          2
        )
  );
  const [formData, setFormData] = useState<PropertyFormData>(() =>
    initialData
      ? {
          name: initialData.name,
          type: initialData.type,
          status: initialData.status,
          address: initialData.address,
          city: initialData.city,
          state: initialData.state,
          zipCode: initialData.zipCode,
          bedrooms: initialData.bedrooms,
          bathrooms: initialData.bathrooms,
          squareFeet: initialData.squareFeet,
          monthlyRent: initialData.monthlyRent,
          details: initialData.details,
          dateAvailable: initialData.dateAvailable ?? '',
          image_url: initialData.image_url,
        }
      : {
      name: '',
      type: 'apartment',
      status: 'available',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 1000,
      monthlyRent: 0,
      details: '',
      dateAvailable: '',
      image_url: '',
      }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['bedrooms', 'bathrooms', 'squareFeet', 'monthlyRent'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    setLoading(true);
    setError('');

    try {
      const submission = new FormData(form);
      removedImages.forEach((imageUrl) => submission.append('removedImages', imageUrl));
      currentImages
        .filter((imageUrl) => !removedImages.includes(imageUrl))
        .forEach((imageUrl) => submission.append('imageOrder', imageUrl));
      const url = initialData
        ? `/api/properties/${initialData.id}`
        : '/api/properties';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submission,
      });

      if (!response.ok) {
        throw new Error('Failed to save property');
      }

      router.push(initialData ? `/properties/${initialData.id}` : '/properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleImageRemoval = (imageUrl: string) => {
    setRemovedImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((item) => item !== imageUrl) : [...prev, imageUrl]
    );
  };

  const moveImageToIndex = (imageUrl: string, targetImageUrl: string) => {
    setCurrentImages((prev) => {
      const sourceIndex = prev.indexOf(imageUrl);
      const targetIndex = prev.indexOf(targetImageUrl);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="apartment">Apartment</option>
            <option value="duplex">Duplex</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="coming soon">Coming Soon</option>
          </select>
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Zip Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zip Code *
          </label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bedrooms *
          </label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bathrooms *
          </label>
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Square Feet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Square Feet *
          </label>
          <input
            type="number"
            name="squareFeet"
            value={formData.squareFeet}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Monthly Rent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Rent *
          </label>
          <input
            type="number"
            name="monthlyRent"
            value={formData.monthlyRent}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Available
          </label>
          <input
            type="date"
            name="dateAvailable"
            value={formData.dateAvailable}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Image URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images
          </label>
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {currentImages.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-2">Current images</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentImages.map((imageUrl, index) => (
                  <div
                    key={`${imageUrl}-${index}`}
                    draggable={initialData ? !removedImages.includes(imageUrl) : false}
                    onDragStart={() => setDraggedImage(imageUrl)}
                    onDragOver={(event) => {
                      if (initialData && draggedImage && draggedImage !== imageUrl) {
                        event.preventDefault();
                      }
                    }}
                    onDrop={() => {
                      if (initialData && draggedImage) {
                        moveImageToIndex(draggedImage, imageUrl);
                      }
                      setDraggedImage(null);
                    }}
                    onDragEnd={() => setDraggedImage(null)}
                    className={`relative h-32 w-full overflow-hidden rounded-md border ${
                      removedImages.includes(imageUrl) ? 'border-red-400 opacity-50' : 'border-gray-200'
                    } ${draggedImage === imageUrl ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${initialData?.name || 'Property'} image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {initialData && (
                      <div className="absolute inset-x-2 top-2 flex justify-between gap-2">
                        <span className="rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                          Drag to reorder
                        </span>
                        <Button
                          type="button"
                          onClick={() => toggleImageRemoval(imageUrl)}
                          size="xs"
                          variant="secondary"
                          className="h-auto bg-black/70 px-2 py-1 text-xs font-medium text-white hover:bg-black/80"
                        >
                          {removedImages.includes(imageUrl) ? 'Undo' : 'Remove'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {removedImages.length > 0 && (
            <p className="mt-2 text-sm text-red-600">{removedImages.length} image(s) marked for deletion.</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Details
          </label>
          <textarea
            name="details"
            value={formData.details}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Highlights (JSON)
          </label>
          <textarea
            name="highlights"
            value={highlightsJson}
            onChange={(event) => setHighlightsJson(event.target.value)}
            rows={6}
            className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Use a JSON array like: {"[{\"icon\":\"GarageIcon\",\"text\":\"Spacious layout\"}]"}
          </p>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-10 font-medium"
        >
          {loading ? 'Saving...' : initialData ? 'Update Property' : 'Create Property'}
        </Button>
        <Button
          type="button"
          onClick={() => router.back()}
          variant="secondary"
          className="flex-1 h-10 text-gray-800 font-medium"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
