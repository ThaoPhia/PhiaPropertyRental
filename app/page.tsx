import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const highlights = [
    { label: 'Modern & Unique', value: 'Thoughtful Layouts' },
    { label: 'Quality', value: 'Well-Maintained Spaces' },
    { label: 'Support', value: 'Professional Management' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50">
      <section className="max-w-[92rem] mx-auto px-4 md:px-6 pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge>Phia Rental LLC</Badge>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
              Beautiful, Move-In Ready Homes
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600">
              Explore a curated set of homes with quality finishes, thoughtful layouts, and
              professional property management.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="px-8 font-semibold">
                <Link href="/properties">Browse Properties</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8 font-semibold">
                <a href="mailto:contact@phiarentalllc.com">Contact Us</a>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900">Why Rent with Us</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Curated inventory</p>
                <p className="mt-1 text-sm text-slate-600">
                  A focused portfolio so every listing gets attention and care.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Premium presentation</p>
                <p className="mt-1 text-sm text-slate-600">
                  Clear photos, detailed highlights, and transparent pricing.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Responsive management</p>
                <p className="mt-1 text-sm text-slate-600">
                  Fast communication and dependable support for tenants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[92rem] mx-auto px-4 md:px-6 pb-16 md:pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div key={highlight.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-blue-700 font-semibold">{highlight.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{highlight.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[92rem] mx-auto px-4 md:px-6 pb-16 md:pb-24">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 md:p-8">
              <p className="text-sm uppercase tracking-wide text-blue-700 font-semibold">Our Location</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Menasha, Wisconsin</h2>
              <p className="mt-3 text-slate-600 max-w-xl">
                We proudly serve renters in Menasha and the surrounding Fox Valley area, with
                access to local parks, shopping, dining, and major commuter routes.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="px-6 font-semibold">
                  <Link href="/properties">Browse Properties</Link>
                </Button>
                <Button asChild variant="secondary" className="px-6 font-semibold">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Menasha%2C+WI"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
            <div className="min-h-[320px] border-t lg:border-t-0 lg:border-l border-slate-200">
              <iframe
                title="Map of Menasha, WI"
                src="https://www.google.com/maps?q=Menasha,WI&output=embed"
                className="h-full min-h-[320px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
