'use client';

import { Button } from '@/components/ui/button';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminSession } from '@/hooks/useAdminSession';
import { usePropertyById } from '@/hooks/usePropertyById';
import PropertyGallery from '@/components/PropertyGallery';
import ApplyNowForm from '@/components/ApplyNowForm';
import { Badge } from '@/components/ui/badge';
import { resolvePropertyHighlightIcon } from '@/components/icons/property-highlight-icons';

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [paramsId, setParamsId] = useState<string>('');
  const [propertySequence, setPropertySequence] = useState<Array<{ id: number; name: string }>>([]);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [householdIncome, setHouseholdIncome] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const [applicationSuccess, setApplicationSuccess] = useState('');
  const admin = useAdminSession();
  const { property, loading, error, setError } = usePropertyById(paramsId);

  useEffect(() => {
    params.then(({ id }) => setParamsId(id));
  }, [params]);

  useEffect(() => {
    const handleScroll = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        // Multiple retry attempts with increasing delays
        let attempts = 0;
        const maxAttempts = 5;
        
        const tryScroll = () => {
          const element = document.getElementById(hash);
          if (element) {
            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryScroll, 200);
          }
        };
        
        tryScroll();
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      handleScroll();
      window.addEventListener('hashchange', handleScroll);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleScroll);
    };
  }, [paramsId]);

  useEffect(() => {
    const fetchPropertySequence = async () => {
      try {
        const response = await fetch('/api/properties');
        if (!response.ok) {
          return;
        }

        const data = await response.json() as Array<{ id: number; name: string }>;
        setPropertySequence(data.map((item) => ({ id: item.id, name: item.name })));
      } catch {
        setPropertySequence([]);
      }
    };

    fetchPropertySequence();
  }, []);

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

  const handleApplyNow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApplicationError('');
    setApplicationSuccess('');

    if (!property) {
      setApplicationError('Property not found');
      return;
    }

    setApplicationLoading(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          propertyName: property.name,
          applicantName,
          email: applicantEmail,
          phone: applicantPhone,
          householdIncome,
          moveInDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setApplicationError(data?.error || 'Failed to submit application');
        return;
      }

      setApplicationSuccess('Application submitted successfully. We will contact you soon.');
      setApplicantName('');
      setApplicantEmail('');
      setApplicantPhone('');
      setHouseholdIncome('');
      setMoveInDate('');
    } catch (err) {
      setApplicationError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setApplicationLoading(false);
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
  const currentIndex = propertySequence.findIndex((item) => String(item.id) === paramsId);
  const previousProperty = currentIndex > 0 ? propertySequence[currentIndex - 1] : null;
  const nextProperty = currentIndex >= 0 && currentIndex < propertySequence.length - 1
    ? propertySequence[currentIndex + 1]
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <Link href="/properties" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Properties
        </Link>
        {admin && (
          <div className="mb-4 flex flex-wrap gap-4">
            <Button asChild size="nav">
              <Link href={`/cms/${property.id}`}>
                Edit Property
              </Link>
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              size="nav"
            >
              Delete Property
            </Button>
          </div>
        )}

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
                  <Badge variant="detail-status">
                    {property.status}
                  </Badge>
                  <Badge variant="detail">
                    {property.type}
                  </Badge>
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

            {property.status !== 'occupied' && (
              <ApplyNowForm
                property={property}
                applicantName={applicantName}
                setApplicantName={setApplicantName}
                applicantEmail={applicantEmail}
                setApplicantEmail={setApplicantEmail}
                applicantPhone={applicantPhone}
                setApplicantPhone={setApplicantPhone}
                householdIncome={householdIncome}
                setHouseholdIncome={setHouseholdIncome}
                moveInDate={moveInDate}
                setMoveInDate={setMoveInDate}
                applicationLoading={applicationLoading}
                applicationError={applicationError}
                applicationSuccess={applicationSuccess}
                onSubmit={handleApplyNow}
              />
            )}

            {/* Navigation */}
            <div className="flex flex-wrap justify-center gap-4 border-t pt-8">
              {previousProperty ? (
                <Button asChild variant="secondary" size="nav" className="text-gray-800">
                  <Link href={`/properties/${previousProperty.id}`}>
                    ← Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="secondary" size="nav" disabled className="text-gray-500">
                  ← Previous
                </Button>
              )}
              {nextProperty ? (
                <Button asChild variant="secondary" size="nav" className="text-gray-800">
                  <Link href={`/properties/${nextProperty.id}`}>
                    Next →
                  </Link>
                </Button>
              ) : (
                <Button variant="secondary" size="nav" disabled className="text-gray-500">
                  Next →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
