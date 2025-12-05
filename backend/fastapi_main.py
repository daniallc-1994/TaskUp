"""
Canonical FastAPI entrypoint for TaskUp.

Usage:
  uvicorn backend.fastapi_main:app --reload
  python -m backend.fastapi_main
"""

from backend.fastapi.main import app  # noqa: F401


def main():
    # Allows `python -m backend.fastapi_main` to run the server quickly in dev.
    import uvicorn

    uvicorn.run("backend.fastapi_main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
