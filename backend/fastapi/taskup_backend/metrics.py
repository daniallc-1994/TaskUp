import logging

logger = logging.getLogger("taskup")


def record_metric(name: str, value: float = 1.0, **tags):
    """
    Lightweight metric hook. Replace with DataDog/Prometheus client in production.
    """
    logger.info(f"metric {name} value={value} tags={tags}")
