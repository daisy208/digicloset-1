import json, os
VERSION_FILE = os.path.join(os.path.dirname(__file__), "version_enterprise.json")
def get_current_version():
    with open(VERSION_FILE) as f:
        data = json.load(f)
    return data["version"]
def update_version(new_version):
    with open(VERSION_FILE, "w") as f:
        json.dump({"version": new_version}, f, indent=4)