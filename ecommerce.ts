import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ecommerceService } from '../services/ecommerceIntegration';

const router = express.Router();

// Sync products from e-commerce platform
router.post('/sync/:platform', authenticateToken, requireRole(['admin', 'brand_admin']), [
  body('config').optional().isObject()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { platform } = req.params;
  const { config } = req.body;

  let products;
  
  switch (platform) {
    case 'shopify':
      products = await ecommerceService.syncShopifyProducts();
      break;
    case 'woocommerce':
      products = await ecommerceService.syncWooCommerceProducts();
      break;
    case 'magento':
      products = await ecommerceService.syncMagentoProducts();
      break;
    case 'custom':
      if (!config) {
        throw createError('Custom API configuration required', 400);
      }
      products = await ecommerceService.syncCustomAPI(config);
      break;
    default:
      throw createError('Unsupported platform', 400);
  }

  res.json({
    message: `Successfully synced ${products.length} products from ${platform}`,
    products: products.slice(0, 10), // Return first 10 for preview
    total: products.length
  });
}));

// Add product to cart
router.post('/cart/add', [
  body('platform').isIn(['shopify', 'woocommerce', 'magento']),
  body('productId').notEmpty(),
  body('variantId').optional(),
  body('quantity').isInt({ min: 1 })
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { platform, productId, variantId, quantity } = req.body;

  const result = await ecommerceService.addToCart(platform, productId, variantId, quantity);

  res.json({
    message: 'Product added to cart successfully',
    cart: result
  });
}));

// Update inventory
router.put('/inventory/:platform/:productId', authenticateToken, requireRole(['admin', 'brand_admin']), [
  body('variantId').optional(),
  body('quantity').isInt({ min: 0 })
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { platform, productId } = req.params;
  const { variantId, quantity } = req.body;

  const result = await ecommerceService.updateInventory(platform, productId, variantId, quantity);

  res.json({
    message: 'Inventory updated successfully',
    result
  });
}));

// Webhook handlers for real-time sync
router.post('/webhook/:platform', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { platform } = req.params;
  const payload = req.body;

  // Verify webhook signature (implementation depends on platform)
  // Handle different webhook events
  switch (platform) {
    case 'shopify':
      await handleShopifyWebhook(req.headers, payload);
      break;
    case 'woocommerce':
      await handleWooCommerceWebhook(req.headers, payload);
      break;
    case 'magento':
      await handleMagentoWebhook(req.headers, payload);
      break;
  }

  res.status(200).json({ received: true });
}));

// Helper functions for webhook handling
async function handleShopifyWebhook(headers: any, payload: any) {
  const topic = headers['x-shopify-topic'];
  
  switch (topic) {
    case 'products/create':
    case 'products/update':
      // Sync product changes
      console.log('Product updated:', payload.id);
      break;
    case 'orders/create':
      // Handle new order
      console.log('New order:', payload.id);
      break;
    case 'inventory_levels/update':
      // Update inventory
      console.log('Inventory updated:', payload);
      break;
  }
}

async function handleWooCommerceWebhook(headers: any, payload: any) {
  const event = headers['x-wc-webhook-event'];
  
  switch (event) {
    case 'product.created':
    case 'product.updated':
      console.log('Product updated:', payload.id);
      break;
    case 'order.created':
      console.log('New order:', payload.id);
      break;
  }
}

async function handleMagentoWebhook(headers: any, payload: any) {
  // Magento webhook handling
  console.log('Magento webhook received:', payload);
}

export default router;