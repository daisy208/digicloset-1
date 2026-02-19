import ipaddress
import socket
from urllib.parse import urlparse

from config import ALLOWED_SCHEMES


def is_private_ip(hostname: str) -> bool:
    try:
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private or ip_obj.is_loopback
    except Exception:
        return True


def validate_image_url(url: str):
    parsed = urlparse(url)

    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError("Only HTTPS URLs are allowed")

    if not parsed.hostname:
        raise ValueError("Invalid URL")

    if is_private_ip(parsed.hostname):
        raise ValueError("Private or loopback IPs not allowed")
