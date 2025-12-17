'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Availability } from '@/types/supabase'; // Assuming Availability type exists
import { toast } from 'react-hot-toast'; // Assuming a toast notification library like react-hot-toast

interface AvailabilityManagerProps {
  initialAvailability: Availability[];
}

interface DayAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  enabled: boolean;
}

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function AvailabilityManager({
  initialAvailability,
}: AvailabilityManagerProps) {
  const supabase = createClient();
  const [availabilityState, setAvailabilityState] = useState<DayAvailability[]>(() => {
    // Initialize state from initialAvailability props
    const initialState: DayAvailability[] = daysOfWeek.map((_, index) => {
      const existing = initialAvailability.find((a) => a.day_of_week === index);
      return {
        day_of_week: index,
        start_time: existing?.start_time || '09:00',
        end_time: existing?.end_time || '17:00',
        enabled: !!existing,
      };
    });
    return initialState;
  });
  const [loading, setLoading] = useState(false);

  const handleToggleDay = (dayIndex: number) => {
    setAvailabilityState((prev) =>
      prev.map((day) =>
        day.day_of_week === dayIndex ? { ...day, enabled: !day.enabled } : day
      )
    );
  };

  const handleChangeTime = (
    dayIndex: number,
    type: 'start' | 'end',
    value: string
  ) => {
    setAvailabilityState((prev) =>
      prev.map((day) =>
        day.day_of_week === dayIndex
          ? { ...day, [type === 'start' ? 'start_time' : 'end_time']: value }
          : day
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const enabledAvailability = availabilityState.filter((day) => day.enabled);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('You must be logged in to update availability.');
      setLoading(false);
      return;
    }

    const updates = enabledAvailability.map((day) => ({
      detailer_id: user.id,
      day_of_week: day.day_of_week,
      start_time: day.start_time,
      end_time: day.end_time,
    }));

    try {
      // First, delete existing availability for the detailer
      const { error: deleteError } = await supabase
        .from('detailer_availability')
        .delete()
        .eq('detailer_id', user.id);

      if (deleteError) throw deleteError;

      // Then, insert the new availability
      if (updates.length > 0) {
        const { error: insertError } = await supabase
          .from('detailer_availability')
          .insert(updates);

        if (insertError) throw insertError;
      }

      toast.success('Availability updated successfully!');
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast.error(`Failed to update availability: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {availabilityState.map((day) => (
        <div
          key={day.day_of_week}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-md shadow-sm"
        >
          <div className="flex items-center mb-2 sm:mb-0">
            <input
              type="checkbox"
              id={`day-${day.day_of_week}`}
              checked={day.enabled}
              onChange={() => handleToggleDay(day.day_of_week)}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor={`day-${day.day_of_week}`}
              className="ml-3 text-lg font-medium text-gray-700"
            >
              {daysOfWeek[day.day_of_week]}
            </label>
          </div>
          {day.enabled && (
            <div className="flex items-center space-x-3 mt-2 sm:mt-0">
              <input
                id={`start-time-${day.day_of_week}`}
                type="time"
                value={day.start_time}
                onChange={(e) =>
                  handleChangeTime(day.day_of_week, 'start', e.target.value)
                }
                className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                id={`end-time-${day.day_of_week}`}
                type="time"
                value={day.end_time}
                onChange={(e) =>
                  handleChangeTime(day.day_of_week, 'end', e.target.value)
                }
                className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Availability'}
      </button>
    </form>
  );
}
