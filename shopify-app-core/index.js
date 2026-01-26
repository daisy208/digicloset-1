import express from "express";
import dotenv from "dotenv";
import { shopify } from "./shopify.config.js";

dotenv.config();
const app = express();

app.get("/auth", async (req, res) => {
  const authRoute = await shopify.auth.begin({
    shop: req.query.shop,
    callbackPath: "/auth/callback",
    isOnline: false,
    rawRequest: req,
    rawResponse: res
  });
  res.redirect(authRoute);
});

app.get("/auth/callback", async (req, res) => {
  await shopify.auth.callback({
    rawRequest: req,
    rawResponse: res
  });
  res.send("App installed successfully.");
});

app.listen(3000, () => console.log("Shopify app running on port 3000"));
