from fastapi import FastAPI

app = FastAPI(title="Agent Manager API")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
