import Link from 'next/link';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <p>&copy; {year} PhiaRentalLLC. All rights reserved.</p>
        <Link href="/contact" className="text-slate-200 hover:text-white">
          Contact Us
        </Link>
      </div>
    </footer>
  );
}
