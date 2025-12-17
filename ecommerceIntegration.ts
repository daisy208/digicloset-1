import { ClothingItem } from '../types';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  vendor: string;
  product_type: string;
  tags: string;
}

interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  option1: string; // Size
  option2?: string; // Color
}

interface ShopifyImage {
  id: string;
  src: string;
  alt: string;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: WooCommerceImage[];
  attributes: WooCommerceAttribute[];
  variations: number[];
  stock_quantity: number;
}

interface WooCommerceImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

interface WooCommerceAttribute {
  id: number;
  name: string;
  options: string[];
}

class EcommerceIntegrationService {
  private shopifyConfig: {
    shop: string;
    accessToken: string;
    apiVersion: string;
  };

  private wooCommerceConfig: {
    url: string;
    consumerKey: string;
    consumerSecret: string;
  };

  private magentoConfig: {
    baseUrl: string;
    adminToken: string;
  };

  constructor() {
    this.shopifyConfig = {
      shop: process.env.SHOPIFY_SHOP || '',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
      apiVersion: '2023-10'
    };

    this.wooCommerceConfig = {
      url: process.env.WOOCOMMERCE_URL || '',
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || ''
    };

    this.magentoConfig = {
      baseUrl: process.env.MAGENTO_BASE_URL || '',
      adminToken: process.env.MAGENTO_ADMIN_TOKEN || ''
    };
  }

