// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadFile = async (file: File, folder: string = 'breakdowns') => {
  if (supabaseUrl.includes("placeholder-url")) {
    console.warn("Supabase credentials not configured. Returning local mock URL.");
    return `/mock-uploads/${folder}/${file.name}`;
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from('transitops-files')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('transitops-files')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadMultipleFiles = async (files: File[], folder: string = 'breakdowns') => {
  const uploadPromises = files.map(file => uploadFile(file, folder));
  return Promise.all(uploadPromises);
};
