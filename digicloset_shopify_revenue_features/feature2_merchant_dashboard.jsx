
// Feature 2: Merchant Dashboard (React)
// Shows usage and engagement metrics for merchants

import React from "react";

export default function Dashboard({ stats }) {
  return (
    <div>
      <h1>DigiCloset Analytics</h1>
      <p>Outfit Views: {stats.views}</p>
      <p>Clicks: {stats.clicks}</p>
      <p>Conversion Lift: {stats.conversionLift}%</p>
    </div>
  );
}
