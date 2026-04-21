import asyncio
import os
import uvicorn
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

@app.get("/api/ls")
async def list_dir(path: str = Query(".")):
    """List directories for the path browser."""
    try:
        abs_path = os.path.abspath(os.path.expanduser(path))
        if not os.path.exists(abs_path):
            return {"error": "Path does not exist", "entries": []}
        
        entries = []
        # Add parent directory option if not at root
        parent = os.path.dirname(abs_path)
        if parent != abs_path:
            entries.append({"name": "..", "path": parent, "is_dir": True})

        for entry in os.scandir(abs_path):
            try:
                if entry.is_dir() and not entry.name.startswith('.'):
                    entries.append({
                        "name": entry.name,
                        "path": entry.path,
                        "is_dir": True
                    })
            except OSError:
                continue
        
        # Sort by name
        entries.sort(key=lambda x: x["name"].lower())
        return {"current_path": abs_path, "entries": entries}
    except Exception as e:
        return {"error": str(e), "entries": []}

@app.post("/api/groups")
async def add_group(group: Group):
    store.add_group(group)
    return {"status": "ok"}

@app.post("/api/worktrees")
async def create_worktree(repo_id: str, task_name: str):
    repos = store.get_all().get("repos", [])
    repo = next((r for r in repos if r.id == repo_id), None)
    if not repo:
        return {"error": "Repo not found"}
    
    # Safe folder name from task name
    safe_name = "".join([c if c.isalnum() else "-" for c in task_name]).lower()
    worktree_id = f"{safe_name}-{os.urandom(4).hex()}"
    worktree_path = os.path.expanduser(f"~/.overseer/worktrees/{worktree_id}")
    
    os.makedirs(os.path.dirname(worktree_path), exist_ok=True)
    
    success = GitManager.add_worktree(repo.path, worktree_path)
    if success:
        return {"status": "ok", "path": worktree_path}
    else:
        return {"error": "Failed to create worktree"}

@app.websocket("/ws/terminal")
async def terminal_websocket(
    websocket: WebSocket, 
    cwd: Optional[str] = Query(None)
):
    await websocket.accept()
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

# Static files serving (for production)
static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

def run():
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000)

if __name__ == "__main__":
    run()
