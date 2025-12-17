import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  const token = jwt.sign({ id: "user123" }, "secret", { expiresIn: "15m" });
  const refresh = jwt.sign({ id: "user123" }, "refreshSecret", { expiresIn: "7d" });
  res.json({ token, refresh });
});

export default router;
