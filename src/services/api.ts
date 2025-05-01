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
      properties!inner(name)
    `);
  
  if (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
  
  return (data || []).map(room => ({
    ...room,
    property: room.properties?.name,
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
  
  return data || [];
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

// Authentication functions for custom email/password login
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    // Fetch the user with the provided email
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      console.error('Login error - user not found:', error);
      return null;
    }
    
    // For development/demo purposes - allow login with demo credentials
    // In real production, we would use the verify_user_password function
    if (email === 'admin@example.com' && password === 'Admin123!' ||
        email === 'agent@example.com' && password === 'Agent123!') {
      // Update last login time
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);
      
      return data;
    }
    
    // For all other users, check password match
    // This is a simplified implementation for development
    if (data.password !== password) {
      console.error('Login error - invalid password');
      return null;
    }
    
    // Update last login time
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);
    
    return data;
  } catch (err) {
    console.error('Unexpected login error:', err);
    return null;
  }
};

export const loginOwner = async (email: string, password: string): Promise<Owner | null> => {
  try {
    // For the demo account specifically
    if (email === 'rehan@gmail.com' && password === 'Rehan8688@') {
      // Fetch or create a demo owner account
      const { data: existingOwner, error: fetchError } = await supabase
        .from('owners')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (existingOwner) {
        return existingOwner;
      }
      
      // If demo owner doesn't exist yet, create it
      const { data: newOwner, error: createError } = await supabase
        .from('owners')
        .insert({
          email: 'rehan@gmail.com',
          password: 'Rehan8688@',  // In production, this would be hashed
          first_name: 'Rehan',
          last_name: 'Demo',
          status: true
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Failed to create demo owner:', createError);
        return null;
      }
      
      return newOwner;
    }
    
    // For regular users, check credentials normally
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error || !data) {
      console.error('Owner login error - owner not found:', error);
      return null;
    }
    
    // Direct comparison (in production, this would use proper password verification)
    if (data.password !== password) {
      console.error('Owner login error - invalid password');
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Unexpected owner login error:', err);
    return null;
  }
};

// Fetch room owner assignments
export const fetchRoomOwnerAssignments = async (ownerId: string): Promise<RoomOwnerAssignment[]> => {
  const { data, error } = await supabase
    .from('room_owner_assignments')
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name))
    `)
    .eq('owner_id', ownerId)
    .eq('active', true);
  
  if (error) {
    console.error(`Error fetching room assignments for owner ID ${ownerId}:`, error);
    throw error;
  }
  
  return data || [];
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
