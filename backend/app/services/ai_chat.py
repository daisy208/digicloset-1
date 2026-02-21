def explain_product_score(product):
    issues = product.get("issues", [])
    return "All good" if not issues else "Issues: " + ", ".join(issues)
