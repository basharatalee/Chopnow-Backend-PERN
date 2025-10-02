import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { generateToken } from "../utils/jwt";

const router = Router();

router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const rider = await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword, phone, role: "RIDER" },
  });

  res.json(rider);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const rider = await prisma.user.findUnique({ where: { email } });
  if (!rider) return res.status(404).json({ message: "Not found" });

  const valid = await bcrypt.compare(password, rider.password);
  if (!valid) return res.status(401).json({ message: "Invalid password" });

  const token = generateToken({ id: rider.id, role: rider.role });
  res.json({ token });
});

export default router;
