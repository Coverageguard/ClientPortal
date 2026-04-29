// Client Portal - Supabase Service
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rumcdinmuiqhcakhuscs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWNkaW5tdWlxaGNha2h1c2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODA0MDgsImV4cCI6MjA5MjQ1NjQwOH0.FhFwMISNZdc9b99RdhsGE8rcPB25KSa_1xKfYY8yE04';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const authService = {
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};

// Client Profile functions
export const clientService = {
  createProfile: async (userId, profileData) => {
    const { data, error } = await supabase
      .from('client_profiles')
      .insert([{ user_id: userId, ...profileData }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// COI Upload functions
export const coiService = {
  uploadCOI: async (clientId, file, fileName) => {
    const filePath = `coi_uploads/${clientId}/${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('coi_files')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('coi_files').getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('coi_uploads')
      .insert([{ client_id: clientId, file_name: fileName, file_url: publicUrl, status: 'pending' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getCOIs: async (clientId) => {
    const { data, error } = await supabase
      .from('coi_uploads')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

// Message functions
export const messageService = {
  sendMessage: async (clientId, content) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ client_id: clientId, sender_type: 'client', content }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getMessages: async (clientId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }
};