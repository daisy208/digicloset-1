// widget.js
// Injected on Shopify product pages to show outfit bundles
(function() {
  // Get product SKU from Shopify product page (assume window.meta.product.sku or similar)
  var sku = window?.meta?.product?.sku || null; // TODO: Confirm actual selector for SKU
  // Get storeId (assume injected as window.DIGICLOSET_STORE_ID)
  var storeId = window.DIGICLOSET_STORE_ID || null; // TODO: Confirm how storeId is injected
  if (!sku || !storeId) return;

  // Backend API endpoint for outfit bundles
  var apiUrl = 'https://your-backend.example.com/api/outfits'; // TODO: Replace with real endpoint
  fetch(apiUrl + '?sku=' + encodeURIComponent(sku) + '&storeId=' + encodeURIComponent(storeId))
    .then(r => r.json())
    .then(data => {
      if (!Array.isArray(data) || data.length < 2) {
        // Hide widget if no data or less than 2 bundles
        return;
      }
      var widget = document.createElement('div');
      widget.id = 'digicloset-complete-the-look';
      widget.style = 'border:1px solid #eee;padding:16px;margin:16px 0;';
      widget.innerHTML = '<h3>Complete the Look</h3>' +
        data.slice(0, 4).map(bundle =>
          `<div style="margin-bottom:12px;"><b>${bundle.title}</b><br>${bundle.products.map(p => p.name).join(', ')}</div>`
        ).join('');
      var container = document.querySelector('.product-single, .product-main, main') || document.body;
      container.appendChild(widget);
    })
    .catch(() => {
      // TODO: Optionally log error or show fallback UI
    });
})();
