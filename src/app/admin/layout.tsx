import Link from 'next/link';
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/'); // Redirect non-admins to home page
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4 shrink-0">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link href="/admin" className="block py-2 px-3 rounded hover:bg-gray-700 transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/bookings" className="block py-2 px-3 rounded hover:bg-gray-700 transition-colors">
                Bookings
              </Link>
            </li>
            <li>
              <Link href="/admin/detailers" className="block py-2 px-3 rounded hover:bg-gray-700 transition-colors">
                Detailers
              </Link>
            </li>
            <li>
              <Link href="/admin/services" className="block py-2 px-3 rounded hover:bg-gray-700 transition-colors">
                Services
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
