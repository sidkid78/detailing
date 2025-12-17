'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CalendarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  isPopular?: boolean;
}

interface Booking {
  service_id: string;
  user_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const DUMMY_SERVICES: Service[] = [
  { id: '1', name: 'Basic Wash', description: 'Exterior wash and dry.', price: 25.00, duration_minutes: 30 },
  { id: '2', name: 'Deluxe Detail', description: 'Exterior wash, interior vacuum, window cleaning.', price: 75.00, duration_minutes: 90 },
  { id: '3', name: 'Premium Full Detail', description: 'Complete interior and exterior detailing.', price: 150.00, duration_minutes: 180, isPopular: true },
];

const BookingPage = () => {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateTimeSelect = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and a time.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Booking details are incomplete. Please go back and select all options.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in to book a service.');
        router.push('/login');
        return;
      }

      console.log('Simulating booking:', {
        service_id: selectedService.id,
        user_id: user.id,
        booking_date: selectedDate,
        booking_time: selectedTime,
        status: 'pending',
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Booking confirmed successfully!');
      setStep(4);

    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to confirm booking. Please try again.');
      toast.error(err.message || 'Failed to confirm booking.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, label: 'Select Service' },
      { number: 2, label: 'Date & Time' },
      { number: 3, label: 'Confirm' },
      { number: 4, label: 'Done' },
    ];

    return (
      <div className="flex items-center justify-center mb-12">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step >= s.number
                  ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                  : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {step > s.number ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  s.number
                )}
              </div>
              <span className={`mt-2 text-sm font-medium ${step >= s.number ? 'text-indigo-600' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-1 mx-2 transition-all duration-300 ${step > s.number ? 'bg-linear-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Choose Your Service
              </h2>
              <p className="text-muted-foreground">Select the perfect detailing package for your vehicle</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DUMMY_SERVICES.map((service) => (
                <Card
                  key={service.id}
                  className="relative cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 group"
                  onClick={() => handleServiceSelect(service)}
                >
                  {service.isPopular && (
                    <div className="absolute -top-3 right-6">
                      <Badge className="bg-linear-to-r from-yellow-400 via-orange-400 to-orange-500 text-white px-4 py-1.5 shadow-lg">
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl group-hover:text-indigo-600 transition-colors">
                      {service.name}
                    </CardTitle>
                    <CardDescription className="text-base">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      <ClockIcon className="w-5 h-5" />
                      <span className="text-sm">{service.duration_minutes} minutes</span>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-4xl font-black bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      ${service.price.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">per service</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:shadow-xl transition-all">
                      Select Service
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Pick Your Date & Time
              </h2>
              {selectedService && (
                <p className="text-muted-foreground">
                  Service: <span className="font-semibold text-indigo-600">{selectedService.name}</span>
                </p>
              )}
            </div>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="booking-date" className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-indigo-600" />
                      Select Date
                    </Label>
                    <Input
                      type="date"
                      id="booking-date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking-time" className="flex items-center gap-2">
                      <ClockIcon className="h-5 w-5 text-indigo-600" />
                      Select Time
                    </Label>
                    <Input
                      type="time"
                      id="booking-time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </div>
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleDateTimeSelect}
                  className="bg-linear-to-r from-indigo-600 to-purple-600 hover:shadow-xl"
                >
                  Next
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      case 3:
        return (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Confirm Your Booking
              </h2>
              <p className="text-muted-foreground">Review your details before confirming</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedService && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-semibold text-lg">{selectedService.name}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ${selectedService.price.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-semibold">{selectedService.duration_minutes} minutes</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-semibold">{selectedDate}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-semibold">{selectedTime}</span>
                    </div>
                  </>
                )}
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive mt-4">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={loading}
                  className="bg-linear-to-r from-green-600 to-emerald-600 hover:shadow-xl"
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      case 4:
        return (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-r from-green-600 to-emerald-600 flex items-center justify-center shadow-2xl">
                <CheckCircleIcon className="w-16 h-16 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                Booking Successful!
              </h2>
              <p className="text-lg text-muted-foreground">
                Thank you for your booking. A confirmation email with details has been sent.
              </p>
            </div>
            {selectedService && selectedDate && selectedTime && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-semibold">{selectedService.name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-semibold">{selectedDate}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-semibold">{selectedTime}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            <Button
              onClick={() => router.push('/')}
              size="lg"
              className="bg-linear-to-r from-indigo-600 to-purple-600 hover:shadow-2xl text-lg px-8"
            >
              Go to Home
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Book Your Mobile Detail
          </h1>
          <p className="text-xl text-muted-foreground">Professional car care delivered to your doorstep</p>
        </div>

        {renderStepIndicator()}

        <div className="min-h-[500px]">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
