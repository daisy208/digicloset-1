import express from "express";
const router = express.Router();

router.post("/uninstall", async (req, res) => {
  const shop = req.headers["x-shopify-shop-domain"];
  console.log(`App uninstalled from ${shop}`);
  res.status(200).send("OK");
});

export default router;
