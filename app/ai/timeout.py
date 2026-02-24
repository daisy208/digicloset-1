from __future__ import annotations

import asyncio
from typing import Callable, Any

from anyio import to_thread


async def run_blocking_with_timeout(func: Callable[..., Any], *args, timeout: float = 10.0, **kwargs) -> Any:
    """Run a blocking callable in a thread with a timeout and raise asyncio.TimeoutError on timeout.

    Uses anyio.to_thread to avoid blocking event loop.
    """
    coro = to_thread.run_sync(func, *args, **kwargs)
    return await asyncio.wait_for(coro, timeout=timeout)
