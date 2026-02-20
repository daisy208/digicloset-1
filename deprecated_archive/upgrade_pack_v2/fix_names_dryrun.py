
#!/usr/bin/env python3
"""Scan current working directory for paths containing whitespace and print suggested git mv commands."""
import os, sys, pathlib, shlex

def suggested_new(path):
    # remove double spaces and trim whitespace around slashes
    new = ' '.join(path.split())
    new = new.replace(' /', '/').replace('/ ', '/')
    new = new.replace(' ', '_')  # conservative: replace spaces with underscores
    return new

root = pathlib.Path('.')
for p in root.rglob('*'):
    if ' ' in p.name:
        new = suggested_new(str(p))
        print(f'git mv {shlex.quote(str(p))} {shlex.quote(new)}')
