'use server';

import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Zod Schemas for validation
const ServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be a positive number'),
});

const DetailerSchema = z.object({
  name: z.string().min(1, 'Detailer name is required'),
  email: z.string().email('Invalid email address'),
});

const BookingStatusSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

// Helper to get Supabase client
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// --- Service Management Actions ---

export async function createService(formData: FormData) {
  const supabase = await getSupabase();
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: parseFloat(formData.get('price') as string),
  };

  try {
    const validatedData = ServiceSchema.parse(rawData);
    const { data, error } = await supabase.from('services').insert([validatedData]).select();

    if (error) {
      console.error('Error creating service:', error);
      return { success: false, message: error.message };
    }

    revalidatePath('/admin/services');
    return { success: true, message: 'Service created successfully', data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Validation failed', errors: error.flatten().fieldErrors };
    }
    console.error('Unexpected error creating service:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await getSupabase();
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: parseFloat(formData.get('price') as string),
  };

  try {
    const validatedData = ServiceSchema.partial().parse(rawData); // Allow partial updates
    const { data, error } = await supabase.from('services').update(validatedData).eq('id', id).select();

    if (error) {
      console.error('Error updating service:', error);
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, message: 'Service not found or no changes made.' };
    }

    revalidatePath('/admin/services');
    return { success: true, message: 'Service updated successfully', data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Validation failed', errors: error.flatten().fieldErrors };
    }
    console.error('Unexpected error updating service:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteService(id: string) {
  const supabase = await getSupabase();

  try {
    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      return { success: false, message: error.message };
    }

    revalidatePath('/admin/services');
    return { success: true, message: 'Service deleted successfully' };
  } catch (error) {
    console.error('Unexpected error deleting service:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

// --- Detailer Management Actions ---

export async function createDetailer(formData: FormData) {
  const supabase = await getSupabase();
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  try {
    const validatedData = DetailerSchema.parse(rawData);
    const { data, error } = await supabase.from('detailers').insert([validatedData]).select();

    if (error) {
      console.error('Error creating detailer:', error);
      // Handle unique constraint error for email if applicable
      if (error.code === '23505') { // PostgreSQL unique violation error code
        return { success: false, message: 'Detailer with this email already exists.' };
      }
      return { success: false, message: error.message };
    }

    revalidatePath('/admin/detailers');
    return { success: true, message: 'Detailer created successfully', data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Validation failed', errors: error.flatten().fieldErrors };
    }
    console.error('Unexpected error creating detailer:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateDetailer(id: string, formData: FormData) {
  const supabase = await getSupabase();
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  try {
    const validatedData = DetailerSchema.partial().parse(rawData);
    const { data, error } = await supabase.from('detailers').update(validatedData).eq('id', id).select();

    if (error) {
      console.error('Error updating detailer:', error);
      if (error.code === '23505') {
        return { success: false, message: 'Detailer with this email already exists.' };
      }
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, message: 'Detailer not found or no changes made.' };
    }

    revalidatePath('/admin/detailers');
    return { success: true, message: 'Detailer updated successfully', data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Validation failed', errors: error.flatten().fieldErrors };
    }
    console.error('Unexpected error updating detailer:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteDetailer(id: string) {
  const supabase = await getSupabase();

  try {
    const { error } = await supabase.from('detailers').delete().eq('id', id);

    if (error) {
      console.error('Error deleting detailer:', error);
      return { success: false, message: error.message };
    }

    revalidatePath('/admin/detailers');
    return { success: true, message: 'Detailer deleted successfully' };
  } catch (error) {
    console.error('Unexpected error deleting detailer:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

// --- Booking Management Actions ---

export async function updateBookingStatus(formData: FormData) {
  const supabase = await getSupabase();
  const rawData = {
    bookingId: formData.get('bookingId'),
    status: formData.get('status'),
  };

  try {
    const validatedData = BookingStatusSchema.parse(rawData);
    const { data, error } = await supabase.from('bookings').update({ status: validatedData.status }).eq('id', validatedData.bookingId).select();

    if (error) {
      console.error('Error updating booking status:', error);
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, message: 'Booking not found or no changes made.' };
    }

    revalidatePath('/admin/bookings');
    revalidatePath(`/admin/bookings/${validatedData.bookingId}`); // Revalidate specific booking page
    return { success: true, message: 'Booking status updated successfully', data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Validation failed', errors: error.flatten().fieldErrors };
    }
    console.error('Unexpected error updating booking status:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
