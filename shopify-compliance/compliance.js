import express from "express";
const router = express.Router();

router.get("/privacy", (req, res) => {
  res.send("DigiCloset stores merchant product data for outfit recommendations only.");
});

router.post("/data/delete", (req, res) => {
  res.status(200).send("Data deleted");
});

export default router;
