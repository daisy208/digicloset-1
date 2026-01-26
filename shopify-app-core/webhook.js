// webhook.js
// Handles Shopify app webhooks (e.g., app/uninstalled)
import express from 'express';
const router = express.Router();

// App uninstall webhook
router.post('/app_uninstalled', async (req, res) => {
  // TODO: Call backend to clean up store data
  res.status(200).send('Uninstall webhook received');
});

export default router;
