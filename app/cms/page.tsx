import Link from 'next/link';
import PropertyForm from '@/components/PropertyForm';

export default function CMSCreatePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            PhiaRentalLLC
          </Link>
          <div className="space-x-4">
            <Link href="/properties" className="text-gray-600 hover:text-blue-600">
              Browse Properties
            </Link>
            <Link href="/cms" className="text-blue-600 font-semibold">
              CMS
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Property Management System</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/cms">
            <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer border-2 border-gray-200 hover:border-blue-600">
              <h3 className="font-semibold text-gray-900">All Properties</h3>
              <p className="text-sm text-gray-600">View and manage all properties</p>
            </div>
          </Link>
          <div className="p-4 bg-blue-50 rounded-lg shadow border-2 border-blue-600">
            <h3 className="font-semibold text-gray-900">Create New</h3>
            <p className="text-sm text-gray-600">Add a new property listing</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Property</h2>
          <PropertyForm />
        </div>
      </div>
    </div>
  );
}

