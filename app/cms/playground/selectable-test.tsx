import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdminFromCookies } from '@/lib/auth';
import { ensureDbReady, getDb } from '@/lib/db';
import { ApplicationStatus, PropertyStatus } from '@/lib/types'; 
 
export default async function CMSPlaygroundPage() {

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
                <div>
                    <Link href="/cms" className="text-sm text-gray-500 hover:text-gray-700">
                        &larr; Back to CMS
                    </Link>
                </div>
                <div>
                    Testing... coming soon... Add that test here...
                </div>
            </div>
        </div>
    )
}