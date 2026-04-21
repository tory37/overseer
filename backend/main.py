import asyncio
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from .pty_manager import PtyManager
from .store import Store, Repo, Group
from .git_utils import GitManager

app = FastAPI()
store = Store()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/config")
async def get_config():
    return store.get_all()

@app.post("/api/repos")
async def add_repo(repo: Repo):
    store.add_repo(repo)
    return {"status": "ok"}

@app.post("/api/groups")
async def add_group(group: Group):
    store.add_group(group)
    return {"status": "ok"}

@app.websocket("/ws/terminal")
async def terminal_websocket(
    websocket: WebSocket, 
    cwd: Optional[str] = Query(None)
):
    await websocket.accept()
    
    # Use specified directory or fall back to default
    pty = PtyManager(cwd=cwd)
    pty.start()

    async def pty_to_ws():
        try:
            while pty.is_alive():
                data = await asyncio.to_thread(pty.read)
                if data:
                    await websocket.send_text(data.decode(errors='replace'))
                await asyncio.sleep(0.01)
        except Exception as e:
            print(f"PTY to WS error: {e}")

    async def ws_to_pty():
        try:
            while True:
                data = await websocket.receive_text()
                pty.write(data)
        except WebSocketDisconnect:
            pty.stop()
        except Exception as e:
            print(f"WS to PTY error: {e}")
            pty.stop()

    await asyncio.gather(pty_to_ws(), ws_to_pty())
