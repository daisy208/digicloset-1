
// Feature 1: Product Page Outfit Recommendations (Shopify App Embed)
// Injects AI-based outfit recommendations on product pages

export function injectOutfits(productId) {
  fetch(`/api/recommendations?productId=${productId}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("digicloset-outfits");
      container.innerHTML = data.outfits.map(o => `
        <div class="outfit">
          <img src="${o.image}" />
          <p>${o.name}</p>
        </div>
      `).join("");
    });
}
