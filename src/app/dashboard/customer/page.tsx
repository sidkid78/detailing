import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, ClockIcon, MapPinIcon, CreditCardIcon } from "@heroicons/react/24/outline";

export default async function CustomerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch bookings for the current user with service details joined
  const { data: bookings, error } = await supabase
    .from("bookings")
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
    .eq("customer_id", user.id)
    .order("booking_time", { ascending: false });

  if (error) {
    console.error("Error fetching bookings:", error.message);
    return (
      <>
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-24">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
              <CardDescription>
                Failed to load your bookings. Please try again later.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  const now = new Date();
  const upcomingBookings =
    bookings?.filter((booking) => new Date(booking.booking_time) >= now) || [];
  const pastBookings =
    bookings?.filter((booking) => new Date(booking.booking_time) < now) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending" },
      confirmed: { className: "bg-green-100 text-green-800 border-green-200", label: "Confirmed" },
      completed: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Completed" },
      cancelled: { className: "bg-red-100 text-red-800 border-red-200", label: "Cancelled" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 pt-24 pb-4 px-4 sm:pb-6 sm:px-6 lg:pb-8 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-5xl font-extrabold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              My Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Welcome back, {user.email?.split('@')[0]}!
            </p>
          </div>

          {/* Upcoming Bookings */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Upcoming Bookings
              </h2>
            </div>

            {upcomingBookings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg text-muted-foreground mb-4">
                    No upcoming bookings found.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ready to book your next detail?
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upcomingBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-200"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-2xl">
                          {booking.services?.name || 'Unknown Service'}
                        </CardTitle>
                        {getStatusBadge(booking.status)}
                      </div>
                      <CardDescription>
                        {booking.services?.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Separator />
                      <div className="flex items-center gap-3 text-gray-700">
                        <CalendarIcon className="w-5 h-5 text-indigo-600" />
                        <span>
                          {new Date(booking.booking_time).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <ClockIcon className="w-5 h-5 text-indigo-600" />
                        <span>
                          {new Date(booking.booking_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPinIcon className="w-5 h-5 text-indigo-600" />
                        <span>{booking.location_address}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCardIcon className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm text-muted-foreground">Total Price</span>
                        </div>
                        <span className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          ${booking.final_price}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Past Bookings */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gray-400 flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Past Bookings
              </h2>
            </div>

            {pastBookings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <p className="text-lg text-muted-foreground">
                    No past bookings found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pastBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="hover:shadow-lg transition-shadow duration-300 opacity-90"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl text-gray-700">
                          {booking.services?.name || 'Unknown Service'}
                        </CardTitle>
                        {getStatusBadge(booking.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(booking.booking_time).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span className="text-sm">{booking.location_address}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="font-semibold text-gray-700">
                          ${booking.final_price}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
