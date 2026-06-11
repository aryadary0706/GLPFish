import {
  getUserData,
  updateUserName,
  updatePassword
} from "../services/UserServices.js";

export const getUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getUserData(userId);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || "Internal Server Error" });
  }
}

export const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Nama tidak boleh kosong" });
    }

    const result = await updateUserName(userId, name);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || "Internal Server Error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Semua field password wajib diisi" });
    }

    if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({ error: "Password baru minimal 6 karakter" });
    }

    const result = await updatePassword(userId, currentPassword, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || "Internal Server Error" });
  }
};