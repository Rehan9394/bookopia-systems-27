
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
      guests!inner(first_name, last_name, email, phone)
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
      guests!inner(first_name, last_name, email, phone)
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
        await supabase
          .from('guests')
          .update(guestData)
          .eq('id', guestId);
      }
    }
    
    // If no existing guest was found, create a new one
    if (!guestId) {
      const { data: newGuest, error: guestError } = await supabase
        .from('guests')
        .insert(guestData)
        .select()
        .single();
      
      if (guestError) {
        console.error('Error creating guest:', guestError);
        throw guestError;
      }
      
      guestId = newGuest.id;
    }
  }
  
  // Generate a unique booking reference
  const reference = `BK-${Date.now().toString().slice(-6)}`;
  
  // Create the booking
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...bookingData,
      reference,
      guest_id: guestId,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name)),
      guests!inner(first_name, last_name, email, phone)
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
    await supabase
      .from('guests')
      .update(guestData)
      .eq('id', bookingData.guest_id);
  }
  
  // Update the booking
  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...bookingData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      rooms!inner(number, property_id, properties!inner(name)),
      guests!inner(first_name, last_name, email, phone)
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
      guests!inner(first_name, last_name, email, phone)
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
      guests!inner(first_name, last_name, email, phone)
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
  const { data, error } = await supabase
    .from('properties')
    .insert(propertyData)
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
  const { data, error } = await supabase
    .from('room_types')
    .insert(roomTypeData)
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
    
    // Verify the password using Supabase pgcrypto extension
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('verify_user_password', { 
        user_email: email, 
        user_password: password 
      });
    
    // If password verification fails or returns false, return null
    if (verifyError || !verifyData) {
      console.error('Login error - invalid password:', verifyError);
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
    // Fetch the owner with the provided email
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      console.error('Owner login error - owner not found:', error);
      return null;
    }
    
    // Verify the password using Supabase pgcrypto extension
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('verify_owner_password', { 
        owner_email: email, 
        owner_password: password 
      });
    
    // If password verification fails or returns false, return null
    if (verifyError || !verifyData) {
      console.error('Owner login error - invalid password:', verifyError);
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
