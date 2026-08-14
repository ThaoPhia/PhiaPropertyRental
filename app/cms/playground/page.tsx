'use client';

import Link from 'next/link'; 
 
import { useRouter } from 'next/navigation';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useEffect } from 'react';

export default function CMSPlaygroundPage() {
    const router = useRouter();
    const { admin, isLoading: isAuthLoading } = useAdminSession(); 

    useEffect(() => {
        if (!isAuthLoading && admin === null) {
        router.push('/cms/login');
        }
    }, [admin, isAuthLoading, router]);


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
                <div className="mb-4">
                    <Link href="/cms" className="text-sm text-gray-500 hover:text-gray-700">
                        &larr; Back to CMS
                    </Link>
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Playground List</h1>
                    <ul className="list-decimal text-blue-600 text-sm mx-4 my-4">
                        <li className="hover:text-blue-400 odd:bg-gray-100 even:bg-gray-200 p-2 rounded">
                            <Link href="/cms/playground/selectable-test" className="w-full  inline-block">
                                Selectable test
                            </Link>
                        </li>
                        <li className="hover:text-blue-400 odd:bg-gray-100 even:bg-gray-200 p-2 rounded">
                            <Link href="/cms/playground/selectable-items" className="w-full  inline-block">
                                Selectable items
                            </Link>
                        </li>   

                    </ul>
                </div>
            </div>
        </div>
    )
}