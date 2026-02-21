def evaluate_product_quality(product):
    issues = []
    if not product.get("alt_text"):
        issues.append("Missing ALT text")
    return issues
