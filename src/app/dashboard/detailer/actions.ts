
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server'; // Using correct import path for server-side Supabase client

// Define the schema for a single day's availability
const dayAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 for Sunday, 6 for Saturday
  timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Time slot must be in 'HH:MM-HH:MM' format")).optional(), // e.g., "09:00-10:00"
});

// Define the schema for the entire availability update payload
const updateAvailabilitySchema = z.object({
  // The availability will be an array of dayAvailabilitySchema objects
  availability: z.array(dayAvailabilitySchema),
});

/**
 * Server action to update a detailer's weekly availability.
 * This action expects a JSON object stringified in the formData for 'availability'.
 *
 * @param formData - FormData object containing the availability data.
 *                   Expected to have a 'availability' field with a JSON string.
 * @returns An object indicating success or failure, with a message or error details.
 */
export async function updateAvailability(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: User not logged in.' };
  }

  const rawAvailability = formData.get('availability');

  if (typeof rawAvailability !== 'string') {
    return { success: false, error: 'Invalid input: Availability data is missing or not a string.' };
  }

  let parsedAvailability;
  try {
    parsedAvailability = JSON.parse(rawAvailability);
  } catch (parseError) {
    console.error('Failed to parse availability JSON:', parseError);
    return { success: false, error: 'Invalid input: Availability data is not valid JSON.' };
  }

  // Validate the parsed availability data against the schema
  const validationResult = updateAvailabilitySchema.safeParse({ availability: parsedAvailability });

  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten() };
  }

  const { availability } = validationResult.data;

  // Update the 'availability' column (assumed to be jsonb) in the 'profiles' table
  // for the logged-in user (detailer).
  const { error } = await supabase
    .from('profiles')
    .update({ availability: availability }) // Store the validated array as JSONB
    .eq('id', user.id); // Assuming user.id corresponds to the profile id

  if (error) {
    console.error('Error updating availability for user', user.id, ':', error);
    return { success: false, error: `Database error: ${error.message}` };
  }

  // Revalidate paths that display detailer availability
  revalidatePath('/dashboard/detailer');
  // If there's a public booking page that shows availability, revalidate that too
  // e.g., revalidatePath('/book');

  return { success: true, message: 'Availability updated successfully!' };
}
