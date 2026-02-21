def generate_alt_text(title: str) -> str:
    return f"High-quality image of {title} on clean background"

def generate_tags_and_attributes(title: str):
    tags = title.lower().split()
    attributes = {"category": "apparel", "style": "modern"}
    return tags, attributes
