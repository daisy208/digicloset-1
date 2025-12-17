import express from "express";
import cors from "cors";
import auth from "./routes/auth.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", auth);

app.get("/status", (req, res) => res.json({ ok: true }));
app.listen(4000, () => console.log("API running on :4000"));
