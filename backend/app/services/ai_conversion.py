def compute_conversion_impact(before, after):
    return {
        "conversion_delta": after["conversion_rate"] - before["conversion_rate"],
        "revenue_delta": after["revenue"] - before["revenue"]
    }
