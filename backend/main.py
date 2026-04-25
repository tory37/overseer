import asyncio
import os
import json
import uvicorn
import logging
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .pty_manager import PtyManager
from .session_manager import SessionManager
from .store import Store, Repo, Group, SessionTab, Persona
from .git_utils import GitManager
from backend.file_system_api import list_directory_contents
from pydantic import BaseModel
import shutil

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FileSystemPath(BaseModel):
    path: str

class NewSessionRequest(BaseModel):
    name: str
    cwd: str
    personaId: Optional[str] = None
    command: Optional[str] = None # Added command field
    rows: Optional[int] = 24
    cols: Optional[int] = 80

app = FastAPI()
store = Store()
session_manager = SessionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    if not shutil.which("tmux"):
        logger.error(
            "tmux is required but not found. "
            "Install with: sudo apt install tmux"
        )
        raise SystemExit(1)
    stored_sessions = store.config.sessions
    session_manager.startup_discover(stored_sessions)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/config")
async def get_config():
    return store.get_all()

@app.get("/api/sessions")
async def get_sessions():
    return store.config.sessions

@app.post("/api/sessions")
async def create_session(request: NewSessionRequest):
    persona = None
    if request.personaId:
        persona = next((p for p in store.config.personas if p.id == request.personaId), None)
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona with ID '{request.personaId}' not found")
    
    session_id = await session_manager.create_session(
        request.name, 
        request.cwd, 
        persona, 
        request.command,
        rows=request.rows,
        cols=request.cols
    ) 
    return {"id": session_id}

@app.get("/api/personas")
async def get_personas():
    return store.config.personas

@app.post("/api/personas")
async def create_persona(persona: Persona):
    store.add_persona(persona)
    return persona

@app.delete("/api/personas/{persona_id}")
async def delete_persona(persona_id: str):
    try:
        store.delete_persona(persona_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "ok"}

@app.put("/api/personas/{persona_id}")
async def update_persona(persona_id: str, persona: Persona):
    if persona.id != persona_id:
        raise HTTPException(status_code=422, detail=f"Body id '{persona.id}' does not match URL id '{persona_id}'.")
    try:
        store.update_persona(persona_id, persona)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return persona

@app.put("/api/sessions")
async def update_sessions(sessions: List[SessionTab]):
    old_ids = {s.id for s in store.config.sessions}
    new_ids = {s.id for s in sessions}
    
    deleted_ids = old_ids - new_ids
    for sid in deleted_ids:
        session_manager.unregister(sid)
        
    store.update_sessions(sessions)
    return {"status": "ok"}

@app.delete("/api/sessions/{session_id}")
async def delete_session_endpoint(session_id: str):
    stored = next((s for s in store.config.sessions if s.id == session_id), None)
    if not stored and not session_manager.get_session(session_id):
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    session_manager.unregister(session_id)
    store.delete_session(session_id)
    return {"status": "ok"}

@app.post("/api/repos")
async def add_repo(repo: Repo):
    store.add_repo(repo)
    return {"status": "ok"}

@app.post("/api/fs/list")
async def list_fs_contents(fs_path: FileSystemPath):
    return {"contents": list_directory_contents(fs_path.path)}

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
    repo = next((r for r in store.config.repos if r.id == repo_id), None)
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

@app.get("/api/git/status")
async def git_status(cwd: str):
    """Get git status for the given directory."""
    import subprocess
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", "-b"],
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True
        )
        return {"status": "ok", "output": result.stdout}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.websocket("/ws/voice_test")
async def voice_test_websocket(websocket: WebSocket, sessionId: str = Query(...)):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                message_content = msg.get("message")
                if message_content and sessionId:
                    session = session_manager.get_session(sessionId)
                    if not session:
                        # Try to recover from store
                        session_tab = next((s for s in store.config.sessions if s.id == sessionId), None)
                        if session_tab:
                            logger.info(f"Recovering session {sessionId} for voice test")
                            persona = None
                            if session_tab.personaId:
                                persona = next((p for p in store.config.personas if p.id == session_tab.personaId), None)
                            
                            await session_manager.create_session(
                                name=session_tab.name,
                                cwd=session_tab.cwd,
                                persona=persona,
                                command=session_tab.command or "/bin/bash",
                                session_id=sessionId
                            )
                            session = session_manager.get_session(sessionId)
                    
                    if session:
                        voice_message = f"<voice>{message_content}</voice>"
                        for q in session.queues:
                            try:
                                q.put_nowait(voice_message.encode())
                            except asyncio.QueueFull:
                                pass # Client queue is full, skip this client
                        await websocket.send_text(f"Sent voice message to session {sessionId}")
                    else:
                        await websocket.send_text(f"Error: Session {sessionId} not found and could not be recovered")
                else:
                    await websocket.send_text("Error: Missing 'message' in payload")
            except json.JSONDecodeError:
                await websocket.send_text("Error: Invalid JSON format")
            except Exception as e:
                await websocket.send_text(f"An error occurred: {e}")
    except WebSocketDisconnect:
        logger.info(f"Voice test WebSocket disconnected for session {sessionId}")

