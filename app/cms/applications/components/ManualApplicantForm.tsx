'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type AvailableProperty = {
  id: number;
  name: string;
  city: string;
  state: string;
  status: string;
};

interface ManualApplicantFormProps {
  onCreated?: () => Promise<boolean>;
}

export default function ManualApplicantForm({ onCreated }: ManualApplicantFormProps) {
  const [properties, setProperties] = useState<AvailableProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [formData, setFormData] = useState({
    applicantName: '',
    email: '',
    phone: '',
    householdIncome: '',
    moveInDate: '',
    totalOccupancy: '',
    additionalInfo: '',
  });

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoadingProperties(true);
        const response = await fetch('/api/properties/available');
        if (!response.ok) {
          throw new Error('Failed to load available properties');
        }
        const data = await response.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load available properties');
      } finally {
        setLoadingProperties(false);
      }
    };

    loadProperties();
  }, []);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setPropertyId('');
    setFormData({
      applicantName: '',
      email: '',
      phone: '',
      householdIncome: '',
      moveInDate: '',
      totalOccupancy: '',
      additionalInfo: '',
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/applications/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to create applicant');
      }

      setSuccess('Applicant created and property assigned.');
      resetForm();
      await onCreated?.();
      const refreshResponse = await fetch('/api/properties/available');
      if (refreshResponse.ok) {
        const refreshed = await refreshResponse.json();
        setProperties(Array.isArray(refreshed) ? refreshed : []);
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create applicant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Manual Applicant Assignment</h2>
        <p className="text-sm text-gray-600">
          Creates an approved application silently and marks the selected property occupied.
        </p>
      </div>

      {error && <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700">{success}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">Available Property</span>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
            disabled={loadingProperties}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">{loadingProperties ? 'Loading properties...' : 'Select a property'}</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name} — {property.city}, {property.state}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Applicant Name</span>
          <input
            value={formData.applicantName}
            onChange={(e) => handleChange('applicantName', e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Phone</span>
          <input
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Household Income</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.householdIncome}
            onChange={(e) => handleChange('householdIncome', e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Move-in Date</span>
          <input
            type="date"
            value={formData.moveInDate}
            onChange={(e) => handleChange('moveInDate', e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-gray-700">Total Occupancy</span>
          <input
            type="number"
            min="1"
            value={formData.totalOccupancy}
            onChange={(e) => handleChange('totalOccupancy', e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-gray-700">Additional Info</span>
          <textarea
            value={formData.additionalInfo}
            onChange={(e) => handleChange('additionalInfo', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <div className="md:col-span-2 flex items-center justify-end gap-2">
          <Button asChild type="button" variant="outline">
            <Link href="/cms">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting || loadingProperties}>
            {submitting ? 'Creating...' : 'Create Applicant'}
          </Button>
        </div>
      </form>
    </div>
  );
}
