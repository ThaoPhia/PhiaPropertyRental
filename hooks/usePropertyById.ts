'use client';

import { useEffect, useState } from 'react';
import { Property } from '@/lib/types/types';

export function usePropertyById(propertyId: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!propertyId) {
      return;
    }

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/properties/${propertyId}`);

        if (!response.ok) {
          setError('Property not found');
          setProperty(null);
          return;
        }

        const data = await response.json();
        setProperty(data);
        setError('');
      } catch (err) {
        setProperty(null);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  return {
    property,
    loading,
    error,
    setError,
  };
}
