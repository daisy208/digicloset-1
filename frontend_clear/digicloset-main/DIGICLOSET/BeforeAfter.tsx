import React from "react";
import ReactCompareImage from "react-compare-image";

type MonthlyAiSummary = {
  month: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  notes?: string;
};

type BeforeAfterProps = {
  beforeUrl: string; // original user photo
  afterUrl: string; // AI try-on result
  title?: string; // SEO title for this comparison
  description?: string; // merchant/customer-facing description
  productImages?: string[]; // additional images for SEO / social previews
  estimatedRevenueLift?: number; // absolute dollar estimate
  conversionRateImpact?: number; // percentage points (e.g. 1.5 = +1.5%)
  timeSavedMinutes?: number; // time saved in minutes
  monthlyAiSummary?: MonthlyAiSummary[]; // array of monthly performance summaries
  roiStatement?: string; // clear merchant-facing ROI text
};

export default function BeforeAfter({
  beforeUrl,
  afterUrl,
  title,
  description,
  productImages = [],
  estimatedRevenueLift,
  conversionRateImpact,
  timeSavedMinutes,
  monthlyAiSummary = [],
  roiStatement,
}: BeforeAfterProps) {
  const formatMoney = (v?: number) =>
    v === undefined ? "—" : v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const formatPct = (v?: number) => (v === undefined ? "—" : `${v > 0 ? "+" : ""}${v}%`);

  const formatTime = (mins?: number) => {
    if (mins === undefined) return "—";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  };

  return (
    <section className="w-full max-w-3xl mx-auto rounded-lg overflow-hidden border border-gray-300 p-4" aria-label="Before and After comparison">
      {/* SEO metadata hints for server-side render / static export */}
      {title && <meta name="og:title" content={title} />}
      {description && <meta name="description" content={description} />}
      {productImages.map((src, i) => (
        <meta key={i} name={`og:image:${i}`} content={src} />
      ))}

      <div className="mb-4">
        <ReactCompareImage
          leftImage={beforeUrl}
          rightImage={afterUrl}
          sliderLineColor="#2563eb"
          sliderLineWidth={3}
        />
      </div>

      {title && <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>}

      {description && <p className="text-sm text-gray-700 mb-4">{description}</p>}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <div className="text-xs text-gray-500">Estimated revenue lift</div>
          <div className="text-xl font-bold text-green-600">{formatMoney(estimatedRevenueLift)}</div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="text-xs text-gray-500">Conversion rate impact</div>
          <div className="text-xl font-bold text-blue-600">{formatPct(conversionRateImpact)}</div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="text-xs text-gray-500">Time saved</div>
          <div className="text-xl font-bold text-indigo-600">{formatTime(timeSavedMinutes)}</div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="text-xs text-gray-500">Monthly AI summary</div>
          <div className="text-sm text-gray-800">
            {monthlyAiSummary.length === 0 ? (
              <span>—</span>
            ) : (
              <ul className="list-disc pl-4">
                {monthlyAiSummary.slice(0, 3).map((m, idx) => (
                  <li key={idx} className="truncate">
                    <strong>{m.month}:</strong> {m.conversions ?? "—"} conversions{m.notes ? ` — ${m.notes}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {roiStatement && (
        <div className="mt-2 p-3 rounded border-l-4 border-green-500 bg-green-50">
          <div className="text-sm text-gray-900 font-medium">Merchant ROI</div>
          <div className="text-sm text-gray-700 mt-1">{roiStatement}</div>
        </div>
      )}
    </section>
  );
}
