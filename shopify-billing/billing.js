export async function ensureBilling(session, shopify) {
  const hasPayment = await shopify.billing.check({
    session,
    plans: ["Basic Plan"]
  });

  if (!hasPayment) {
    await shopify.billing.request({
      session,
      plan: "Basic Plan",
      isTest: true
    });
  }
}
