'use client';

import React from 'react';

// Define a type for the booking with joined data
interface BookingWithDetails {
  id: string;
  booking_time: string;
  location_address: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  final_price: number;
  services?: {
    name: string;
    description?: string;
    price: number;
  };
  profiles?: {
    full_name?: string;
  };
}

interface BookingsListProps {
  bookings: BookingWithDetails[];
}

export default function BookingsList({ bookings }: BookingsListProps) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No bookings to display.</p>
      </div>
    );
  }

  const getStatusClasses = (status: BookingWithDetails['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {booking.profiles?.full_name || 'Unknown Customer'}
            </h3>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Service:</span> {booking.services?.name || 'Unknown Service'}
            </p>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Location:</span> {booking.location_address}
            </p>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">Date:</span> {
                new Date(booking.booking_time).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
            </p>
            <p className="text-gray-700 font-semibold mb-2">
              Price: ${booking.final_price}
            </p>
          </div>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(
              booking.status
            )}`}
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </div>
        </div>
      ))}
    </div>
  );
}
