#!/usr/bin/env python3
"""Lightweight anomaly detector: fetches metric timeseries from Prometheus HTTP API and flags anomalies using z-score."""
import os, sys, time, requests
import numpy as np
from dotenv import load_dotenv

load_dotenv()
PROM_URL = os.getenv('PROMETHEUS_URL', 'http://prometheus:9090')

def query_range(query, start, end, step='15s'):
    url = f"{PROM_URL}/api/v1/query_range"
    r = requests.get(url, params={'query': query, 'start': start, 'end': end, 'step': step})
    r.raise_for_status()
    return r.json()

def detect_anomalies(values, threshold=3.0):
    arr = np.array(values)
    mean = arr.mean()
    std = arr.std() if arr.std() != 0 else 1.0
    z = (arr - mean) / std
    return np.where(np.abs(z) > threshold)[0].tolist()

if __name__ == '__main__':
    import datetime as dt
    end = dt.datetime.utcnow()
    start = end - dt.timedelta(hours=1)
    res = query_range('process_cpu_seconds_total{job="ai-service"}', start.timestamp(), end.timestamp())
    print('Response keys:', res.keys())
    # This script is a template — adapt metric names and further actions (alerts/visualization) as needed.
