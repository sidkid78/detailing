

import { createClient } from '@/lib/supabase/server';
import { Service } from '@/types';
import ServiceCard from '@/components/ServiceCard';
import Navigation from '@/components/Navigation';

export default async function HomePage() {
  const supabase = await createClient();

  const { data: services, error } = await supabase.from('services').select('*');

  if (error) {
    console.error('Error fetching services:', error);
    return (
      <>
        <Navigation />
        <div className="flex justify-center items-center min-h-screen pt-16">
          <div className="glass rounded-2xl p-8 text-white text-center">
            <p className="text-xl">Failed to load services. Please try again later.</p>
          </div>
        </div>
      </>
    );
  }

  const typedServices: Service[] = (services || []) as Service[];

  return (
    <>
      <Navigation />
      <div className="min-h-screen relative overflow-hidden pt-16">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-20 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-lg mb-8">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold text-gray-800">Premium Mobile Detailing</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                Our Detailing
                <span className="block mt-2 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Packages
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto font-medium leading-relaxed">
                Professional car care delivered to your doorstep.<br />
                Choose the perfect package for your vehicle.
              </p>
            </div>

            {/* Services Grid */}
            {typedServices.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center animate-fade-in-up">
                <p className="text-gray-800 text-xl font-light">
                  No services available at the moment. Please check back later!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {typedServices.map((service, index) => (
                  <div
                    key={service.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <ServiceCard service={service} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
