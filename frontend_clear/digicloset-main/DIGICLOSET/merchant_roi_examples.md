## Merchant-facing ROI examples

- Example ROI statement: "On average merchants see a 12% conversion uplift from try-on interactions, resulting in an estimated incremental revenue of $1,200/month for a catalog of 1,000 monthly visitors."

- Suggested data sources:
  - `estimatedRevenueLift`: derived from attributed revenue events collected via `/metrics/record` (type=`revenue`).
  - `conversionRateImpact`: conversions / try-ons converted into percentage points.
  - `timeSavedMinutes`: aggregate of time_saved_minutes on recorded events divided by try-ons.

- Copy templates merchants can use in communications:
  - Short: "AI try-on increased conversions by {conversionRateImpact}% and delivered an estimated {estimatedRevenueLift} in incremental revenue."
  - Detailed: "Last 30 days: {conversions} conversions from {tryOns} try-ons, estimated incremental revenue {estimatedRevenueLift}."
