import os
from typing import Dict


DEFAULT_FLAGS = {
    "enable_sms": False,
    "enable_referrals": False,
    "enable_beta_ui": False,
    "enable_auto_assign_taskers": False,
    "enable_aggressive_fraud_checks": False,
}

_overrides: Dict[str, bool] = {}


def _env_bool(key: str, default: bool) -> bool:
    val = os.getenv(key)
    if val is None:
        return default
    return val.lower() in ("1", "true", "yes", "on")


def get_feature_flags() -> Dict[str, bool]:
    # overrides take precedence; otherwise fall back to env + defaults
    base = {
        "enable_sms": _env_bool("TASKUP_ENABLE_SMS", DEFAULT_FLAGS["enable_sms"]),
        "enable_referrals": _env_bool("TASKUP_ENABLE_REFERRALS", DEFAULT_FLAGS["enable_referrals"]),
        "enable_beta_ui": _env_bool("TASKUP_ENABLE_BETA_UI", DEFAULT_FLAGS["enable_beta_ui"]),
        "enable_auto_assign_taskers": _env_bool("TASKUP_ENABLE_AUTO_ASSIGN_TASKERS", DEFAULT_FLAGS["enable_auto_assign_taskers"]),
        "enable_aggressive_fraud_checks": _env_bool("TASKUP_ENABLE_AGGRESSIVE_FRAUD_CHECKS", DEFAULT_FLAGS["enable_aggressive_fraud_checks"]),
    }
    base.update(_overrides)
    return base


def is_feature_enabled(name: str) -> bool:
    return get_feature_flags().get(name, False)


def set_feature_flag(name: str, enabled: bool):
    """
    Set an in-memory override for a feature flag. Persists only for the process lifetime.
    """
    if name not in DEFAULT_FLAGS:
        return False
    _overrides[name] = enabled
    return True
