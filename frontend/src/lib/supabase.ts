import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmjcsqwprlgqqzcubkeb.supabase.co';
const supabaseKey = '09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7';

export const supabase = createClient(supabaseUrl, supabaseKey);
