import { supabase } from "@/integrations/supabase/client";
import { 
  Room, 
  Booking, 
  User, 
  Owner, 
  Expense, 
  CleaningTask,
  Guest,
  Property,
  RoomType,
  RoomOwnerAssignment,
  EmailTemplate,
  SmsTemplate,
  Settings,
  AuditLog
} from './supabase-types';

// Helper function to enhance a booking with calculated fields and derived properties
function enhanceBooking(booking: any): Booking {
  const totalAmount = Number(booking.total_amount || 0);
  
  // Add guest_name convenience property by combining first and last name
  let guestName = "";
  if (booking.guests) {
    guestName = `${booking.guests.first_name || ''} ${booking.guests.last_name || ''}`.trim();
  }
  
  return {
    ...booking,
    guest_name: guestName,
    pending_amount: booking.pending_amount !== undefined ? 
      booking.pending_amount : 
      (totalAmount + (booking.security_deposit || 0) - (booking.amount_paid || 0))
  } as Booking;
}

export const fetchRooms = async (): Promise<Room[]> => {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      properties!inner(name),
      room_types(name)
    `);
  
  if (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
  
  return (data || []).map(room => ({
    ...room,
    property: room.properties?.name,
    type: room.room_types?.name,
    status: room.status as 'available' | 'occupied' | 'maintenance' | 'cleaning'
  })) as Room[];
};

export const fetchRoomById = async (id: string): Promise<Room> => {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      properties!inner(name)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching room with ID ${id}:`, error);
    throw error;
  }
  
  return {
    ...data,
    property: data.properties?.name,
    status: data.status as 'available' | 'occupied' | 'maintenance' | 'cleaning'
  } as Room;
};

export const fetchRoomByNumber = async (number: string): Promise<Room> => {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      properties!inner(name)
    `)
    .eq('number', number)
    .single();
  
  if (error) {
    console.error(`Error fetching room with number ${number}:`, error);
    throw error;
  }
  
  return {
    ...data,
    property: data.properties?.name,
    status: data.status as 'available' | 'occupied' | 'maintenance' | 'cleaning'
  } as Room;
};

export const createRoom = async (roomData: Partial<Room>): Promise<Room> => {
  // Ensure required fields are present
  if (!roomData.number || 
      !roomData.property_id || 
      !roomData.room_type_id) {
    throw new Error('Missing required fields for room');
  }

  const insertData = {
    number: roomData.number,
    property_id: roomData.property_id,
    room_type_id: roomData.room_type_id,
    status: roomData.status || 'available',
    floor: roomData.floor || null,
    size: roomData.size || null,
    description: roomData.description || null,
    max_adults: roomData.max_adults || 2,
    max_children: roomData.max_children || 0,
    base_rate: roomData.base_rate || 0,
    active: roomData.active === undefined ? true : roomData.active,
    amenities: roomData.amenities || null,
    image_urls: roomData.image_urls || null,
    notes: roomData.notes || null
  };

  const { data, error } = await supabase
    .from('rooms')
    .insert(insertData)
    .select(`
      *,
      properties!inner(name)
    `)
    .single();
  
  if (error) {
    console.error('Error creating room:', error);
    throw error;
  }
  
  return {
    ...data,
    property: data.properties?.name,
    status: data.status as 'available' | 'occupied' | 'maintenance' | 'cleaning'
  } as Room;
};

export const updateRoom = async (id: string, roomData: Partial<Room>): Promise<Room> => {
  // Prepare update data - only include fields that are present in the roomData
  const updateData: any = {
    ...roomData,
    updated_at: new Date().toISOString()
  };
  
  // Remove any relationships or calculated fields that shouldn't be sent to the database
  delete updateData.properties;
  delete updateData.property;
  
  const { data, error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      properties!inner(name)
    `)
    .single();
  
  if (error) {
    console.error(`Error updating room with ID ${id}:`, error);
    throw error;
  }
  
  return {
    ...data,
    property: data.properties?.name,
    status: data.status as 'available' | 'occupied' | 'maintenance' | 'cleaning'
  } as Room;
};

export const deleteRoom = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting room with ID ${id}:`, error);
    throw error;
  }
};

export const fetchBookings = async (): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name)),
      guests!inner(first_name, last_name, email, phone, id_document_url)
    `);
  
  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
  
  return (data || []).map(booking => {
    const enhancedBooking = enhanceBooking(booking);
    if (booking.rooms && booking.rooms.properties) {
      enhancedBooking.rooms = {
        ...booking.rooms,
        property: booking.rooms.properties.name
      };
    }
    return enhancedBooking;
  });
};

