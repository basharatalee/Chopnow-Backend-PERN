import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { generateToken } from "../utils/jwt";

const router = Router();

router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const restaurant = await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword, phone, role: "RESTAURANT" },
  });

  res.json(restaurant);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const restaurant = await prisma.user.findUnique({ where: { email } });
  if (!restaurant) return res.status(404).json({ message: "Not found" });

  const valid = await bcrypt.compare(password, restaurant.password);
  if (!valid) return res.status(401).json({ message: "Invalid password" });

  const token = generateToken({ id: restaurant.id, role: restaurant.role });
  res.json({ token });
});

export default router;
