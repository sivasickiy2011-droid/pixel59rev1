import os

import pytest

from backend._shared.security import ensure_admin_authorized, get_admin_token


def test_get_admin_token_without_headers_returns_none():
    assert get_admin_token(None) is None


def test_ensure_admin_authorized_missing_secret_returns_none(monkeypatch):
    monkeypatch.delenv('JWT_SECRET', raising=False)
    assert ensure_admin_authorized({'x-admin-token': 'fake'}) is None


def test_ensure_admin_authorized_invalid_token_returns_none(monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'secret')
    assert ensure_admin_authorized({'x-admin-token': 'invalid'}) is None
