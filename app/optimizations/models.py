from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class ProductOptRecord:
    product_id: str
    changes: Dict[str, str]
    ai_tags: Dict[str, float] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class OptimizationSnapshot:
    snapshot_id: str
    product_id: str
    title_before: str
    title_after: str
    description_before: str
    description_after: str
    metadata: Dict[str, str] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ABTest:
    test_id: str
    product_id: str
    variant_a: Dict[str, str]
    variant_b: Dict[str, str]
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    winner_variant: Optional[str] = None


@dataclass
class StoreMemory:
    store_id: str
    embeddings_uri: Optional[str] = None
    last_updated: datetime = field(default_factory=datetime.utcnow)
    notes: List[str] = field(default_factory=list)
