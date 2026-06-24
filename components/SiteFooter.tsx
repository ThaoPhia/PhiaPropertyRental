import Link from 'next/link';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <p>&copy; {year} PhiaRentalLLC. All rights reserved.</p>
        <Link href="/cms/login" className="text-gray-500 hover:text-white underline-offset-2 hover:underline">
          CMS
        </Link>
      </div>
    </footer>
  );
}
