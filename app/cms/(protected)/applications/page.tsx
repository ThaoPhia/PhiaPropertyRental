'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationStatus } from '@/lib/types/types';
import type { Application } from '@/lib/types/types';
import { useAdminSession } from '@/hooks/useAdminSession';
import { ApplicationsListPanel } from '@/components/cms/ApplicationsListPanel';
import { ApplicationDetailsPanel } from '@/components/cms/ApplicationDetailsPanel';

export default function ApplicationsPage() {
  const router = useRouter();
  const { admin, isLoading: isAuthLoading } = useAdminSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthLoading && admin === null) {
      router.push('/cms/login');
    }
  }, [admin, isAuthLoading, router]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/applications');
        if (!response.ok) {
          setError('Failed to fetch applications');
          return;
        }

        const data = await response.json();
        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getFilteredApplications = () => {
    return applications.filter((app) => {
      if (statusFilter === null && app.status === ApplicationStatus.DELETED) return false;
      if (statusFilter && app.status !== statusFilter) return false;
      
      if (dateFromFilter) {
        const appDate = new Date(app.createdAt).toLocaleDateString('en-CA');
        if (appDate < dateFromFilter) return false;
      }
      
      if (dateToFilter) {
        const appDate = new Date(app.createdAt).toLocaleDateString('en-CA');
        if (appDate > dateToFilter) return false;
      }
      
      return true;
    });
  };

  const refreshApplications = async () => {
    const appResponse = await fetch('/api/applications');
    if (!appResponse.ok) return false;
    const updatedApps = await appResponse.json();
    setApplications(Array.isArray(updatedApps) ? updatedApps : []);
    setSelectedApplication(null);
    return true;
  };

  if (isAuthLoading) {
    return null;
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rental Applications</h1>
            <p className="text-sm text-gray-600 mt-1">Manage tenant rental applications</p>
          </div>
          <Link href="/cms" className="text-blue-600 hover:underline">
            ← Back to CMS
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No applications yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
            <ApplicationsListPanel
              applications={getFilteredApplications()}
              selectedApplicationId={selectedApplication?.id ?? null}
              statusFilter={statusFilter}
              dateFromFilter={dateFromFilter}
              dateToFilter={dateToFilter}
              onStatusFilterChange={setStatusFilter}
              onDateFromFilterChange={setDateFromFilter}
              onDateToFilterChange={setDateToFilter}
              onClearDateFilters={() => {
                setDateFromFilter('');
                setDateToFilter('');
              }}
              onSelectApplication={setSelectedApplication}
            />
            <div className="lg:col-span-2">
              <ApplicationDetailsPanel
                key={selectedApplication?.id ?? 'no-selection'}
                selectedApplication={selectedApplication}
                onApplicationsChanged={refreshApplications}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
