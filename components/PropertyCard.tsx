'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Property } from '@/lib/types';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {property.image_url && (
      <Link href={`/properties/${property.id}`} className="block relative w-full h-48">
          <Image
            src={property.image_url}
            alt={property.name}
            fill
            className="object-cover"
          />
      </Link>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-800">{property.name}</h3>
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            {property.type}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-2">
          {property.address}, {property.city}, {property.state} {property.zipCode}
        </p>
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
          {property.description}
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
          <div className="text-center">
            <p className="text-gray-500">Beds</p>
            <p className="font-semibold">{property.bedrooms}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Baths</p>
            <p className="font-semibold">{property.bathrooms}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Sq Ft</p>
            <p className="font-semibold">{property.squareFeet.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-green-600">
            ${property.price.toLocaleString()}
          </span>
          <Link href={`/properties/${property.id}`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm cursor-pointer">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
