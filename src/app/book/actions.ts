'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Zod Schemas
const getAvailableSlotsSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  bookingTime: z.string(),
  locationAddress: z.string().min(10),
});

// Server Actions

/**
 * Fetches all active services from the database.
 * @returns A list of services or an error message.
 */
export async function getServices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('price');

  if (error) {
    console.error('Error fetching services:', error);
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

/**
 * Calculates and returns available time slots for a given service and date.
 * Calls the find_available_detailer database function.
 * @param params - serviceId and date for which to find slots.
 * @returns A list of available slots or an error message.
 */
export async function getAvailableSlots(params: z.infer<typeof getAvailableSlotsSchema>) {
  const validation = getAvailableSlotsSchema.safeParse(params);

  if (!validation.success) {
    return { success: false, message: 'Invalid input for getting available slots.' };
  }

  const { serviceId, date } = validation.data;
  const supabase = await createClient();

  // 1. Get service duration
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('estimated_duration_minutes')
    .eq('id', serviceId)
    .single();

  if (serviceError || !service) {
    console.error('Error fetching service duration or service not found:', serviceError);
    return { success: false, message: 'Service not found or error fetching duration.' };
  }

  const serviceDuration = service.estimated_duration_minutes;

  // 2. Fetch detailer availability for the given date's day of the week
  const dayOfWeek = new Date(date).getDay();
  const { data: availabilities, error: availabilityError } = await supabase
    .from('detailer_availability')
    .select('detailer_id, start_time, end_time')
    .eq('day_of_week', dayOfWeek);

  if (availabilityError) {
    console.error('Error fetching detailer availability:', availabilityError);
    return { success: false, message: 'Error fetching detailer availability.' };
  }

  if (!availabilities || availabilities.length === 0) {
    return { success: true, data: [] };
  }

  // 3. Fetch existing bookings for the given date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: existingBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('detailer_id, booking_time, service_id')
    .gte('booking_time', startOfDay.toISOString())
    .lte('booking_time', endOfDay.toISOString());

  if (bookingsError) {
    console.error('Error fetching existing bookings:', bookingsError);
    return { success: false, message: 'Error fetching existing bookings.' };
  }

  const availableSlots: { detailerId: string; startTime: string; endTime: string }[] = [];

  // Generate slots for each detailer based on their availability
  for (const availability of availabilities) {
    const detailerBookings = existingBookings?.filter(b => b.detailer_id === availability.detailer_id) || [];
    const detailerStartTime = new Date(`${date}T${availability.start_time}`);
    const detailerEndTime = new Date(`${date}T${availability.end_time}`);

    let currentSlotStart = detailerStartTime;

    while (currentSlotStart.getTime() + serviceDuration * 60 * 1000 <= detailerEndTime.getTime()) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + serviceDuration * 60 * 1000);

      // Check for overlap with existing bookings for this detailer
      const hasOverlap = detailerBookings.some(booking => {
        const bookingStart = new Date(booking.booking_time);
        const bookingEnd = new Date(bookingStart.getTime() + serviceDuration * 60 * 1000);
        return (
          (currentSlotStart < bookingEnd && currentSlotEnd > bookingStart)
        );
      });

      if (!hasOverlap) {
        availableSlots.push({
          detailerId: availability.detailer_id,
          startTime: currentSlotStart.toISOString(),
          endTime: currentSlotEnd.toISOString(),
        });
      }
      // Move to next slot (every 30 minutes)
      currentSlotStart = new Date(currentSlotStart.getTime() + 30 * 60 * 1000);
    }
  }

  return { success: true, data: availableSlots };
}

/**
 * Creates a new booking in the database.
 * @param params - Details for the new booking (serviceId, bookingTime, locationAddress).
 * @returns The created booking data or an error message.
 */
export async function createBooking(params: z.infer<typeof createBookingSchema>) {
  const validation = createBookingSchema.safeParse(params);

  if (!validation.success) {
    return { success: false, message: 'Invalid input for creating booking.', errors: validation.error.flatten() };
  }

  const { serviceId, bookingTime, locationAddress } = validation.data;
  const supabase = await createClient();

  // Get the current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: 'User not authenticated.' };
  }

  // Get service details including price
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (serviceError || !service) {
    return { success: false, message: 'Service not found.' };
  }

  // Find an available detailer for this booking time
  const bookingDate = new Date(bookingTime);
  const dayOfWeek = bookingDate.getDay();
  const timeOnly = bookingDate.toTimeString().split(' ')[0];

  const { data: availableDetailers, error: detailersError } = await supabase
    .from('detailer_availability')
    .select('detailer_id')
    .eq('day_of_week', dayOfWeek)
    .lte('start_time', timeOnly)
    .gte('end_time', timeOnly)
    .limit(1);

  if (detailersError || !availableDetailers || availableDetailers.length === 0) {
    return { success: false, message: 'No detailers available for this timeslot.' };
  }

  const detailerId = availableDetailers[0].detailer_id;

  // Create the booking
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: user.id,
      service_id: serviceId,
      detailer_id: detailerId,
      booking_time: bookingTime,
      location_address: locationAddress,
      status: 'pending',
      final_price: service.price,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    return { success: false, message: error.message };
  }

  // Revalidate paths
  revalidatePath('/book');
  revalidatePath('/dashboard/customer');

  // Redirect to dashboard
  redirect('/dashboard/customer');
}
