import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">PhiaRentalLLC</h1>
          <div className="space-x-4">
            <Link href="/properties" className="text-gray-600 hover:text-blue-600">
              Browse Properties
            </Link>
            <Link href="/cms" className="text-gray-600 hover:text-blue-600">
              CMS
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Find Your Perfect Property
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Discover premium apartments and duplexes in your ideal location
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/properties">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg">
              Browse Properties
            </button>
          </Link>
          <Link href="/cms">
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg">
              Add Property (CMS)
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Premium Properties</h3>
            <p className="text-gray-600">
              Handpicked apartments and duplexes in prime locations
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Easy to Search</h3>
            <p className="text-gray-600">
              Filter by location, type, and price to find your match
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-semibold mb-2">Professional CMS</h3>
            <p className="text-gray-600">
              Easily manage and update your property listings
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 PhiaRentalLLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