export const fetchBookingById = async (id: string): Promise<Booking> => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name)),
      guests!inner(first_name, last_name, email, phone, id_document_url)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching booking with ID ${id}:`, error);
    throw error;
  }
  
  const enhancedBooking = enhanceBooking(data);
  if (data.rooms && data.rooms.properties) {
    enhancedBooking.rooms = {
      ...data.rooms,
      property: data.rooms.properties.name
    };
  }
  return enhancedBooking;
};

export const createBooking = async (bookingData: Partial<Booking>, guestData: Partial<Guest>): Promise<Booking> => {
  // First, create or update the guest
  let guestId = bookingData.guest_id;
  
  if (!guestId) {
    // Check if guest already exists with the same email
    if (guestData.email) {
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('email', guestData.email)
        .maybeSingle();
      
      if (existingGuest) {
        guestId = existingGuest.id;
        // Update existing guest
        // Make sure required fields are included
        const updateData: any = {
          ...guestData
        };
        
        // Ensure first_name and last_name are present for the update
        if (guestData.first_name && guestData.last_name) {
          await supabase
            .from('guests')
            .update(updateData)
            .eq('id', guestId);
        }
      }
    }
    
    // If no existing guest was found, create a new one
    if (!guestId) {
      // Ensure required fields are present for the insert
      if (guestData.first_name && guestData.last_name) {
        const insertData = {
          first_name: guestData.first_name,
          last_name: guestData.last_name,
          email: guestData.email || null,
          phone: guestData.phone || null,
          address: guestData.address || null,
          city: guestData.city || null,
          state: guestData.state || null,
          zip_code: guestData.zip_code || null,
          country: guestData.country || null,
          nationality: guestData.nationality || null,
          passport_number: guestData.passport_number || null,
          id_document_url: guestData.id_document_url || null,
          notes: guestData.notes || null
        };
        
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert(insertData)
          .select()
          .single();
        
        if (guestError) {
          console.error('Error creating guest:', guestError);
          throw guestError;
        }
        
        guestId = newGuest.id;
      } else {
        throw new Error('First and last name are required for creating a new guest');
      }
    }
  }
  
  // Generate a unique booking reference
  const reference = bookingData.reference || `BK-${Date.now().toString().slice(-6)}`;
  
  // Prepare data for booking insert
  const insertBookingData: any = {
    reference: reference,
    room_id: bookingData.room_id,
    guest_id: guestId,
    check_in_date: bookingData.check_in_date,
    check_out_date: bookingData.check_out_date,
    adults: bookingData.adults || 1,
    children: bookingData.children || 0,
    base_rate: bookingData.base_rate,
    total_amount: bookingData.total_amount,
    security_deposit: bookingData.security_deposit || 0,
    commission: bookingData.commission,
    tourism_fee: bookingData.tourism_fee || 0,
    vat: bookingData.vat || 0,
    net_to_owner: bookingData.net_to_owner,
    status: bookingData.status || 'pending',
    payment_status: bookingData.payment_status || 'pending',
    amount_paid: bookingData.amount_paid || 0,
    notes: bookingData.notes || null,
    special_requests: bookingData.special_requests || null,
    created_by: bookingData.created_by || null,
    created_at: new Date().toISOString()
  };
  
  // Check for required fields
  const requiredFields = ['room_id', 'check_in_date', 'check_out_date', 'base_rate', 'total_amount', 'commission', 'net_to_owner'];
  const missingFields = requiredFields.filter(field => !insertBookingData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Create the booking
  const { data, error } = await supabase
    .from('bookings')
    .insert(insertBookingData)
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name)),
      guests!inner(first_name, last_name, email, phone, id_document_url)
    `)
    .single();
  
  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
  
  const enhancedBooking = enhanceBooking(data);
  if (data.rooms && data.rooms.properties) {
    enhancedBooking.rooms = {
      ...data.rooms,
      property: data.rooms.properties.name
    };
  }
  return enhancedBooking;
};

