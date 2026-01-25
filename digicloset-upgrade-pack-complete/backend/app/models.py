# ----------------------
# Shopify Integration Models (Minimal)
# ----------------------
class ShopifyProduct(Base):
    __tablename__ = "shopify_products"
    id = Column(Integer, primary_key=True, index=True)
    shopify_id = Column(String, unique=True, index=True, nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # TODO: Add relationship to variants if needed

class ShopifyVariant(Base):
    __tablename__ = "shopify_variants"
    id = Column(Integer, primary_key=True, index=True)
    shopify_id = Column(String, unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("shopify_products.id"))
    title = Column(String, nullable=True)
    price = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # TODO: Add mapping to SKU if needed
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()


# ----------------------
# B2B Domain Models (Shopify-first)
# ----------------------

class Merchant(Base):
    __tablename__ = "merchants"
    id = Column(Integer, primary_key=True, index=True)
    shopify_id = Column(String, unique=True, index=True, nullable=False)  # Shopify store ID
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # TODO: Add auth fields if needed for merchant login

    catalogs = relationship("Catalog", back_populates="merchant")

class Catalog(Base):
    __tablename__ = "catalogs"
    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    merchant = relationship("Merchant", back_populates="catalogs")
    products = relationship("Product", back_populates="catalog")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    shopify_product_id = Column(String, unique=True, index=True, nullable=False)
    catalog_id = Column(Integer, ForeignKey("catalogs.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    catalog = relationship("Catalog", back_populates="products")
    skus = relationship("SKU", back_populates="product")

class SKU(Base):
    __tablename__ = "skus"
    id = Column(Integer, primary_key=True, index=True)
    shopify_variant_id = Column(String, unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    title = Column(String, nullable=True)
    price = Column(String, nullable=True)  # TODO: Use Decimal for price?
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="skus")

class Outfit(Base):
    __tablename__ = "outfits"
    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    name = Column(String, nullable=True)
    sku_bundle = Column(String, nullable=False)  # Comma-separated SKU IDs (for simplicity)
    compatibility_score = Column(Integer, nullable=False)  # TODO: Use float for score?
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # TODO: Add relationship to Merchant if needed

# ----------------------
# B2C Models (Deprioritized, do not delete yet)
# ----------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    uploads = relationship("Upload", back_populates="owner")

class Upload(Base):
    __tablename__ = "uploads"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    s3_key = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="uploads")