@app.websocket("/ws/terminal")
async def terminal_websocket(
    websocket: WebSocket, 
    sessionId: str = Query(...),
    cwd: Optional[str] = Query(None),
    command: Optional[str] = Query("/bin/bash"),
    personaId: Optional[str] = Query(None),
    rows: int = Query(24),
    cols: int = Query(80)
):
    await websocket.accept()
    logger.info(f"Terminal WebSocket connection accepted for session {sessionId} size {rows}x{cols}")
    
    session = session_manager.get_session(sessionId)
    if not session:
        if cwd:
            logger.info(f"Creating session on-the-fly for {sessionId} in {cwd} with persona {personaId}")
            name = sessionId
            session_tab = next((s for s in store.config.sessions if s.id == sessionId), None)
            if session_tab:
                name = session_tab.name
                if not personaId:
                    personaId = session_tab.personaId
            
            persona = None
            if personaId:
                persona = next((p for p in store.config.personas if p.id == personaId), None)

            try:
                await session_manager.create_session(
                    name=name,
                    cwd=cwd,
                    persona=persona,
                    command=command,
                    session_id=sessionId,
                    rows=rows,
                    cols=cols
                )
                session = session_manager.get_session(sessionId)
            except Exception as e:
                logger.error(f"Failed to create session {sessionId}: {e}")
                await websocket.close(code=1011, reason=f"Failed to create session: {e}")
                return
        else:
            logger.warning(f"Session {sessionId} not found and no cwd provided for on-the-fly creation")
            await websocket.close(code=4004, reason=f"Session {sessionId} not found and no cwd provided")
            return

    if not session:
        logger.error(f"Session {sessionId} still None after creation attempt")
        await websocket.close(code=1011, reason="Failed to initialize session")
        return

    # Update size if it differs from current
    if session.pty.rows != rows or session.pty.cols != cols:
        logger.info(f"Resizing PTY for {sessionId} to {rows}x{cols} from {session.pty.rows}x{session.pty.cols}")
        session.pty.resize(rows, cols)
        session.pty.rows = rows
        session.pty.cols = cols

    # Atomic snapshot of buffer and new queue
    buffer, queue = await session.subscribe()
    
    # Send existing buffer to the client immediately upon reconnection
    try:
        if buffer:
            await websocket.send_bytes(buffer)
    except Exception as e:
        logger.error(f"Error sending buffer to WS for session {sessionId}: {e}")

    async def pty_to_ws():
        try:
            while True:
                data = await queue.get()
                if data:
                    try:
                        await websocket.send_bytes(data)
                    except Exception as e:
                        logger.error(f"Error sending data to WS for session {sessionId}: {e}")
                queue.task_done()
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"pty_to_ws error for session {sessionId}: {e}")

    async def ws_to_pty():
        try:
            while True:
                message = await websocket.receive_text()
                try:
                    msg = json.loads(message)
                    if msg.get("type") == "input":
                        input_data = msg.get("data")
                        if input_data and session.pty.is_alive():
                            session.pty.write(input_data)
                    elif msg.get("type") == "resize":
                        cols = msg.get("cols")
                        rows = msg.get("rows")
                        if cols and rows:
                            session.pty.resize(rows, cols)
                            session.pty.rows = rows
                            session.pty.cols = cols
                except json.JSONDecodeError:
                    if message and session.pty.is_alive():
                        session.pty.write(message)
        except WebSocketDisconnect:
            raise
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"ws_to_pty error for session {sessionId}: {e}")

    async def monitor_pty():
        try:
            while session.pty.is_alive():
                await asyncio.sleep(1)
            logger.info(f"PTY for session {sessionId} has exited. Closing WebSocket.")
            await websocket.close(code=1000, reason="PTY process exited")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"monitor_pty error for session {sessionId}: {e}")

    tasks = [
        asyncio.create_task(pty_to_ws(), name=f"pty_to_ws_{sessionId}"),
        asyncio.create_task(ws_to_pty(), name=f"ws_to_pty_{sessionId}"),
        asyncio.create_task(monitor_pty(), name=f"monitor_pty_{sessionId}")
    ]
    
    try:
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            if not task.cancelled():
                exception = task.exception()
                if exception and not isinstance(exception, WebSocketDisconnect):
                    raise exception
    except WebSocketDisconnect:
        logger.info(f"Terminal WebSocket disconnected for session {sessionId}")
    except Exception as e:
        logger.error(f"Terminal WebSocket error for session {sessionId}: {e}")
    finally:
        logger.info(f"Cleaning up WebSocket for session {sessionId}")
        for task in tasks:
            if not task.done():
                task.cancel()
        
        # Wait for all tasks to complete their cancellation
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
            
        session.unsubscribe(queue)
        # The session should only be unregistered when explicitly closed or pruned by a background task.

# Static files serving (for production)
static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

def run():
    import argparse
    parser = argparse.ArgumentParser(description="Overseer - Managed Agent Isolation Control Plane")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    args = parser.parse_args()
    
    uvicorn.run("backend.main:app", host=args.host, port=args.port)

if __name__ == "__main__":
    run()
