
#!/usr/bin/env python3
"""Run quick validations on repository structure after applying changes."""
import os, sys, pathlib

errors = 0
# check for remaining spaces in names
for p in pathlib.Path('.').rglob('*'):
    if ' ' in p.name:
        print('WARNING: Path contains space:', p)
        errors += 1
if errors == 0:
    print('OK: No paths with spaces found.')
else:
    print(f'{errors} items with spaces found.')
    sys.exit(1)
