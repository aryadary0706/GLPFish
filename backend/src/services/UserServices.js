import { supabase } from "../lib/supabase.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const getUserData = async (userId) => {
  const { data, error } = await supabase
    .from('users') 
    .select('id, name, email, role, created_at')
    .eq('id', req.user.id)
    .single()

  if (error || !data) {
    throw { status: 404, message: "User tidak ditemukan" };
  }

  res.json({ user: data })
}

export const updateUserName = async (userId, name) => {
  const { data, error } = await supabase
    .from("users")
    .update({ name: name.trim() })
    .eq("id", userId)
    .select("id, name, email, role, created_at")
    .single();

  if (error) {
    throw { status: 500, message: "Gagal update profil" };
  }

  return { message: "Profil berhasil diupdate", user: data };
};

export const updatePassword = async (userId, currentPassword, newPassword) => {
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("password")
    .eq("id", userId)
    .single();

  if (fetchError || !userData) {
    throw { status: 404, message: "User tidak ditemukan" };
  }

  const isMatch = await bcrypt.compare(currentPassword, userData.password);
  if (!isMatch) {
    throw { status: 401, message: "Kata sandi lama tidak sesuai" };
  }

  const isSamePassword = await bcrypt.compare(newPassword, userData.password);
  if (isSamePassword) {
    throw { status: 400, message: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini" };
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  const { error: updateError } = await supabase
    .from("users")
    .update({ password: newHash })
    .eq("id", userId);

  if (updateError) {
    throw { status: 500, message: "Gagal update password" };
  }

  return { message: "Kata sandi berhasil diperbarui" };
};