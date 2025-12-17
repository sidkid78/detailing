
import React from 'react';
import Link from 'next/link';
import { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <div className="group relative h-full pt-4">
      {/* Card container */}
      <div className="relative h-full bg-white rounded-3xl shadow-2xl card-hover">

        {/* Content */}
        <div className="relative p-8">
          {/* Popular Badge */}
          <div className="absolute -top-3 right-6">
            <div className="bg-linear-to-r from-yellow-400 via-orange-400 to-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wide">
              Popular
            </div>
          </div>

          {/* Title */}
          <h3 className="text-3xl font-black text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
            {service.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            {service.description}
          </p>

          {/* Duration */}
          <div className="flex items-center gap-2 text-gray-500 mb-8">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{service.estimated_duration_minutes} minutes</span>
          </div>

          {/* Features */}
          {service.features && service.features.length > 0 && (
            <ul className="space-y-3 mb-8">
              {service.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-base">{feature}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Price and CTA */}
          <div className="pt-6 border-t-2 border-gray-100">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ${service.price}
                  </span>
                </div>
                <span className="text-sm text-gray-500 font-medium">per service</span>
              </div>
            </div>

            <Link href="/book" className="block">
              <button className="w-full group/btn relative bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 text-lg">
                <span>Book Now</span>
                <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>

                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
