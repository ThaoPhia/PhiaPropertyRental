'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PropertyGallery from '@/components/PropertyGallery';
import ApplyNowForm from '@/components/ApplyNowForm';
import { Property } from '@/lib/types';
import { useAdminSession } from '@/hooks/useAdminSession';
import { resolvePropertyHighlightIcon } from '@/components/icons/property-highlight-icons';
import { executeRecaptcha, isRecaptchaConfigured } from '@/lib/recaptcha-client';

interface PropertyDetailClientProps {
  property: Property;
  previousProperty: { id: number; name: string } | null;
  nextProperty: { id: number; name: string } | null;
}

export default function PropertyDetailClient({
  property,
  previousProperty,
  nextProperty,
}: PropertyDetailClientProps) {
  const router = useRouter();
  const recaptchaConfigured = isRecaptchaConfigured();
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [currentAddressStreet, setCurrentAddressStreet] = useState('');
  const [currentAddressCity, setCurrentAddressCity] = useState('');
  const [currentAddressState, setCurrentAddressState] = useState('');
  const [currentAddressZip, setCurrentAddressZip] = useState('');
  const [currentAddressSinceDate, setCurrentAddressSinceDate] = useState('');
  const [householdIncome, setHouseholdIncome] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [totalOccupancy, setTotalOccupancy] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [acknowledgeQuickApplication, setAcknowledgeQuickApplication] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const [applicationSuccess, setApplicationSuccess] = useState('');
  const { admin } = useAdminSession();

  useEffect(() => {
    const handleScroll = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) {
        return;
      }

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
    };

    const timer = setTimeout(() => {
      handleScroll();
      window.addEventListener('hashchange', handleScroll);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleScroll);
    };
  }, []);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    const response = await fetch(`/api/properties/${property.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      setApplicationError('Failed to delete property');
      return;
    }

    router.push('/properties');
  };

  const handleApplyNow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApplicationError('');
    setApplicationSuccess('');
    setApplicationLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha('application');
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          propertyName: property.name,
          applicantName,
          email: applicantEmail,
          phone: applicantPhone,
          currentAddressStreet,
          currentAddressCity,
          currentAddressState,
          currentAddressZip,
          currentAddressSinceDate,
          householdIncome,
          moveInDate,
          totalOccupancy,
          landlordName,
          landlordPhone,
          additionalInfo,
          recaptchaToken,
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
      setCurrentAddressStreet('');
      setCurrentAddressCity('');
      setCurrentAddressState('');
      setCurrentAddressZip('');
      setCurrentAddressSinceDate('');
      setHouseholdIncome('');
      setMoveInDate('');
      setTotalOccupancy('');
      setLandlordName('');
      setLandlordPhone('');
      setAdditionalInfo('');
      setAcknowledgeQuickApplication(false);
    } catch (error) {
      setApplicationError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setApplicationLoading(false);
    }
  };

  const availabilityText = property.status === 'occupied'
    ? 'Currently occupied'
    : property.status === 'removed'
      ? 'Removed'
      : property.dateAvailable
        ? new Date(property.dateAvailable).toLocaleDateString()
        : 'Soon';

  return (
      <div>
        {admin && (
            <div className="mb-2 flex flex-wrap gap-4">
              <Button asChild size="nav">
                <Link href={`/cms/${property.id}`}>
                  Edit Property
                </Link>
              </Button>
              <Button onClick={handleDelete} variant="destructive" size="nav">
                Delete Property
              </Button>
            </div>
        )}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">

          {property.image_url && (
              <div className="relative w-full h-96">
                <Image
                    src={property.image_url}
                    alt={property.name}
                    fill
                    loading="eager"
                    className="object-cover"
                />
              </div>
          )}

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
              {property.status !== 'occupied' && (
                  <p className="text-4xl font-bold text-green-600">
                    ${property.monthlyRent.toLocaleString()}
                    <span className="text-lg font-medium text-gray-500">/mo</span>
                  </p>
              )}
            </div>

            <div className="mb-6">
              <p className="text-lg text-gray-700">
                {property.address}, {property.city}, {property.state} {property.zipCode}
              </p>
            </div>

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

            {(property.status === 'available' || property.status === 'coming soon') && (
                <ApplyNowForm
                    property={property}
                    applicantName={applicantName}
                    setApplicantName={setApplicantName}
                    applicantEmail={applicantEmail}
                    setApplicantEmail={setApplicantEmail}
                    applicantPhone={applicantPhone}
                    setApplicantPhone={setApplicantPhone}
                    currentAddressStreet={currentAddressStreet}
                    setCurrentAddressStreet={setCurrentAddressStreet}
                    currentAddressCity={currentAddressCity}
                    setCurrentAddressCity={setCurrentAddressCity}
                    currentAddressState={currentAddressState}
                    setCurrentAddressState={setCurrentAddressState}
                    currentAddressZip={currentAddressZip}
                    setCurrentAddressZip={setCurrentAddressZip}
                    currentAddressSinceDate={currentAddressSinceDate}
                    setCurrentAddressSinceDate={setCurrentAddressSinceDate}
                    householdIncome={householdIncome}
                    setHouseholdIncome={setHouseholdIncome}
                    moveInDate={moveInDate}
                    setMoveInDate={setMoveInDate}
                    totalOccupancy={totalOccupancy}
                    setTotalOccupancy={setTotalOccupancy}
                    landlordName={landlordName}
                    setLandlordName={setLandlordName}
                    landlordPhone={landlordPhone}
                    setLandlordPhone={setLandlordPhone}
                    additionalInfo={additionalInfo}
                    setAdditionalInfo={setAdditionalInfo}
                    acknowledgeQuickApplication={acknowledgeQuickApplication}
                    setAcknowledgeQuickApplication={setAcknowledgeQuickApplication}
                    applicationLoading={applicationLoading}
                    applicationError={applicationError}
                    applicationSuccess={applicationSuccess}
                    recaptchaConfigured={recaptchaConfigured}
                    onSubmit={handleApplyNow}
                />
            )}

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
  );
}
