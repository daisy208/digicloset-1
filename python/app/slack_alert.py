#!/usr/bin/env python3
import os, sys, requests
from dotenv import load_dotenv
load_dotenv()
WEBHOOK = os.getenv('SLACK_WEBHOOK')
if not WEBHOOK:
    print('Set SLACK_WEBHOOK in .env')
    sys.exit(1)
msg = {'text': 'Test alert from Digicloset automation pack'}
r = requests.post(WEBHOOK, json=msg)
print(r.status_code, r.text)
