'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PropertyFormData, Property, PropertyImage, PropertyStatus } from '@/lib/types/types';
import DetailsRichTextEditor from '@/components/cms/DetailsRichTextEditor';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PropertyFormProps {
  initialData?: Property;
}

type PendingUploadImage = {
  id: string;
  file: File;
  description: string;
};

export default function PropertyForm({ initialData }: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState('');
  const initialImages = (() => {
    const galleryImages = initialData?.gallery_images ?? (initialData?.images ?? []).map((url) => ({
      url,
      description: '',
    }));
    const deduped = new Map<string, PropertyImage>();

    galleryImages.forEach((image) => {
      if (!deduped.has(image.url)) {
        deduped.set(image.url, { url: image.url, description: image.description });
      }
    });

    if (initialData?.image_url && !deduped.has(initialData.image_url)) {
      deduped.set(initialData.image_url, { url: initialData.image_url, description: '' });
    }

    return Array.from(deduped.values());
  })();
  const [currentImages, setCurrentImages] = useState<PropertyImage[]>(initialImages);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<PendingUploadImage[]>([]);
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
          zipCode: initialData.zip_code,
          bedrooms: initialData.bedrooms,
          bathrooms: initialData.bathrooms,
          squareFeet: initialData.square_feet,
          monthlyRent: initialData.monthly_rent,
          details: initialData.details,
          dateAvailable: initialData.date_available ?? '',
          image_url: initialData.image_url,
        }
      : {
      name: '',
      type: 'apartment',
      status: PropertyStatus.AVAILABLE,
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

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    setSelectedUploadFiles(nextFiles.map((file) => createPendingUploadImage(file)));
  };

  const createPendingUploadImage = (file: File): PendingUploadImage => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${globalThis.crypto.randomUUID()}`,
    file,
    description: '',
  });

  const mergeUploadFiles = (incomingFiles: File[]) => {
    setSelectedUploadFiles((prev) => {
      const deduped = new Map<string, PendingUploadImage>();
      prev.forEach((image) => {
        deduped.set(`${image.file.name}-${image.file.size}-${image.file.lastModified}`, image);
      });
      incomingFiles.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!deduped.has(key)) {
          deduped.set(key, createPendingUploadImage(file));
        }
      });
      return Array.from(deduped.values());
    });
  };

  const removeSelectedUploadFile = (targetImageId: string) => {
    setSelectedUploadFiles((prev) =>
      prev.filter((image) => image.id !== targetImageId)
    );
  };

  const updateSelectedUploadDescription = (targetImageId: string, description: string) => {
    setSelectedUploadFiles((prev) =>
      prev.map((image) => (image.id === targetImageId ? { ...image, description } : image))
    );
  };

  const handleUploadDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingUpload(false);
    const droppedFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (droppedFiles.length > 0) {
      mergeUploadFiles(droppedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    setLoading(true);
    setError('');

    try {
      const submission = new FormData(form);
      selectedUploadFiles.forEach(({ file, description }) => {
        submission.append('images', file);
        submission.append('newImageDescriptions', description.trim());
      });
      removedImages.forEach((imageUrl) => submission.append('removedImages', imageUrl));
      const retainedImages = currentImages.filter((image) => !removedImages.includes(image.url));
      retainedImages.forEach((image) => submission.append('imageOrder', image.url));
      submission.append(
        'existingImageDescriptions',
        JSON.stringify(
          Object.fromEntries(retainedImages.map((image) => [image.url, image.description.trim()]))
        )
      );
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

  const handleDelete = async () => {
    if (!initialData) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/properties/${initialData.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove property');
      }

      router.push('/properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const toggleImageRemoval = (imageUrl: string) => {
    setRemovedImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((item) => item !== imageUrl) : [...prev, imageUrl]
    );
  };

  const moveImageToIndex = (imageUrl: string, targetImageUrl: string) => {
    setCurrentImages((prev) => {
      const sourceIndex = prev.findIndex((image) => image.url === imageUrl);
      const targetIndex = prev.findIndex((image) => image.url === targetImageUrl);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const updateCurrentImageDescription = (imageUrl: string, description: string) => {
    setCurrentImages((prev) =>
      prev.map((image) => (image.url === imageUrl ? { ...image, description } : image))
    );
  };

  return (
    <>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this property?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setShowDeleteDialog(false);
                await handleDelete();
              }}
              disabled={deleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <option value={PropertyStatus.AVAILABLE}>Available</option>
            <option value={PropertyStatus.OCCUPIED}>Occupied</option>
            <option value={PropertyStatus.COMING_SOON}>Coming Soon</option>
            <option value={PropertyStatus.REMOVED}>Removed</option>
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
            step="0.5"
            inputMode="decimal"
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
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingUpload(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingUpload(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDraggingUpload(false);
            }}
            onDrop={handleUploadDrop}
            className={`rounded-lg border border-dashed p-4 transition-colors ${
              isDraggingUpload
                ? 'border-blue-500 bg-blue-100/70'
                : 'border-blue-300 bg-blue-50/40'
            }`}
          >
            <input
              id="property-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              className="sr-only"
            />
            <label
              htmlFor="property-images"
              className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-blue-200 bg-white px-4 py-6 text-center hover:bg-blue-50"
            >
              <span className="text-sm font-semibold text-blue-800">
                {isDraggingUpload ? 'Drop images to upload' : 'Drop images here or click to browse'}
              </span>
              <span className="mt-1 text-xs text-slate-600">Supports multiple image files (JPG, PNG, WEBP)</span>
            </label>
            {selectedUploadFiles.length > 0 && (
              <div className="mt-3 rounded-md bg-white p-3">
                <p className="text-sm font-medium text-slate-800">
                  {selectedUploadFiles.length} new image{selectedUploadFiles.length === 1 ? '' : 's'} selected
                </p>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {selectedUploadFiles.slice(0, 5).map((image) => (
                    <li
                      key={image.id}
                      className="rounded px-2 py-2 hover:bg-slate-100 odd:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm">{image.file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="h-auto px-2 py-1 text-xs text-slate-600 hover:text-red-700 cursor-pointer"
                          onClick={() => removeSelectedUploadFile(image.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <input
                        type="text"
                        value={image.description}
                        onChange={(event) => updateSelectedUploadDescription(image.id, event.target.value)}
                        placeholder="Image description"
                        className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </li>
                  ))}
                  {selectedUploadFiles.length > 5 && (
                    <li>+{selectedUploadFiles.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          {currentImages.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-2">Current images</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentImages.map((image, index) => (
                  <div
                    key={`${image.url}-${index}`}
                    draggable={initialData ? !removedImages.includes(image.url) : false}
                    onDragStart={() => setDraggedImage(image.url)}
                    onDragOver={(event) => {
                      if (initialData && draggedImage && draggedImage !== image.url) {
                        event.preventDefault();
                      }
                    }}
                    onDrop={() => {
                      if (initialData && draggedImage) {
                        moveImageToIndex(draggedImage, image.url);
                      }
                      setDraggedImage(null);
                    }}
                    onDragEnd={() => setDraggedImage(null)}
                    className={`overflow-hidden rounded-md border ${
                      removedImages.includes(image.url) ? 'border-red-400 opacity-50' : 'border-gray-200'
                    } ${draggedImage === image.url ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <div className="relative h-32 w-full">
                      <Image
                        src={image.url}
                        alt={image.description || `${initialData?.name || 'Property'} image ${index + 1}`}
                        fill
                        sizes="(min-width: 768px) 33vw, 50vw"
                        loading="eager"
                        className="object-cover"
                      />
                      {initialData && (
                        <div className="absolute inset-x-2 top-2 flex justify-between gap-2">
                          <span className="rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                            Drag to reorder
                          </span>
                          <Button
                            type="button"
                            onClick={() => toggleImageRemoval(image.url)}
                            size="xs"
                            variant="secondary"
                            className="h-auto bg-black/70 px-2 py-1 text-xs font-medium text-white hover:bg-black/80"
                          >
                            {removedImages.includes(image.url) ? 'Undo' : 'Remove'}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 bg-white p-2">
                      <input
                        type="text"
                        value={image.description}
                        onChange={(event) => updateCurrentImageDescription(image.url, event.target.value)}
                        placeholder="Image description"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {removedImages.length > 0 && (
            <p className="mt-2 text-sm text-red-600">{removedImages.length} image(s) marked for deletion.</p>
          )}
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Details
          </label>
          <DetailsRichTextEditor
            value={formData.details}
            onChange={(details) => setFormData((prev) => ({ ...prev, details }))}
          />
          <input type="hidden" name="details" value={formData.details} />
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

        <div className="flex gap-4 mt-6 justify-center">
          <Button
            type="submit"
            disabled={loading || deleting}
            className="h-10 font-medium"
          >
            {loading ? 'Saving...' : initialData ? 'Update Property' : 'Create Property'}
          </Button>
          {initialData && (
            <Button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              disabled={loading || deleting}
              className="h-10 font-medium"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => router.back()}
            variant="secondary"
            disabled={loading || deleting}
            className="h-10 text-gray-800 font-medium"
          >
            Cancel
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500 text-center">NOTE: Remember to re-deploy for changes to take effect.</p>
      </form>
    </>
  );
}
