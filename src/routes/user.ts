import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { generateToken } from "../utils/jwt";

console.log("✅ user.ts loaded");


const router = Router();
router.get("/ping", (req, res) => {
  res.send("User router working ✅");
});


// Signup
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword, phone, role: "USER" },
  });

  res.json(user);
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid password" });

  const token = generateToken({ id: user.id, role: user.role });
  res.json({ token });
});

export default router;
