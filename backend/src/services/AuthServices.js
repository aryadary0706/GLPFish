import { supabase } from "../lib/supabase.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 12;
const TOKEN_TTL = "3d";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
};

export const registerUser = async ({ email, password, name, role = "staff" }) => {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    throw { status: 409, message: "Email sudah terdaftar" };
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error } = await supabase
    .from("users")
    .insert({ email, password: hashed, name, role })
    .select("id, email, name, role, created_at")
    .single();

  if (error) throw { status: 500, message: error.message };

  const token = generateToken(user);

  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, name, password, role, created_at")
    .eq("email", email)
    .maybeSingle();

  if (error || !user) {
    throw { status: 401, message: "Email atau password salah" };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw { status: 401, message: "Email atau password salah" };
  }

  const token = generateToken(user);

  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
};