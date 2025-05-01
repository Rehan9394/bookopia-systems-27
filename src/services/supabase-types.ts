
export type Room = {
  id: string;
  number: string;
  property_id: string;
  room_type_id: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  floor: string;
  size: number | null;
  description: string | null;
  max_adults: number;
  max_children: number;
  base_rate: number;
  active: boolean;
  notes: string | null;
  amenities: any;
  image_urls: string[] | null;
  created_at: string;
  updated_at: string;
  property?: string;
  maintenance?: boolean;
  lastCleaned?: string;
  nextCheckIn?: string | null;
};

export type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  nationality: string | null;
  passport_number: string | null;
  id_document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  reference: string;
  room_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  base_rate: number;
  total_amount: number;
  security_deposit: number;
  commission: number;
  tourism_fee: number;
  vat: number;
  net_to_owner: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  amount_paid: number;
  pending_amount?: number;
  notes: string | null;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  rooms?: {
    number: string;
    property_id: string;
    property?: string;
  };
  guests?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  guest_name?: string; // Computed property for convenience
};

export type User = {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'agent';
  phone: string | null;
  avatar_url: string | null;
  status: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

export type Owner = {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  notes: string | null;
  birth_date: string | null;
  citizenship: string | null;
  avatar_url: string | null;
  joined_date: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'utilities' | 'maintenance' | 'supplies' | 'personnel' | 'marketing' | 'taxes' | 'insurance' | 'other';
  property_id: string | null;
  room_id: string | null;
  owner_id: string | null;
  vendor: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type CleaningTask = {
  id: string;
  room_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  assigned_to: string | null;
  notes: string | null;
  completed_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RoomOwnerAssignment = {
  id: string;
  room_id: string;
  owner_id: string;
  assigned_at: string;
  assigned_by: string | null;
  active: boolean;
  notes: string | null;
};

export type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  amenities: any | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RoomType = {
  id: string;
  name: string;
  property_id: string;
  description: string | null;
  base_rate: number;
  max_occupancy: number;
  features: any | null;
  image_urls: string[] | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: any | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SmsTemplate = {
  id: string;
  name: string;
  content: string;
  variables: any | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Settings = {
  id: number;
  company_name: string;
  company_email: string;
  date_format: string;
  currency_format: string;
  email_notifications: boolean;
  auto_checkout: boolean;
  default_check_in_time: string;
  default_check_out_time: string;
  default_tax_rate: number;
  reminder_days: number;
  booking_confirmation_template: string | null;
  check_in_reminder_template: string | null;
  check_out_reminder_template: string | null;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};
