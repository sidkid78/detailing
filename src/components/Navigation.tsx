'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Navigation() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function getUserRole() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                setUserRole(profile?.role || 'customer');
            }
        }
        getUserRole();
    }, []);

    const handleSignOut = async () => {
        try {
            const response = await fetch('/auth/signout', {
                method: 'POST',
            });

            if (response.ok) {
                router.push('/login');
                router.refresh();
            }
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const dashboardPath = userRole === 'detailer' ? '/dashboard/detailer' : '/dashboard/customer';

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Mobile Detailing
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost">Home</Button>
                        </Link>
                        <Link href="/book">
                            <Button variant="ghost">Book Now</Button>
                        </Link>
                        <Link href={dashboardPath}>
                            <Button variant="ghost">Dashboard</Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleSignOut}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
