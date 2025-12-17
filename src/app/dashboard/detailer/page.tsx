
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AvailabilityManager from '@/components/detailer/AvailabilityManager';
import BookingsList from '@/components/detailer/BookingsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, CheckCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default async function DetailerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Fetch detailer profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching detailer profile:', profileError);
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-screen pt-24">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
              <CardDescription>Error loading profile information.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  // Fetch detailer availability
  const { data: availability, error: availabilityError } = await supabase
    .from('detailer_availability')
    .select('*')
    .eq('detailer_id', user.id)
    .order('day_of_week', { ascending: true });

  if (availabilityError) {
    console.error('Error fetching availability:', availabilityError);
  }

  // Fetch detailer bookings with customer and service details
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      services (
        name,
        description,
        price
      ),
      profiles!bookings_customer_id_fkey (
        full_name
      )
    `)
    .eq('detailer_id', user.id)
    .order('booking_time', { ascending: false });

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
  }

  const upcomingBookings = bookings?.filter(
    (booking) => new Date(booking.booking_time) >= new Date()
  ) || [];
  const pastBookings = bookings?.filter(
    (booking) => new Date(booking.booking_time) < new Date()
  ) || [];

  // Calculate stats
  const totalEarnings = bookings?.reduce((sum, b) => sum + (b.final_price || 0), 0) || 0;
  const completedJobs = bookings?.filter(b => b.status === 'completed').length || 0;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 pt-24 pb-4 px-4 sm:pb-6 sm:px-6 lg:pb-8 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl font-extrabold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Detailer Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Welcome back, {profile.first_name || user.email?.split('@')[0]}!
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <CurrencyDollarIcon className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ${totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From all bookings
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {completedJobs}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully completed
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Jobs</CardTitle>
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {upcomingBookings.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled appointments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Availability Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Manage Availability
              </h2>
            </div>
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <AvailabilityManager initialAvailability={availability || []} />
              </CardContent>
            </Card>
          </section>

          {/* Upcoming Jobs Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Upcoming Jobs
              </h2>
            </div>
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <BookingsList bookings={upcomingBookings} />
              </CardContent>
            </Card>
          </section>

          {/* Past Jobs Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gray-400 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Past Jobs
              </h2>
            </div>
            <Card className="shadow-lg opacity-90">
              <CardContent className="pt-6">
                <BookingsList bookings={pastBookings} />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
