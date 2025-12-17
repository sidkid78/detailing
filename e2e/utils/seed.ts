import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Role Key must be provided!');
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('Seeding database...');

  // Clear existing data (optional, but good for consistent E2E tests)
  await clearDatabase();

  // Create test users with admin API
  const customerUser = await createTestUser('customer@example.com', 'password123', 'customer');
  const detailerUser = await createTestUser('detailer@example.com', 'password123', 'detailer');
  const adminUser = await createTestUser('admin@example.com', 'password123', 'admin');

  // Create detailer profile
  if (detailerUser) {
    await createDetailerProfile(detailerUser.id);
  }

  // Insert sample data
  await insertSampleServices();

  if (customerUser && detailerUser) {
    await insertSampleBookings(customerUser.id, detailerUser.id);
  }

  console.log('Database seeded successfully!');
}

async function clearDatabase() {
  console.log('Clearing database...');
  // Clear bookings first (foreign key constraints)
  await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('detailer_availability').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('detailers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete test users using admin API
  const testEmails = ['customer@example.com', 'detailer@example.com', 'admin@example.com'];
  for (const email of testEmails) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);
    if (user) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  console.log('Database cleared.');
}

async function createTestUser(email: string, password: string, role: 'customer' | 'detailer' | 'admin') {
  // Use admin API to create user with confirmed email
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
    }
  });

  if (error) {
    console.error(`Error creating user ${email}:`, error);
    throw error;
  }

  if (data.user) {
    // Update profile with role (profile should be auto-created by trigger)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', data.user.id);

    if (profileError) {
      console.error(`Error updating profile for ${email}:`, profileError);
      throw profileError;
    }

    console.log(`User ${email} created with role ${role}.`);
    return data.user;
  }

  throw new Error(`Failed to create user ${email}`);
}

async function createDetailerProfile(detailerId: string) {
  const { error } = await supabase
    .from('detailers')
    .insert({
      id: detailerId,
      business_name: 'Test Detailing Co.',
      service_area_description: 'Downtown and surrounding areas',
      is_active: true
    });

  if (error) {
    console.error('Error creating detailer profile:', error);
    throw error;
  }

  // Add availability
  const { error: availError } = await supabase
    .from('detailer_availability')
    .insert([
      { detailer_id: detailerId, day_of_week: 1, start_time: '09:00', end_time: '17:00' },
      { detailer_id: detailerId, day_of_week: 2, start_time: '09:00', end_time: '17:00' },
      { detailer_id: detailerId, day_of_week: 3, start_time: '09:00', end_time: '17:00' },
      { detailer_id: detailerId, day_of_week: 4, start_time: '09:00', end_time: '17:00' },
      { detailer_id: detailerId, day_of_week: 5, start_time: '09:00', end_time: '17:00' },
    ]);

  if (availError) {
    console.error('Error creating detailer availability:', availError);
  }

  console.log('Detailer profile and availability created.');
}

async function insertSampleServices() {
  console.log('Inserting sample services...');
  const { error } = await supabase.from('services').upsert([
    {
      name: 'Basic Wash',
      description: 'Exterior wash and dry',
      price: 25.00,
      estimated_duration_minutes: 30,
      is_active: true
    },
    {
      name: 'Premium Detail',
      description: 'Full interior and exterior detail',
      price: 150.00,
      estimated_duration_minutes: 180,
      is_active: true
    },
  ], { onConflict: 'name' });

  if (error) {
    console.error('Error inserting sample services:', error);
    throw error;
  }
  console.log('Sample services inserted.');
}

async function insertSampleBookings(customerId: string, detailerId: string) {
  console.log('Inserting sample bookings...');

  // Get a service ID first
  const { data: services } = await supabase.from('services').select('id').eq('name', 'Basic Wash').single();

  if (!services) {
    console.error('No services found to create booking');
    return;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const { error } = await supabase.from('bookings').insert([
    {
      customer_id: customerId,
      detailer_id: detailerId,
      service_id: services.id,
      booking_time: tomorrow.toISOString(),
      location_address: '123 Test Street, Test City, TS 12345',
      status: 'pending',
      final_price: 25.00
    },
  ]);

  if (error) {
    console.error('Error inserting sample bookings:', error);
    throw error;
  }
  console.log('Sample bookings inserted.');
}

seedDatabase().catch((err) => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});
