import { Router } from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";

const router = Router();

const ADMIN_EMAIL = "admin@chopnow.com";
const ADMIN_PASSWORD = "admin123"; // hardcoded

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({ email, role: "ADMIN" });
  res.json({ token });
});

export default router;