  // Shopify Integration
  async syncShopifyProducts(): Promise<ClothingItem[]> {
    try {
      const response = await fetch(
        `https://${this.shopifyConfig.shop}.myshopify.com/admin/api/${this.shopifyConfig.apiVersion}/products.json`,
        {
          headers: {
            'X-Shopify-Access-Token': this.shopifyConfig.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      return data.products.map((product: ShopifyProduct) => this.convertShopifyProduct(product));
    } catch (error) {
      console.error('Shopify sync failed:', error);
      throw new Error('Failed to sync Shopify products');
    }
  }

  async createShopifyWebhook(topic: string, endpoint: string) {
    try {
      const webhook = {
        webhook: {
          topic,
          address: `${process.env.WEBHOOK_BASE_URL}${endpoint}`,
          format: 'json'
        }
      };

      const response = await fetch(
        `https://${this.shopifyConfig.shop}.myshopify.com/admin/api/${this.shopifyConfig.apiVersion}/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': this.shopifyConfig.accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhook)
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Webhook creation failed:', error);
      throw error;
    }
  }

  // WooCommerce Integration
  async syncWooCommerceProducts(): Promise<ClothingItem[]> {
    try {
      const auth = Buffer.from(`${this.wooCommerceConfig.consumerKey}:${this.wooCommerceConfig.consumerSecret}`).toString('base64');
      
      const response = await fetch(
        `${this.wooCommerceConfig.url}/wp-json/wc/v3/products`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const products = await response.json();
      return products.map((product: WooCommerceProduct) => this.convertWooCommerceProduct(product));
    } catch (error) {
      console.error('WooCommerce sync failed:', error);
      throw new Error('Failed to sync WooCommerce products');
    }
  }

  // Magento Integration
  async syncMagentoProducts(): Promise<ClothingItem[]> {
    try {
      const response = await fetch(
        `${this.magentoConfig.baseUrl}/rest/V1/products`,
        {
          headers: {
            'Authorization': `Bearer ${this.magentoConfig.adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      return data.items.map((product: any) => this.convertMagentoProduct(product));
    } catch (error) {
      console.error('Magento sync failed:', error);
      throw new Error('Failed to sync Magento products');
    }
  }

  // Custom API Integration
  async syncCustomAPI(apiConfig: {
    baseUrl: string;
    apiKey: string;
    endpoints: {
      products: string;
      categories: string;
      inventory: string;
    };
  }): Promise<ClothingItem[]> {
    try {
      const response = await fetch(
        `${apiConfig.baseUrl}${apiConfig.endpoints.products}`,
        {
          headers: {
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const products = await response.json();
      return products.map((product: any) => this.convertCustomProduct(product));
    } catch (error) {
      console.error('Custom API sync failed:', error);
      throw new Error('Failed to sync custom API products');
    }
  }

  // Shopping Cart Integration
  async addToCart(platform: string, productId: string, variantId: string, quantity: number) {
    switch (platform) {
      case 'shopify':
        return this.addToShopifyCart(productId, variantId, quantity);
      case 'woocommerce':
        return this.addToWooCommerceCart(productId, quantity);
      case 'magento':
        return this.addToMagentoCart(productId, quantity);
      default:
        throw new Error('Unsupported platform');
    }
  }

  private async addToShopifyCart(productId: string, variantId: string, quantity: number) {
    // Shopify Storefront API for cart operations
    const mutation = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      cartId: 'gid://shopify/Cart/cart-id',
      lines: [{
        merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
        quantity
      }]
    };

    const response = await fetch(
      `https://${this.shopifyConfig.shop}.myshopify.com/api/2023-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_TOKEN || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: mutation, variables })
      }
    );

    return await response.json();
  }

  private async addToWooCommerceCart(productId: string, quantity: number) {
    // WooCommerce REST API doesn't have direct cart endpoints
    // This would typically be handled by the frontend JavaScript
    return {
      success: true,
      message: 'Product added to cart',
      productId,
      quantity
    };
  }

  private async addToMagentoCart(productId: string, quantity: number) {
    const cartData = {
      cartItem: {
        sku: productId,
        qty: quantity,
        quote_id: 'guest-cart-id'
      }
    };

    const response = await fetch(
      `${this.magentoConfig.baseUrl}/rest/V1/guest-carts/guest-cart-id/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartData)
      }
    );

    return await response.json();
  }

  // Inventory Management
  async updateInventory(platform: string, productId: string, variantId: string, quantity: number) {
    switch (platform) {
      case 'shopify':
        return this.updateShopifyInventory(variantId, quantity);
      case 'woocommerce':
        return this.updateWooCommerceInventory(productId, quantity);
      case 'magento':
        return this.updateMagentoInventory(productId, quantity);
      default:
        throw new Error('Unsupported platform');
    }
  }

  private async updateShopifyInventory(variantId: string, quantity: number) {
    const inventoryItem = {
      inventory_level: {
        available: quantity
      }
    };

    const response = await fetch(
      `https://${this.shopifyConfig.shop}.myshopify.com/admin/api/${this.shopifyConfig.apiVersion}/inventory_levels/set.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': this.shopifyConfig.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inventoryItem)
      }
    );

    return await response.json();
  }

  private async updateWooCommerceInventory(productId: string, quantity: number) {
    const auth = Buffer.from(`${this.wooCommerceConfig.consumerKey}:${this.wooCommerceConfig.consumerSecret}`).toString('base64');
    
    const response = await fetch(
      `${this.wooCommerceConfig.url}/wp-json/wc/v3/products/${productId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stock_quantity: quantity,
          manage_stock: true
        })
      }
    );

    return await response.json();
  }

  private async updateMagentoInventory(productId: string, quantity: number) {
    const stockItem = {
      stockItem: {
        qty: quantity,
        is_in_stock: quantity > 0
      }
    };

    const response = await fetch(
      `${this.magentoConfig.baseUrl}/rest/V1/products/${productId}/stockItems/1`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.magentoConfig.adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stockItem)
      }
    );

    return await response.json();
  }

  // Product conversion methods
  private convertShopifyProduct(product: ShopifyProduct): ClothingItem {
    return {
      id: product.id,
      name: product.title,
      category: this.mapProductType(product.product_type),
      style: this.extractStyle(product.tags),
      colors: this.extractColors(product.variants),
      brand: product.vendor,
      price: parseFloat(product.variants[0]?.price || '0'),
      image: product.images[0]?.src || '',
      overlayImage: product.images[1]?.src || product.images[0]?.src || '',
      tags: product.tags.split(',').map(tag => tag.trim()),
      rating: 4.5, // Default rating
      sizes: product.variants.map(v => v.option1).filter(Boolean) as any[]
    };
  }

  private convertWooCommerceProduct(product: WooCommerceProduct): ClothingItem {
    return {
      id: product.id.toString(),
      name: product.name,
      category: this.mapProductType(product.name),
      style: 'casual', // Default style
      colors: this.extractColorsFromAttributes(product.attributes),
      brand: 'Unknown', // WooCommerce doesn't have vendor by default
      price: parseFloat(product.price),
      image: product.images[0]?.src || '',
      overlayImage: product.images[1]?.src || product.images[0]?.src || '',
      tags: [],
      rating: 4.0,
      sizes: this.extractSizesFromAttributes(product.attributes)
    };
  }

  private convertMagentoProduct(product: any): ClothingItem {
    return {
      id: product.id.toString(),
      name: product.name,
      category: this.mapProductType(product.type_id),
      style: 'casual',
      colors: [],
      brand: product.custom_attributes?.find((attr: any) => attr.attribute_code === 'manufacturer')?.value || 'Unknown',
      price: parseFloat(product.price || '0'),
      image: '',
      overlayImage: '',
      tags: [],
      rating: 4.0,
      sizes: []
    };
  }

  private convertCustomProduct(product: any): ClothingItem {
    return {
      id: product.id,
      name: product.name || product.title,
      category: this.mapProductType(product.category),
      style: product.style || 'casual',
      colors: product.colors || [],
      brand: product.brand || 'Unknown',
      price: parseFloat(product.price || '0'),
      image: product.image || product.images?.[0] || '',
      overlayImage: product.overlayImage || product.images?.[1] || '',
      tags: product.tags || [],
      rating: product.rating || 4.0,
      sizes: product.sizes || []
    };
  }

  // Helper methods
  private mapProductType(type: string): any {
    const typeMap: Record<string, any> = {
      'shirt': 'tops',
      'blouse': 'tops',
      'top': 'tops',
      'dress': 'dresses',
      'pants': 'bottoms',
      'jeans': 'bottoms',
      'skirt': 'bottoms',
      'jacket': 'outerwear',
      'coat': 'outerwear',
      'blazer': 'outerwear'
    };

    const lowerType = type.toLowerCase();
    for (const [key, value] of Object.entries(typeMap)) {
      if (lowerType.includes(key)) {
        return value;
      }
    }

    return 'tops'; // Default
  }

  private extractStyle(tags: string): any {
    const styleTags = ['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist'];
    const tagList = tags.toLowerCase().split(',');
    
    for (const style of styleTags) {
      if (tagList.some(tag => tag.includes(style))) {
        return style;
      }
    }
    
    return 'casual';
  }

  private extractColors(variants: ShopifyVariant[]): string[] {
    const colors = variants
      .map(v => v.option2)
      .filter(Boolean)
      .filter((color, index, arr) => arr.indexOf(color) === index);
    
    return colors.length > 0 ? colors : ['black'];
  }

  private extractColorsFromAttributes(attributes: WooCommerceAttribute[]): string[] {
    const colorAttr = attributes.find(attr => 
      attr.name.toLowerCase().includes('color') || 
      attr.name.toLowerCase().includes('colour')
    );
    
    return colorAttr?.options || ['black'];
  }

  private extractSizesFromAttributes(attributes: WooCommerceAttribute[]): any[] {
    const sizeAttr = attributes.find(attr => 
      attr.name.toLowerCase().includes('size')
    );
    
    return sizeAttr?.options || ['M'];
  }
}

export const ecommerceService = new EcommerceIntegrationService();