# Archive Report

Date: 2026-02-21

Summary:
- Moved the contents of `deprecated_archive/` into `archive/deprecated_archive/` to consolidate previously deprecated/legacy upgrade-pack artifacts and example code.
- These files were already marked as deprecated (DEPRECATED.md or inline DEPRECATED comments) and were not referenced by active code paths.

Archived files (partial listing):

Note: all files were preserved under `archive/deprecated_archive/` keeping their original structure.

Examples:
- archive/deprecated_archive/examples/DEPRECATED.md — Folder documented as deprecated.
- archive/deprecated_archive/ai-node/index.js — Marked DEPRECATED in file header; legacy node example.
- archive/deprecated_archive/ai-node/package.json — Legacy package.json for ai-node example.
- archive/deprecated_archive/ultimate-enterprise-pack/backend/DEPRECATED.md — Deprecated backend pack.
- archive/deprecated_archive/upgrade_pack_v1/DEPRECATED.md — Deprecated upgrade pack v1 notes.
- archive/deprecated_archive/upgrade_pack_v2/DEPRECATED.md — Deprecated upgrade pack v2 notes and scripts.
- archive/deprecated_archive/upgrade-pack (2)/DEPRECATED.md — Deprecated materials and k8s manifests.

Reasoning for archiving:
- These files/folders contained explicit deprecation markers (DEPRECATED.md or file headers) or resided under a repository folder named `deprecated_archive/` intended for archived content.
- They did not appear to be imported by active application code (no references found to `deprecated_archive/` paths).
- Archiving preserves history while removing clutter from the active code tree.

What I changed:
- Created `archive/deprecated_archive/` and moved all contents from the prior `deprecated_archive/` into it (preserving subfolders and filenames).
- Committed the move as `chore(archive): move deprecated_archive into /archive/deprecated_archive`.

Notes & next steps:
- I intentionally limited automated moves to the existing `deprecated_archive/` directory to avoid disrupting active builds or CI that reference other legacy folders (e.g., `digicloset-upgrade-pack`), which are sometimes referenced by docs and CI workflows.
- If you want a broader sweep (move all files with inline `DEPRECATED` headers or folders named `legacy`/`old`), I can do that next — but I will first check for references and route/CI impacts before moving any that could be used by scripts or workflows.

If you'd like, I can now:
- Expand the archival to additional candidate folders (after cross-checking references).
- Add a small script `scripts/check_archive.sh` that verifies there are no remaining imports pointing to paths under `archive/`.