export const updateBooking = async (id: string, bookingData: Partial<Booking>, guestData?: Partial<Guest>): Promise<Booking> => {
  // If guest data is provided, update the guest
  if (guestData && bookingData.guest_id) {
    // Ensure first_name and last_name are present
    if (guestData.first_name && guestData.last_name) {
      await supabase
        .from('guests')
        .update({
          first_name: guestData.first_name,
          last_name: guestData.last_name,
          email: guestData.email || null,
          phone: guestData.phone || null,
          address: guestData.address || null,
          city: guestData.city || null,
          state: guestData.state || null,
          zip_code: guestData.zip_code || null,
          country: guestData.country || null,
          nationality: guestData.nationality || null,
          passport_number: guestData.passport_number || null,
          id_document_url: guestData.id_document_url || null,
          notes: guestData.notes || null
        })
        .eq('id', bookingData.guest_id);
    }
  }
  
  // Prepare update data
  const updateData: any = {
    ...bookingData,
    updated_at: new Date().toISOString()
  };
  
  // Remove any calculated or derived properties that shouldn't be sent to the database
  delete updateData.guest_name;
  delete updateData.guests;
  delete updateData.rooms;
  
  // Update the booking
  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name)),
      guests!inner(first_name, last_name, email, phone, id_document_url)
    `)
    .single();
  
  if (error) {
    console.error(`Error updating booking with ID ${id}:`, error);
    throw error;
  }
  
  const enhancedBooking = enhanceBooking(data);
  if (data.rooms && data.rooms.properties) {
    enhancedBooking.rooms = {
      ...data.rooms,
      property: data.rooms.properties.name
    };
  }
  return enhancedBooking;
};

export const deleteBooking = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting booking with ID ${id}:`, error);
    throw error;
  }
};

export const fetchTodayCheckins = async (): Promise<Booking[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name)),
      guests!inner(first_name, last_name, email, phone, id_document_url)
    `)
    .eq('check_in_date', today)
    .eq('status', 'confirmed');
  
  if (error) {
    console.error('Error fetching today\'s check-ins:', error);
    throw error;
  }
  
  return (data || []).map(booking => {
    const enhancedBooking = enhanceBooking(booking);
    if (booking.rooms && booking.rooms.properties) {
      enhancedBooking.rooms = {
        ...booking.rooms,
        property: booking.rooms.properties.name
      };
    }
    return enhancedBooking;
  });
};

export const fetchTodayCheckouts = async (): Promise<Booking[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name)),
      guests!inner(first_name, last_name, email, phone, id_document_url)
    `)
    .eq('check_out_date', today)
    .eq('status', 'checked_in');
  
  if (error) {
    console.error('Error fetching today\'s check-outs:', error);
    throw error;
  }
  
  return (data || []).map(booking => {
    const enhancedBooking = enhanceBooking(booking);
    if (booking.rooms && booking.rooms.properties) {
      enhancedBooking.rooms = {
        ...booking.rooms,
        property: booking.rooms.properties.name
      };
    }
    return enhancedBooking;
  });
};

export const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  // Add computed property 'name' by combining first and last name
  return (data || []).map(user => ({
    ...user,
    name: `${user.first_name} ${user.last_name}`,
  }));
};

export const fetchUserById = async (id: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    throw error;
  }
  
  return {
    ...data,
    name: `${data.first_name} ${data.last_name}`,
  };
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  // Ensure required fields are present
  if (!userData.email || 
      !userData.password || 
      !userData.first_name || 
      !userData.last_name ||
      !userData.role) {
    throw new Error('Missing required fields for user');
  }

  const insertData = {
    email: userData.email,
    password: userData.password,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role,
    phone: userData.phone || null,
    avatar_url: userData.avatar_url || null,
    status: userData.status === undefined ? true : userData.status,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('users')
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }
  
  return {
    ...data,
    name: `${data.first_name} ${data.last_name}`,
  };
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  const updateData: any = {
    ...userData,
    updated_at: new Date().toISOString()
  };
  
  // Remove password if empty (to avoid overwriting existing password)
  if (updateData.password === '') {
    delete updateData.password;
  }
  
  // Remove computed properties that shouldn't be sent to the database
  delete updateData.name;
  
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    throw error;
  }
  
  return {
    ...data,
    name: `${data.first_name} ${data.last_name}`,
  };
};

