PRESETS = {
    "minimal": {"background": "white"},
    "luxury": {"background": "dark"}
}

def get_brand_preset(name):
    return PRESETS.get(name, PRESETS["minimal"])
