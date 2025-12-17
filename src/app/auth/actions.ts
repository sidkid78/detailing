
'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['customer', 'detailer']),
});

type FormState = {
  error: {
    email?: string[];
    password?: string[];
  };
} | {
  error: string;
} | null;

export async function signIn(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const formValues = Object.fromEntries(formData.entries());

  const parsed = signInSchema.safeParse(formValues);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch user role to redirect to appropriate dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  // Fallback to user_metadata if profile role is not set or defaults to customer
  const roleFromMetadata = data.user.user_metadata?.role as string | undefined;
  const userRole = profile?.role && profile.role !== 'customer'
    ? profile.role
    : (roleFromMetadata || 'customer');

  const dashboardPath = userRole === 'detailer' ? '/dashboard/detailer' : '/dashboard/customer';

  revalidatePath('/', 'layout');
  redirect(dashboardPath);
}

type SignUpFormState = {
  error: {
    email?: string[];
    password?: string[];
    role?: string[];
  };
} | {
  error: string;
} | null;

export async function signUp(prevState: SignUpFormState, formData: FormData): Promise<SignUpFormState> {
  const supabase = await createClient();
  const data = Object.fromEntries(formData.entries());

  const parsed = signUpSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { email, password, role } = parsed.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/login?message=Check email to verify account');
}
