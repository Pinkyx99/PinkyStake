import { createClient } from '@supabase/supabase-js';
import { type Database } from './database.types';

const supabaseUrl = 'https://yevrbewfqofbugybrbdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlldnJiZXdmcW9mYnVneWJyYmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwODY1MDUsImV4cCI6MjA3MDY2MjUwNX0.ZvrjWuuGsgm9Q6ngYjhnUp4O9ayVmDqIxZHd_owK2gE';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);