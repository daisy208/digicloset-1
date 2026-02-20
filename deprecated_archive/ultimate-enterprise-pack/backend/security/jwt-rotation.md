# JWT Rotation Strategy
- Access tokens: 5–15 min TTL
- Refresh tokens: 24h TTL with rotation
- Maintain a token invalidation list
- Use JTI claim for per-token uniqueness
