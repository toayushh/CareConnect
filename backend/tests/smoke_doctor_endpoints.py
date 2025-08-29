#!/usr/bin/env python3
"""
Quick smoke tests for doctor endpoints.
Run: source venv/bin/activate && python backend/tests/smoke_doctor_endpoints.py
Assumes a dev server running on http://127.0.0.1:5001
"""
import json
import os
import sys
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = os.environ.get('API_BASE', 'http://127.0.0.1:5001/api')
EMAIL = os.environ.get('TEST_EMAIL', 'doc@example.com')
PASSWORD = os.environ.get('TEST_PASSWORD', 'password123')

def _http(method, path, body=None, token=None):
    data = None if body is None else json.dumps(body).encode('utf-8')
    req = Request(BASE + path, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urlopen(req, timeout=10) as resp:
            return resp.getcode(), json.loads(resp.read().decode('utf-8') or 'null')
    except HTTPError as e:
        try:
            payload = e.read().decode('utf-8')
        except Exception:
            payload = ''
        return e.code, payload


def main():
    # Login
    code, data = _http('POST', '/auth/login', {'email': EMAIL, 'password': PASSWORD})
    if code != 200:
        print('Login failed:', code, data)
        return 1
    access = data['access_token']

    # Get my doctor profile
    code, doc = _http('GET', '/doctors/me', token=access)
    print('GET /doctors/me =>', code)
    if code != 200:
        print(doc)
        return 1

    # Update schedule availability JSON
    avail = json.dumps({'schedule': {'monday': {'enabled': True, 'startTime': '09:00', 'endTime': '17:00'}}})
    code, upd = _http('PUT', '/doctors/me', {'availability': avail}, token=access)
    print('PUT /doctors/me =>', code, upd)

    # List appointments
    code, appts = _http('GET', '/appointments', token=access)
    print('GET /appointments =>', code, f'items={len(appts) if isinstance(appts, list) else "?"}')
    if code == 200 and isinstance(appts, list) and appts:
        first = appts[0]
        # Try status update (no-op)
        code, res = _http('POST', f"/appointments/{first['id']}/status", {'status': 'confirmed'}, token=access)
        print('POST /appointments/:id/status =>', code)

    print('Smoke tests done.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())