export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting user with ID ${id}:`, error);
    throw error;
  }
};

export const fetchOwners = async (): Promise<Owner[]> => {
  const { data, error } = await supabase
    .from('owners')
    .select('*');
  
  if (error) {
    console.error('Error fetching owners:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchOwnerById = async (id: string): Promise<Owner> => {
  const { data, error } = await supabase
    .from('owners')
    .select(`
      *,
      room_owner_assignments(
        *,
        rooms(
          number,
          properties(name)
        )
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching owner with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const createOwner = async (ownerData: Partial<Owner>): Promise<Owner> => {
  // Ensure required fields are present
  if (!ownerData.email || 
      !ownerData.password || 
      !ownerData.first_name || 
      !ownerData.last_name) {
    throw new Error('Missing required fields for owner');
  }

  const insertData = {
    email: ownerData.email,
    password: ownerData.password,
    first_name: ownerData.first_name,
    last_name: ownerData.last_name,
    phone: ownerData.phone || null,
    address: ownerData.address || null,
    city: ownerData.city || null,
    state: ownerData.state || null,
    zip_code: ownerData.zip_code || null,
    country: ownerData.country || null,
    notes: ownerData.notes || null,
    birth_date: ownerData.birth_date || null,
    citizenship: ownerData.citizenship || null,
    avatar_url: ownerData.avatar_url || null,
    joined_date: ownerData.joined_date || new Date().toISOString().split('T')[0],
    status: ownerData.status === undefined ? true : ownerData.status
  };

  const { data, error } = await supabase
    .from('owners')
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating owner:', error);
    throw error;
  }
  
  return data;
};

