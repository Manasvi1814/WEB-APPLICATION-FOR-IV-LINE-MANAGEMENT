import { createClient } from '@supabase/supabase-js';
import type { User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// FIXED: Use the passed userId parameter (no internal getUser)
export const getCurrentStaff = async (userId: string) => {
  if (!userId) return null;

  const { data: staff, error } = await supabase
    .from('staff')
    .select(`
      id,
      staff_id,
      name,
      role,
      department_id,
      status
      
    `)
    .eq('auth_user_id', userId)
    .single();


  if (error) {
    console.error('Error fetching staff:', error);
    return null;
  }

  return staff as User;
};