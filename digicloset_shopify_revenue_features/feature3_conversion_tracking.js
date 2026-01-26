
// Feature 3: Conversion & AOV Tracking
// Tracks conversions influenced by DigiCloset recommendations

export function trackConversion(order) {
  const payload = {
    orderId: order.id,
    value: order.total_price,
    source: "digicloset"
  };

  fetch("/api/track-conversion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
