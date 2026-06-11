import {
  registerUser,
  loginUser
} from "../services/AuthServices.js"

export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
    }

    const result = await registerUser({ email, password, name, role });
    
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi" });
    }

    const result = await loginUser({ email, password });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  return res.status(200).json({ message: "Logout berhasil" });
};
