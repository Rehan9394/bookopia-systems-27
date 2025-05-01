
-- Create stored procedures for password verification
CREATE OR REPLACE FUNCTION public.verify_user_password(user_email TEXT, user_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_password TEXT;
  result BOOLEAN;
BEGIN
  SELECT password INTO stored_password 
  FROM public.users 
  WHERE email = user_email;
  
  IF stored_password IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT (stored_password = crypt(user_password, stored_password)) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.verify_owner_password(owner_email TEXT, owner_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_password TEXT;
  result BOOLEAN;
BEGIN
  SELECT password INTO stored_password 
  FROM public.owners 
  WHERE email = owner_email;
  
  IF stored_password IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT (stored_password = crypt(owner_password, stored_password)) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper functions for user and owner authentication
CREATE OR REPLACE FUNCTION public.create_new_user(
  p_email TEXT, 
  p_password TEXT, 
  p_first_name TEXT, 
  p_last_name TEXT, 
  p_role TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.users (
    email, 
    password, 
    first_name, 
    last_name, 
    role,
    phone
  ) VALUES (
    p_email, 
    crypt(p_password, gen_salt('bf')), 
    p_first_name, 
    p_last_name, 
    p_role::user_role,
    p_phone
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_new_owner(
  p_email TEXT, 
  p_password TEXT, 
  p_first_name TEXT, 
  p_last_name TEXT, 
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.owners (
    email, 
    password, 
    first_name, 
    last_name, 
    phone,
    address,
    city,
    state,
    country
  ) VALUES (
    p_email, 
    crypt(p_password, gen_salt('bf')), 
    p_first_name, 
    p_last_name, 
    p_phone,
    p_address,
    p_city,
    p_state,
    p_country
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