export const updateOwner = async (id: string, ownerData: Partial<Owner>): Promise<Owner> => {
  const updateData: any = {
    ...ownerData,
    updated_at: new Date().toISOString()
  };
  
  // Remove password if empty (to avoid overwriting existing password)
  if (updateData.password === '') {
    delete updateData.password;
  }
  
  // Remove relationships that shouldn't be sent to the database
  delete updateData.room_owner_assignments;
  
  const { data, error } = await supabase
    .from('owners')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating owner with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const deleteOwner = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('owners')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting owner with ID ${id}:`, error);
    throw error;
  }
};

// Mock owner login functionality
export const loginOwner = async (email: string, password: string): Promise<Owner | null> => {
  try {
    // Check against the database first
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!error && data) {
      // Owner found in database
      // Check if password matches
      if (data.password === password) {
        // Update last login timestamp
        await supabase
          .from('owners')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', data.id);
        
        return data;
      }
      return null; // Password doesn't match
    }
    
    // If owner not found in database, check if we should use demo credentials
    // This is a fallback for demo purposes only
    if (email === 'owner@example.com') {
      console.log("Using demo owner credentials");
      // Mock owner for demo
      return {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'owner@example.com',
        first_name: 'Demo',
        last_name: 'Owner',
        password: '',
        phone: null,
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        notes: '',
        status: true,
        joined_date: new Date().toISOString(),
        birth_date: null,
        avatar_url: null,
        citizenship: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else if (email === 'rehan@gmail.com' && password === 'Rehan8688@') {
      console.log("Using demo Rehan credentials");
      // Support the demo credentials shown in the OwnerLogin page
      return {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'rehan@gmail.com',
        first_name: 'Rehan',
        last_name: 'Demo',
        password: '',
        phone: null,
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        notes: '',
        status: true,
        joined_date: new Date().toISOString(),
        birth_date: null,
        avatar_url: null,
        citizenship: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    return null; // Owner not found
  } catch (err) {
    console.error('Owner login error:', err);
    return null;
  }
};

// Mock user login functionality
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    // Check against the database first
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!error && data) {
      // User found in database
      // Check if password matches
      if (data.password === password) {
        // Update last login timestamp
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id);
        
        return {
          ...data,
          name: `${data.first_name} ${data.last_name}`,
        };
      }
      return null; // Password doesn't match
    }
    
    // If user not found in database, check if we should use demo credentials
    // This is a fallback for demo purposes only
    if (email === 'admin@example.com') {
      console.log("Using demo admin credentials");
      // Mock admin user
      return {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@example.com',
        first_name: 'Demo',
        last_name: 'Admin',
        role: 'admin',
        phone: null,
        avatar_url: null,
        password: '',
        status: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else if (email === 'agent@example.com') {
      console.log("Using demo agent credentials");
      // Mock agent/staff user
      return {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'agent@example.com',
        first_name: 'Demo',
        last_name: 'Agent',
        role: 'agent',
        phone: null,
        avatar_url: null,
        password: '',
        status: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    return null; // User not found
  } catch (err) {
    console.error('Login error:', err);
    return null;
  }
};

// Fetch owner financial info
export const fetchOwnerFinancialInfo = async (ownerId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('owner_financial_info')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle(); // Use maybeSingle because the owner might not have financial info yet
  
  if (error) {
    console.error(`Error fetching financial info for owner ID ${ownerId}:`, error);
    throw error;
  }
  
  return data;
};

// Create or update owner financial info
export const saveOwnerFinancialInfo = async (ownerId: string, financialData: any): Promise<any> => {
  // Check if financial info already exists
  const { data: existingData } = await supabase
    .from('owner_financial_info')
    .select('id')
    .eq('owner_id', ownerId)
    .maybeSingle();
  
  if (existingData) {
    // Update existing financial info
    const { data, error } = await supabase
      .from('owner_financial_info')
      .update({
        ...financialData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingData.id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating financial info for owner ID ${ownerId}:`, error);
      throw error;
    }
    
    return data;
  } else {
    // Create new financial info
    const { data, error } = await supabase
      .from('owner_financial_info')
      .insert({
        owner_id: ownerId,
        ...financialData
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating financial info for owner ID ${ownerId}:`, error);
      throw error;
    }
    
    return data;
  }
};

export const fetchExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      properties!left(name),
      rooms!left(number),
      owners!left(first_name, last_name)
    `)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchExpenseById = async (id: string): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      properties!left(name),
      rooms!left(number),
      owners!left(first_name, last_name)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching expense with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const createExpense = async (expenseData: Partial<Expense>): Promise<Expense> => {
  // Ensure required fields are present
  if (!expenseData.description || 
      !expenseData.amount || 
      !expenseData.date || 
      !expenseData.category) {
    throw new Error('Missing required fields for expense');
  }

  const insertData = {
    description: expenseData.description,
    amount: expenseData.amount,
    date: expenseData.date,
    category: expenseData.category,
    property_id: expenseData.property_id || null,
    room_id: expenseData.room_id || null,
    owner_id: expenseData.owner_id || null,
    vendor: expenseData.vendor || null,
    payment_method: expenseData.payment_method || null,
    receipt_url: expenseData.receipt_url || null,
    notes: expenseData.notes || null,
    created_by: expenseData.created_by || null,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('expenses')
    .insert(insertData)
    .select(`
      *,
      properties!left(name),
      rooms!left(number),
      owners!left(first_name, last_name)
    `)
    .single();
  
  if (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
  
  return data;
};

export const updateExpense = async (id: string, expenseData: Partial<Expense>): Promise<Expense> => {
  // Prepare update data - only include fields that are present in the expenseData
  const updateData: any = {
    ...expenseData,
    updated_at: new Date().toISOString()
  };
  
  // Remove any relationships or calculated fields that shouldn't be sent to the database
  delete updateData.properties;
  delete updateData.rooms;
  delete updateData.owners;
  
  const { data, error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      properties!left(name),
      rooms!left(number),
      owners!left(first_name, last_name)
    `)
    .single();
  
  if (error) {
    console.error(`Error updating expense with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting expense with ID ${id}:`, error);
    throw error;
  }
};

export const fetchCleaningTasks = async (): Promise<CleaningTask[]> => {
  const { data, error } = await supabase
    .from('cleaning_tasks')
    .select(`
      *,
      rooms!inner(number, properties!inner(name)),
      users!left(first_name, last_name)
    `);
  
  if (error) {
    console.error('Error fetching cleaning tasks:', error);
    throw error;
  }
  
  return data || [];
};

export const updateBookingStatus = async (id: string, status: string): Promise<void> => {
  const validStatus = status as "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  
  const { error } = await supabase
    .from('bookings')
    .update({ status: validStatus })
    .eq('id', id);
  
  if (error) {
    console.error(`Error updating booking status for ID ${id}:`, error);
    throw error;
  }
};

export const updateRoomStatus = async (id: string, status: string): Promise<void> => {
  const validStatus = status as "available" | "occupied" | "cleaning" | "maintenance";
  
  const { error } = await supabase
    .from('rooms')
    .update({ status: validStatus })
    .eq('id', id);
  
  if (error) {
    console.error(`Error updating room status for ID ${id}:`, error);
    throw error;
  }
};

export const updateCleaningTaskStatus = async (id: string, status: string): Promise<void> => {
  const validStatus = status as "pending" | "in_progress" | "completed" | "verified";
  
  const { error } = await supabase
    .from('cleaning_tasks')
    .update({ status: validStatus })
    .eq('id', id);
  
  if (error) {
    console.error(`Error updating cleaning task status for ID ${id}:`, error);
    throw error;
  }
};

// Property API Functions
export const fetchProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*');
  
  if (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchPropertyById = async (id: string): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching property with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const createProperty = async (propertyData: Partial<Property>): Promise<Property> => {
  // Ensure required fields are present
  if (!propertyData.name || 
      !propertyData.address || 
      !propertyData.city || 
      !propertyData.state || 
      !propertyData.zip_code || 
      !propertyData.country) {
    throw new Error('Missing required fields for property');
  }

  const insertData = {
    name: propertyData.name,
    address: propertyData.address,
    city: propertyData.city,
    state: propertyData.state,
    zip_code: propertyData.zip_code,
    country: propertyData.country,
    phone: propertyData.phone || null,
    email: propertyData.email || null,
    timezone: propertyData.timezone || 'UTC',
    latitude: propertyData.latitude || null,
    longitude: propertyData.longitude || null,
    description: propertyData.description || null,
    amenities: propertyData.amenities || null,
    active: propertyData.active === undefined ? true : propertyData.active
  };

  const { data, error } = await supabase
    .from('properties')
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating property:', error);
    throw error;
  }
  
  return data;
};

export const updateProperty = async (id: string, propertyData: Partial<Property>): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .update(propertyData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating property with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const deleteProperty = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting property with ID ${id}:`, error);
    throw error;
  }
};

// Room Type API Functions
export const fetchRoomTypes = async (): Promise<RoomType[]> => {
  const { data, error } = await supabase
    .from('room_types')
    .select(`
      *,
      properties!inner(name)
    `);
  
  if (error) {
    console.error('Error fetching room types:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchRoomTypeById = async (id: string): Promise<RoomType> => {
  const { data, error } = await supabase
    .from('room_types')
    .select(`
      *,
      properties!inner(name)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching room type with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const createRoomType = async (roomTypeData: Partial<RoomType>): Promise<RoomType> => {
  // Ensure required fields are present
  if (!roomTypeData.name || 
      !roomTypeData.base_rate) {
    throw new Error('Missing required fields for room type');
  }

  const insertData = {
    name: roomTypeData.name,
    property_id: roomTypeData.property_id || null,
    description: roomTypeData.description || null,
    base_rate: roomTypeData.base_rate,
    max_occupancy: roomTypeData.max_occupancy || 2,
    features: roomTypeData.features || null,
    image_urls: roomTypeData.image_urls || null,
    active: roomTypeData.active === undefined ? true : roomTypeData.active
  };

  const { data, error } = await supabase
    .from('room_types')
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating room type:', error);
    throw error;
  }
  
  return data;
};

export const updateRoomType = async (id: string, roomTypeData: Partial<RoomType>): Promise<RoomType> => {
  const { data, error } = await supabase
    .from('room_types')
    .update(roomTypeData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating room type with ID ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const deleteRoomType = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('room_types')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting room type with ID ${id}:`, error);
    throw error;
  }
};

// Fetch room owner assignments
export const fetchRoomOwnerAssignments = async (ownerId?: string): Promise<RoomOwnerAssignment[]> => {
  let query = supabase
    .from('room_owner_assignments')
    .select(`
      *,
      rooms(
        id,
        number,
        property_id,
        properties(name)
      ),
      owners(id, first_name, last_name)
    `);
  
  // If an owner ID is provided, filter assignments for that owner
  if (ownerId) {
    query = query.eq('owner_id', ownerId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching room owner assignments:', error);
    throw error;
  }
  
  return data || [];
};

export const createRoomOwnerAssignment = async (assignmentData: {
  owner_id: string;
  room_id: string;
  commission_rate?: number;
  notes?: string;
}): Promise<RoomOwnerAssignment> => {
  // First check if this room is already assigned to another owner
  const { data: existingAssignments, error: checkError } = await supabase
    .from('room_owner_assignments')
    .select('id, owner_id')
    .eq('room_id', assignmentData.room_id);
  
  if (checkError) {
    console.error('Error checking existing room assignments:', checkError);
    throw checkError;
  }
  
  // If room is already assigned to another owner, throw an error
  if (existingAssignments && existingAssignments.length > 0 && 
      existingAssignments[0].owner_id !== assignmentData.owner_id) {
    throw new Error('This room is already assigned to another owner');
  }
  
  // Create the assignment
  const { data, error } = await supabase
    .from('room_owner_assignments')
    .insert({
      owner_id: assignmentData.owner_id,
      room_id: assignmentData.room_id,
      commission_rate: assignmentData.commission_rate || 10,
      notes: assignmentData.notes || null,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      rooms(
        id,
        number,
        property_id,
        properties(name)
      ),
      owners(id, first_name, last_name)
    `)
    .single();
  
  if (error) {
    console.error('Error creating room owner assignment:', error);
    throw error;
  }
  
  return data;
};

export const deleteRoomOwnerAssignment = async (ownerId: string, roomId: string): Promise<void> => {
  const { error } = await supabase
    .from('room_owner_assignments')
    .delete()
    .eq('owner_id', ownerId)
    .eq('room_id', roomId);
  
  if (error) {
    console.error(`Error deleting room owner assignment for owner ${ownerId} and room ${roomId}:`, error);
    throw error;
  }
};

// Function to check available rooms (not assigned to any owner)
export const fetchAvailableRoomsForOwner = async (): Promise<Room[]> => {
  // First, get all rooms
  const { data: allRooms, error: roomsError } = await supabase
    .from('rooms')
    .select(`
      *,
      properties!inner(name),
      room_types(name)
    `);
  
  if (roomsError) {
    console.error('Error fetching rooms:', roomsError);
    throw roomsError;
  }
  
  // Next, get all room assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('room_owner_assignments')
    .select('room_id');
  
  if (assignmentsError) {
    console.error('Error fetching room assignments:', assignmentsError);
    throw assignmentsError;
  }
  
  // Create a set of assigned room IDs for quick lookup
  const assignedRoomIds = new Set((assignments || []).map(a => a.room_id));
  
  // Filter out assigned rooms
  const availableRooms = (allRooms || [])
    .filter(room => !assignedRoomIds.has(room.id))
    .map(room => ({
      ...room,
      property: room.properties?.name,
      type: room.room_types?.name,
      status: room.status as 'available' | 'occupied' | 'maintenance' | 'cleaning'
    })) as Room[];
  
  return availableRooms;
};

// Fetch audit logs
export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      users!left(email, first_name, last_name)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
  
  return data || [];
};

// Fetch email templates
export const fetchEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
  
  return data || [];
};

// Fetch SMS templates
export const fetchSmsTemplates = async (): Promise<SmsTemplate[]> => {
  const { data, error } = await supabase
    .from('sms_templates')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching SMS templates:', error);
    throw error;
  }
  
  return data || [];
};

// Fetch settings
export const fetchSettings = async (): Promise<Settings> => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();
  
  if (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
  
  return data;
};

// Update settings
export const updateSettings = async (settingsData: Partial<Settings>): Promise<Settings> => {
  const { data, error } = await supabase
    .from('settings')
    .update(settingsData)
    .eq('id', 1) // We only have one settings record
    .select()
    .single();
  
  if (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
  
  return data;
};

// Fetch room availability data
export const fetchRoomAvailability = async (startDate?: string, endDate?: string): Promise<any[]> => {
  // Default to the current month if no dates provided
  const today = new Date();
  const defaultStart = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  // First fetch all rooms
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select(`
      id,
      number,
      properties!inner(id, name)
    `);
  
  if (roomsError) {
    console.error('Error fetching rooms for availability:', roomsError);
    throw roomsError;
  }
  
  // Then fetch bookings for the specified date range
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      room_id,
      check_in_date,
      check_out_date,
      status,
      guests!inner(first_name, last_name)
    `)
    .gte('check_in_date', defaultStart)
    .lte('check_out_date', defaultEnd)
    .in('status', ['pending', 'confirmed', 'checked_in']);
  
  if (bookingsError) {
    console.error('Error fetching bookings for availability:', bookingsError);
    throw bookingsError;
  }
  
  // Combine room and booking data to create availability data
  return rooms.map((room) => {
    const roomBookings = bookings.filter(booking => booking.room_id === room.id);
    
    return {
      id: room.id,
      roomNumber: room.number,
      property: room.properties?.name || '',
      propertyId: room.properties?.id || '',
      bookings: roomBookings.map(booking => ({
        id: booking.id,
        checkIn: booking.check_in_date,
        checkOut: booking.check_out_date,
        status: booking.status,
        guestName: booking.guests ? `${booking.guests.first_name} ${booking.guests.last_name}` : 'Unknown Guest'
      }))
    };
  });
};

// Fetch cleaning status data
export const fetchCleaningStatus = async (date?: string): Promise<any[]> => {
  // Format the current date if none provided
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // Fetch rooms with their current status
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select(`
      id,
      number,
      status,
      properties!inner(name),
      last_cleaned
    `);
  
  if (roomsError) {
    console.error('Error fetching room cleaning status:', roomsError);
    throw roomsError;
  }
  
  // Fetch bookings for the given date to check for check-ins and check-outs
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, room_id, check_in_date, check_out_date, status')
    .or(`check_in_date.eq.${targetDate},check_out_date.eq.${targetDate}`);
  
  if (bookingsError) {
    console.error('Error fetching bookings for cleaning status:', bookingsError);
    throw bookingsError;
  }
  
  // Map room status to cleaning status
  const cleaningStatusMap: Record<string, string> = {
    'available': 'clean',
    'occupied': 'dirty',
    'maintenance': 'dirty',
    'cleaning': 'cleaning'
  };
  
  // Enhance room data with cleaning status information
  return (rooms || []).map(room => {
    // Check if room has check-in or check-out today
    const hasCheckin = bookings?.some(
      b => b.room_id === room.id && 
      b.check_in_date === targetDate && 
      ['confirmed', 'pending'].includes(b.status)
    ) || false;
    
    const hasCheckout = bookings?.some(
      b => b.room_id === room.id && 
      b.check_out_date === targetDate && 
      ['confirmed', 'checked_in'].includes(b.status)
    ) || false;
    
    // Convert room status to cleaning status
    const cleaningStatus = cleaningStatusMap[room.status] || 'dirty';
    
    return {
      id: room.id,
      roomId: room.id,
      roomNumber: room.number,
      property: room.properties?.name || 'Unknown',
      status: room.status,
      cleaningStatus: cleaningStatus,
      lastCleaned: room.last_cleaned,
      hasCheckin,
      hasCheckout,
      notes: null // Can be populated from database if you have a notes field
    };
  });
};

export const updateRoomCleaningStatus = async (
  roomId: string, 
  status: string, 
  notes?: string
): Promise<void> => {
  // Map cleaning status to room status
  const roomStatus = {
    'dirty': 'occupied',
    'cleaning': 'cleaning',
    'clean': 'available',
    'inspected': 'available'
  }[status] || 'available';
  
  // Update room status
  const { error } = await supabase
    .from('rooms')
    .update({ 
      status: roomStatus,
      last_cleaned: status === 'clean' || status === 'inspected' ? new Date().toISOString() : undefined,
      notes: notes !== undefined ? notes : undefined
    })
    .eq('id', roomId);
  
  if (error) {
    console.error(`Error updating room cleaning status for ID ${roomId}:`, error);
    throw error;
  }
};

// Update room cleaning status
export const updateRoomCleaningStatusLegacy = async (roomId: string, status: 'Clean' | 'Dirty' | 'In Progress'): Promise<void> => {
  // Map cleaning status to room status
  let roomStatus;
  if (status === 'Clean') {
    roomStatus = 'available';
  } else if (status === 'In Progress') {
    roomStatus = 'cleaning';
  } else {
    roomStatus = 'maintenance'; // Use maintenance to represent 'Dirty'
  }
  
  // Update the room status
  const { error } = await supabase
    .from('rooms')
    .update({ status: roomStatus, updated_at: new Date().toISOString() })
    .eq('id', roomId);
  
  if (error) {
    console.error(`Error updating room cleaning status for ID ${roomId}:`, error);
    throw error;
  }
  
  // If marked as clean, create a completed cleaning task
  if (status === 'Clean') {
    const completedAt = new Date().toISOString();
    await supabase
      .from('cleaning_tasks')
      .insert({
        room_id: roomId,
        status: 'completed',
        notes: 'Automatically marked as clean',
        completed_at: completedAt,
        created_at: completedAt
      });
  } else if (status === 'In Progress') {
    // If marked as in progress, create a pending cleaning task
    await supabase
      .from('cleaning_tasks')
      .insert({
        room_id: roomId,
        status: 'in_progress',
        notes: 'Automatically marked as in progress',
        created_at: new Date().toISOString()
      });
  }
}
