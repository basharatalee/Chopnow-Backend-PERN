import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import adminRoutes from "./routes/admin";
import userRoutes from "./routes/user";
import restaurantRoutes from "./routes/restaurant";
import riderRoutes from "./routes/rider";
import riderDashboardRoutes from "./routes/rider.dashboard";

console.log("🔥 server.ts is running...");


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


app.get("/test", (req, res) => {
  console.log("🔥 /test route was called");
  res.send("✅ Express works");
});


app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/rider", riderDashboardRoutes); // under the same /rider base path

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
