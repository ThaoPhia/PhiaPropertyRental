import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';
import { ensureDbReady, getDb } from '@/lib/db';
import { ApplicationStatus, PropertyStatus } from '@/lib/types';

export default async function CMSCreatePage() {
  const admin = await getAuthenticatedAdminFromCookies();

  if (!admin) {
    redirect('/cms/login');
  }

  await ensureDbReady();
  const db = getDb();

  const propertySummary = {
    total: db.prepare('SELECT COUNT(*) FROM properties').pluck().get() as number | null,
    available: db.prepare(`SELECT COUNT(*) FROM properties WHERE status = '${PropertyStatus.AVAILABLE}'`).pluck().get() as number | null,
    occupied: db.prepare(`SELECT COUNT(*) FROM properties WHERE status = '${PropertyStatus.OCCUPIED}'`).pluck().get() as number | null,
    comingSoon: db.prepare(`SELECT COUNT(*) FROM properties WHERE status = '${PropertyStatus.COMING_SOON}'`).pluck().get() as number | null,
    removed: db.prepare(`SELECT COUNT(*) FROM properties WHERE status = '${PropertyStatus.REMOVED}'`).pluck().get() as number | null,
  };

  const applicationSummary = {
    total: db.prepare('SELECT COUNT(*) FROM applications').pluck().get() as number | null,
    pending: db.prepare(`SELECT COUNT(*) FROM applications WHERE status IN ('${ApplicationStatus.NONE}', '${ApplicationStatus.PENDING}')`).pluck().get() as number | null,
    approved: db.prepare(`SELECT COUNT(*) FROM applications WHERE status IN ('${ApplicationStatus.APPROVED}', '${ApplicationStatus.APPROVE_ARCHIVED}')`).pluck().get() as number | null,
    declined: db.prepare(`SELECT COUNT(*) FROM applications WHERE status = '${ApplicationStatus.DECLINED}'`).pluck().get() as number | null,
    deleted: db.prepare(`SELECT COUNT(*) FROM applications WHERE status = '${ApplicationStatus.DELETED}'`).pluck().get() as number | null,
  };

  const recentProperties = db.prepare(`
    SELECT id, name, status, city, state, created_at
    FROM properties
    ORDER BY datetime(created_at) DESC
    LIMIT 5
  `).all() as Array<{
    id: number;
    name: string;
    status: string;
    city: string;
    state: string;
    created_at: string;
  }>;
  const occupiedApplicants = db.prepare(`
    SELECT property_id, applicant_name
    FROM applications
    WHERE status = '${ApplicationStatus.APPROVED}'
  `).all() as Array<{
    property_id: number;
    applicant_name: string;
  }>;
  const occupiedApplicantByPropertyId = new Map<number, string>(
    occupiedApplicants.map((row) => [row.property_id, row.applicant_name])
  );

  const recentApplications = db.prepare(`
    SELECT id, applicant_name, property_name, status, created_at
    FROM applications
    ORDER BY datetime(created_at) DESC
    LIMIT 5
  `).all() as Array<{
    id: number;
    applicant_name: string;
    property_name: string;
    status: string;
    created_at: string;
  }>;

  const propertyStats = [
    { label: 'Total Properties', value: propertySummary.total ?? 0, accent: 'text-gray-900' },
    { label: 'Available', value: propertySummary.available ?? 0, accent: 'text-emerald-600' },
    { label: 'Occupied', value: propertySummary.occupied ?? 0, accent: 'text-amber-600' },
    { label: 'Coming Soon', value: propertySummary.comingSoon ?? 0, accent: 'text-blue-600' },
  ];

  const applicationStats = [
    { label: 'Total Applications', value: applicationSummary.total ?? 0, accent: 'text-gray-900' },
    { label: 'Pending Review', value: applicationSummary.pending ?? 0, accent: 'text-red-600' },
    { label: 'Approved', value: applicationSummary.approved ?? 0, accent: 'text-emerald-600' },
    { label: 'Declined', value: applicationSummary.declined ?? 0, accent: 'text-slate-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Management System</h1>
            <p className="text-sm text-gray-600 mt-1">
              Signed in as {admin.name || 'Admin'} ({admin.email})
              | <Link href="/cms/playground" className="text-blue-600 hover:underline">Playground</Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/cms/applications" className="text-blue-600 hover:underline inline-block">
              View Applications
            </Link>
            <Link href="/cms/profile" className="text-blue-600 hover:underline inline-block">
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/properties">
            <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer border-2 border-gray-200 hover:border-blue-600">
              <h3 className="font-semibold text-gray-900">All Properties</h3>
              <p className="text-sm text-gray-600">View and manage all properties</p>
            </div>
          </Link>
          <Link href="/cms/manual-applicant">
            <div className="p-4 bg-emerald-50 rounded-lg shadow hover:shadow-lg cursor-pointer border-2 border-emerald-600">
              <h3 className="font-semibold text-gray-900">Manual Applicant</h3>
              <p className="text-sm text-gray-600">Create and assign a renter to an available property</p>
            </div>
          </Link>
          <Link href="/cms/create">
            <div className="p-4 bg-blue-50 rounded-lg shadow hover:shadow-lg cursor-pointer border-2 border-blue-600">
              <h3 className="font-semibold text-gray-900">Create New</h3>
              <p className="text-sm text-gray-600">Add a new property listing</p>
            </div>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {propertyStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {applicationStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </div>



        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Properties</h2>
                <p className="text-sm text-gray-600">Newest listings and status changes.</p>
              </div>
              <Link href="/properties" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>

            {recentProperties.length === 0 ? (
              <p className="text-sm text-gray-500">No properties yet.</p>
            ) : (
              <div className="space-y-3">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3">
                    <div>
                      <Link href={`/cms/${property.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {property.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {property.city}, {property.state}
                      </p>
                      {property.status === PropertyStatus.OCCUPIED && occupiedApplicantByPropertyId.has(property.id) && (
                        <p className="text-xs text-emerald-700">
                          Current applicant: {occupiedApplicantByPropertyId.get(property.id)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize text-gray-700">{property.status}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(property.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
                <p className="text-sm text-gray-600">Latest renter applications to review.</p>
              </div>
              <Link href="/cms/applications" className="text-sm text-blue-600 hover:underline">
                Open inbox
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <p className="text-sm text-gray-500">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((application) => (
                  <div key={application.id} className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{application.applicant_name}</p>
                      <p className="text-sm text-gray-500">{application.property_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize text-gray-700">
                        {application.status || ApplicationStatus.PENDING}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
