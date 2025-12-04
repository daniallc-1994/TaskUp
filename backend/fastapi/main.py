from taskup_backend.app import create_app

app = create_app()


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
