# Repo Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the repository addition UI from a narrow sidebar component to a central, full-screen modal, incorporating a system-wide file browser for repository selection.

**Architecture:** The existing Python FastAPI backend will be extended with new endpoints for file system interaction. The React (TypeScript) frontend will implement new reusable components for the modal and file browser.

**Tech Stack:** React, TypeScript, FastAPI, `uv`.

---

### Task 1: Backend File System API

**Goal:** Create new FastAPI endpoints to enable listing directories and reading file/directory metadata for system-wide browsing, addressing the user's need to "browse the whole system".

**Files:**
- Create: `backend/file_system_api.py`
- Modify: `backend/main.py`
- Test: `tests/backend/test_file_system_api.py`

- [ ] **Step 1: Write a failing test for listing directory contents**

```python
# tests/backend/test_file_system_api.py
import pytest
from fastapi.testclient import TestClient
from backend.main import app # Assuming app is imported from main for testing

client = TestClient(app)

def test_list_directory_success():
    response = client.post("/api/fs/list", json={"path": "/"})
    assert response.status_code == 200
    assert "contents" in response.json()
    assert isinstance(response.json()["contents"], list)
    # Add more specific assertions for expected directory content if possible
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/backend/test_file_system_api.py`
Expected: FAIL with "404 Client Error: Not Found for url: http://localhost/api/fs/list" or similar, indicating endpoint not found.

- [ ] **Step 3: Implement `backend/file_system_api.py` with a directory listing function**

```python
# backend/file_system_api.py
import os
from pathlib import Path
from typing import List, Dict

def list_directory_contents(path: str) -> List[Dict]:
    """
    Lists the contents of a given directory path.
    Each item in the list is a dictionary with 'name', 'path', and 'type' (file/directory).
    """
    base_path = Path(path)
    if not base_path.is_dir():
        # Handle cases where the path is not a directory or doesn't exist
        return []

    contents = []
    for item in base_path.iterdir():
        item_type = "directory" if item.is_dir() else "file"
        contents.append({
            "name": item.name,
            "path": str(item.absolute()),
            "type": item_type
        })
    return contents
```

- [ ] **Step 4: Add FastAPI endpoint to `backend/main.py` to expose directory listing**

```python
# backend/main.py (add after other imports, before app = FastAPI())
from backend.file_system_api import list_directory_contents
from pydantic import BaseModel

class FileSystemPath(BaseModel):
    path: str

@app.post("/api/fs/list")
async def list_fs_contents(fs_path: FileSystemPath):
    return {"contents": list_directory_contents(fs_path.path)}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/backend/test_file_system_api.py`
Expected: PASS

- [ ] **Step 6: Write a failing test for handling non-existent paths or non-directories**

```python
# tests/backend/test_file_system_api.py (append to existing tests)
def test_list_directory_non_existent():
    response = client.post("/api/fs/list", json={"path": "/non_existent_path_12345"})
    assert response.status_code == 200
    assert response.json()["contents"] == []

def test_list_directory_is_file():
    # Assuming there's a file at the root, e.g., /etc/hosts on Linux
    # This test might need adjustment based on the OS where it's run
    response = client.post("/api/fs/list", json={"path": "/etc/hosts"})
    assert response.status_code == 200
    assert response.json()["contents"] == [] # Should return empty if it's a file
```

- [ ] **Step 7: Run test to verify it fails (or passes if initial implementation already handles it)**

Run: `pytest tests/backend/test_file_system_api.py`
Expected: FAIL if the current implementation returns an error or non-empty for files. PASS if it already handles these cases gracefully.

- [ ] **Step 8: Implement robust error handling and path validation in `list_directory_contents`**

```python
# backend/file_system_api.py (update list_directory_contents)
import os
from pathlib import Path
from typing import List, Dict

def list_directory_contents(path: str) -> List[Dict]:
    """
    Lists the contents of a given directory path.
    Each item in the list is a dictionary with 'name', 'path', and 'type' (file/directory).
    Handles non-existent paths and files gracefully.
    """
    base_path = Path(path)

    # Resolve to an absolute path and check if it exists and is a directory
    try:
        absolute_path = base_path.resolve()
    except OSError: # Catch issues with path resolution (e.g., broken symlinks)
        return []

    if not absolute_path.exists() or not absolute_path.is_dir():
        return []

    contents = []
    # Using scandir for potentially better performance than iterdir for large directories
    with os.scandir(absolute_path) as entries:
        for entry in entries:
            try:
                item_type = "directory" if entry.is_dir() else "file"
                contents.append({
                    "name": entry.name,
                    "path": str(Path(entry.path).absolute()), # Ensure absolute path for consistency
                    "type": item_type
                })
            except OSError:
                # Handle cases where an entry might be inaccessible or broken (e.g., broken symlink)
                continue
    
    # Sort for consistent display, directories first, then files, then alphabetically
    contents.sort(key=lambda x: (x['type'] == 'file', x['name'].lower()))
    return contents
```

- [ ] **Step 9: Run test to verify it passes**

Run: `pytest tests/backend/test_file_system_api.py`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add backend/file_system_api.py backend/main.py tests/backend/test_file_system_api.py
git commit -m "feat(backend): Add file system API for directory listing"
```

---

### Task 2: Frontend File Browser Component

**Goal:** Develop a reusable React component for navigating the file system, utilizing the new backend API.

**Files:**
- Create: `frontend/src/components/FileBrowser.tsx`
- Create: `frontend/src/components/FileBrowser.module.css` (for styling)
- Test: (This will be an integration test within a parent component later)

- [ ] **Step 1: Create `FileBrowser.tsx` skeleton and basic UI**

```typescript
// frontend/src/components/FileBrowser.tsx
import React, { useState, useEffect } from 'react';
import styles from './FileBrowser.module.css';

interface FileSystemEntry {
    name: string;
    path: string;
    type: 'file' | 'directory';
}

interface FileBrowserProps {
    initialPath?: string;
    onSelectPath: (path: string) => void;
    allowFileSelection?: boolean; // New prop to control file selection
}

const FileBrowser: React.FC<FileBrowserProps> = ({ initialPath = '/', onSelectPath, allowFileSelection = false }) => {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [contents, setContents] = useState<FileSystemEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContents = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/fs/list', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: currentPath }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setContents(data.contents);
            } catch (e: any) {
                setError(`Failed to fetch directory contents: ${e.message}`);
                setContents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchContents();
    }, [currentPath]);

    const navigateTo = (path: string) => {
        setCurrentPath(path);
    };

    const goUp = () => {
        const parentPath = Path(currentPath).parent.toString(); // Use a proper path manipulation library or implement
        if (parentPath !== currentPath) {
            navigateTo(parentPath);
        }
    };

    const handleItemClick = (entry: FileSystemEntry) => {
        if (entry.type === 'directory') {
            navigateTo(entry.path);
        } else if (allowFileSelection) {
            onSelectPath(entry.path);
        }
    };

    const handleSelectCurrentDirectory = () => {
        onSelectPath(currentPath);
    };

    // Simple path manipulation for now, will replace with proper library or better implementation later
    const Path = (p: string) => {
        const parts = p.split('/').filter(part => part !== '');
        return {
            parent: parts.length > 0 ? '/' + parts.slice(0, -1).join('/') : '/',
            toString: () => p
        };
    };


    return (
        <div className={styles.fileBrowser}>
            <div className={styles.pathBar}>
                <button onClick={goUp} disabled={currentPath === '/'}>Up</button>
                <span>Current Path: {currentPath}</span>
                <button onClick={handleSelectCurrentDirectory}>Select Current Directory</button>
            </div>
            {loading && <div className={styles.loading}>Loading...</div>}
            {error && <div className={styles.error}>{error}</div>}
            <ul className={styles.fileList}>
                {contents.map((entry) => (
                    <li key={entry.path} onClick={() => handleItemClick(entry)} className={styles[entry.type]}>
                        {entry.name} {entry.type === 'directory' && '/'}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileBrowser;
```

- [ ] **Step 2: Create `FileBrowser.module.css` for basic styling**

```css
/* frontend/src/components/FileBrowser.module.css */
.fileBrowser {
    border: 1px solid #ccc;
    padding: 10px;
    height: 400px; /* Example height */
    overflow-y: auto;
    background-color: #f9f9f9;
}

.pathBar {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
}

.pathBar button {
    padding: 5px 10px;
    cursor: pointer;
}

.fileList {
    list-style: none;
    padding: 0;
    margin: 0;
}

.fileList li {
    padding: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
}

.fileList li:hover {
    background-color: #e0e0e0;
}

.directory {
    font-weight: bold;
    color: #0056b3;
}

.file {
    color: #333;
}

.loading, .error {
    text-align: center;
    padding: 20px;
    color: #d32f2f;
}
```

- [ ] **Step 3: Temporarily integrate `FileBrowser` into `App.tsx` to verify functionality**

```typescript
// frontend/src/App.tsx (modify)
import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TabContainer from './components/TabContainer';
import UtilityPane from './components/UtilityPane';
import FileBrowser from './components/FileBrowser'; // Import FileBrowser

function App() {
  const [selectedPath, setSelectedPath] = useState<string>('');

  const handlePathSelected = (path: string) => {
    console.log("Selected path:", path);
    setSelectedPath(path);
    // In a real scenario, you might close the browser or do something with the path
  };

  return (
    <div className="App">
      <Sidebar />
      <div className="main-content">
        <TabContainer />
        <UtilityPane />
        {/* Temporarily render FileBrowser for testing */}
        <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
          <h2>File Browser Test</h2>
          <p>Selected: {selectedPath}</p>
          <FileBrowser onSelectPath={handlePathSelected} initialPath="/" />
        </div>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Run the frontend development server and verify the file browser works as expected**

Run:
```bash
cd frontend
npm install # if not already done
npm run dev
```
Expected: The browser should open, and a file browser component should be visible, allowing navigation through the file system, selecting directories, and displaying contents.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/FileBrowser.tsx frontend/src/components/FileBrowser.module.css frontend/src/App.tsx
git commit -m "feat(frontend): Implement basic FileBrowser component and integrate for testing"
```

---

### Task 3: Modal Component Implementation

**Goal:** Create a generic, reusable React modal component that can display arbitrary content, fulfilling the user's requirement for a modal "that opens in the center of the screen".

**Files:**
- Create: `frontend/src/components/Modal.tsx`
- Create: `frontend/src/components/Modal.module.css` (for styling)
- Modify: `frontend/src/App.tsx` (temporarily for testing)

- [ ] **Step 1: Create `Modal.tsx` skeleton and basic UI**

```typescript
// frontend/src/components/Modal.tsx
import React from 'react';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
```

- [ ] **Step 2: Create `Modal.module.css` for styling**

```css
/* frontend/src/components/Modal.module.css */
.modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Ensure modal is on top */
}

.modalContent {
    background: white;
    padding: 20px;
    border-radius: 8px;
    min-width: 500px;
    max-width: 80%;
    max-height: 80%;
    overflow: auto;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    position: relative;
}

.modalHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

.modalHeader h2 {
    margin: 0;
    font-size: 1.5em;
}

.closeButton {
    background: none;
    border: none;
    font-size: 1.8em;
    cursor: pointer;
    color: #333;
}

.closeButton:hover {
    color: #000;
}

.modalBody {
    /* Content styling */
}
```

- [ ] **Step 3: Temporarily integrate `Modal` into `App.tsx` to verify functionality**

```typescript
// frontend/src/App.tsx (modify)
import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TabContainer from './components/TabContainer';
import UtilityPane from './components/UtilityPane';
import FileBrowser from './components/FileBrowser';
import Modal from './components/Modal'; // Import Modal

function App() {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal

  const handlePathSelected = (path: string) => {
    console.log("Selected path:", path);
    setSelectedPath(path);
    // In a real scenario, you might close the browser or do something with the path
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="App">
      <Sidebar />
      <div className="main-content">
        <TabContainer />
        <UtilityPane />
        {/* Temporarily render FileBrowser for testing */}
        <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
          <h2>File Browser Test</h2>
          <p>Selected: {selectedPath}</p>
          <FileBrowser onSelectPath={handlePathSelected} initialPath="/" />
        </div>

        {/* Modal Test Area */}
        <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
          <h2>Modal Test</h2>
          <button onClick={openModal}>Open Test Modal</button>
          <Modal isOpen={isModalOpen} onClose={closeModal} title="Test Modal">
            <p>This is some content inside the modal. The selected path is: <strong>{selectedPath}</strong></p>
            {/* Optionally put FileBrowser here for early testing */}
            <FileBrowser onSelectPath={handlePathSelected} initialPath={selectedPath || '/'} />
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Run the frontend development server and verify the modal opens and closes correctly, displaying its content.**

Run:
```bash
cd frontend
npm run dev
```
Expected: The browser should open. Clicking "Open Test Modal" should display a modal in the center of the screen, containing the provided text and potentially the file browser if you uncommented it. Clicking the "X" or outside the modal should close it.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Modal.tsx frontend/src/components/Modal.module.css frontend/src/App.tsx
git commit -m "feat(frontend): Implement generic Modal component and integrate for testing"
```

---

### Task 4: Integrate File Browser into Modal for Repo Addition

**Goal:** Replace the existing sidebar-bound repo addition UI with the new generic Modal component containing the FileBrowser for selecting repository paths.

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/App.tsx` (remove temporary FileBrowser and Modal integration)

- [ ] **Step 1: Refactor `Sidebar.tsx` to include state for modal visibility and selected path**

```typescript
// frontend/src/components/Sidebar.tsx (modify)
import React, { useState } from 'react';
import './Sidebar.css';
import Modal from './Modal'; // Assuming Modal is in the same components directory or accessible
import FileBrowser from './FileBrowser'; // Assuming FileBrowser is in the same components directory or accessible

interface SidebarProps {
  // Define any props if needed
}

const Sidebar: React.FC<SidebarProps> = () => {
  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState(false);
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>('');

  const openAddRepoModal = () => setIsAddRepoModalOpen(true);
  const closeAddRepoModal = () => setIsAddRepoModalOpen(false);

  const handleRepoPathSelect = (path: string) => {
    setSelectedRepoPath(path);
    // Potentially close modal immediately or confirm selection
    // For now, let's keep it open to allow user to confirm with a separate button
  };

  const handleAddRepoConfirm = () => {
    if (selectedRepoPath) {
      console.log("Adding repository:", selectedRepoPath);
      // Here you would call your backend API to add the repository
      // e.g., fetch('/api/repos', { method: 'POST', body: JSON.stringify({ path: selectedRepoPath }) });
      closeAddRepoModal();
      setSelectedRepoPath(''); // Clear selected path
    } else {
      alert("Please select a repository path.");
    }
  };

  return (
    <div className="sidebar">
      {/* Existing sidebar content */}
      <div className="sidebar-section">
        <h3>Repositories</h3>
        {/* Placeholder for existing repo list */}
        <p>List of Repositories...</p>
        <button onClick={openAddRepoModal}>Add Repository</button>
      </div>

      <Modal
        isOpen={isAddRepoModalOpen}
        onClose={closeAddRepoModal}
        title="Add New Repository"
      >
        <div>
          <p>Select the root directory of your Git repository:</p>
          <div style={{ height: '300px', marginBottom: '15px' }}>
            <FileBrowser onSelectPath={handleRepoPathSelect} initialPath={selectedRepoPath || '/'} />
          </div>
          <p>Selected path: <strong>{selectedRepoPath || 'None'}</strong></p>
          <div className="modal-actions">
            <button onClick={handleAddRepoConfirm} disabled={!selectedRepoPath}>Confirm Add Repository</button>
            <button onClick={closeAddRepoModal}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;
```

- [ ] **Step 2: Remove temporary `FileBrowser` and `Modal` integration from `App.tsx`**

```typescript
// frontend/src/App.tsx (modify)
import React from 'react'; // Removed useState
import './App.css';
import Sidebar from './components/Sidebar';
import TabContainer from './components/TabContainer';
import UtilityPane from './components/UtilityPane';
// Removed FileBrowser and Modal imports

function App() {
  // Removed selectedPath and isModalOpen states, and open/closeModal, handlePathSelected functions

  return (
    <div className="App">
      <Sidebar />
      <div className="main-content">
        <TabContainer />
        <UtilityPane />
        {/* Removed FileBrowser Test area */}
        {/* Removed Modal Test area */}
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Run the frontend development server and verify the new workflow for adding a repository.**

Run:
```bash
cd frontend
npm run dev
```
Expected: The "Add Repository" button in the sidebar should now open the modal with the file browser. Users should be able to navigate the file system and select a directory, which then populates the "Selected path" display within the modal. Clicking "Confirm Add Repository" should log the path (for now) and close the modal.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Sidebar.tsx frontend/src/App.tsx
git commit -m "feat(frontend): Integrate FileBrowser into Modal for repository addition"
```

---

### Task 5: Refine Repo Addition Logic

**Goal:** Connect the modal's selected path to the backend's repository management API, and enhance the UI feedback.

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `backend/main.py` (assuming repo add endpoint is here)
- Modify: `backend/store.py` (if the repo add logic needs adjustment)

- [ ] **Step 1: Update `Sidebar.tsx` to send selected path to backend API**

```typescript
// frontend/src/components/Sidebar.tsx (modify handleAddRepoConfirm)
import React, { useState, useEffect } from 'react'; // Added useEffect
import './Sidebar.css';
import Modal from './Modal';
import FileBrowser from './FileBrowser';

interface Repository {
  id: string;
  path: string;
  name: string;
}

const Sidebar: React.FC = () => {
  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState(false);
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>('');
  const [repositories, setRepositories] = useState<Repository[]>([]); // State to hold repositories

  // Fetch existing repositories on load
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const response = await fetch('/api/repos'); // Assuming an endpoint to list repos
        if (!response.ok) throw new Error('Failed to fetch repositories');
        const data = await response.json();
        setRepositories(data.repositories || []);
      } catch (error) {
        console.error("Error fetching repositories:", error);
      }
    };
    fetchRepositories();
  }, []);

  const openAddRepoModal = () => setIsAddRepoModalOpen(true);
  const closeAddRepoModal = () => {
    setIsAddRepoModalOpen(false);
    setSelectedRepoPath(''); // Clear path on close
  };

  const handleRepoPathSelect = (path: string) => {
    setSelectedRepoPath(path);
  };

  const handleAddRepoConfirm = async () => {
    if (selectedRepoPath) {
      try {
        const response = await fetch('/api/repos', { // Assuming /api/repos is the add endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: selectedRepoPath }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Failed to add repository: ${response.status}`);
        }
        const newRepo = await response.json(); // Assuming backend returns the new repo
        setRepositories(prev => [...prev, newRepo]); // Add new repo to state
        closeAddRepoModal();
      } catch (error: any) {
        alert(`Error adding repository: ${error.message}`);
        console.error("Error adding repository:", error);
      }
    } else {
      alert("Please select a repository path.");
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>Repositories</h3>
        <ul>
          {repositories.length > 0 ? (
            repositories.map(repo => (
              <li key={repo.id}>{repo.name} ({repo.path})</li>
            ))
          ) : (
            <li>No repositories added yet.</li>
          )}
        </ul>
        <button onClick={openAddRepoModal}>Add Repository</button>
      </div>

      <Modal
        isOpen={isAddRepoModalOpen}
        onClose={closeAddRepoModal}
        title="Add New Repository"
      >
        <div>
          <p>Select the root directory of your Git repository:</p>
          <div style={{ height: '300px', marginBottom: '15px' }}>
            <FileBrowser onSelectPath={handleRepoPathSelect} initialPath={selectedRepoPath || '/'} />
          </div>
          <p>Selected path: <strong>{selectedRepoPath || 'None'}</strong></p>
          <div className="modal-actions">
            <button onClick={handleAddRepoConfirm} disabled={!selectedRepoPath}>Confirm Add Repository</button>
            <button onClick={closeAddRepoModal}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;
```

- [ ] **Step 2: Ensure `backend/main.py` has a `POST /api/repos` endpoint and `GET /api/repos` endpoint for listing**

```python
# backend/main.py (assuming store.py handles the actual storage)
from backend.store import get_repositories, add_repository # Assuming these functions exist
from pydantic import BaseModel
from typing import List, Dict

class RepositoryCreate(BaseModel):
    path: str

class Repository(BaseModel):
    id: str
    path: str
    name: str # Assuming a name is derived or provided

@app.post("/api/repos", response_model=Repository)
async def create_repository(repo: RepositoryCreate):
    # In a real scenario, you'd validate the path, check if it's a git repo,
    # and generate a unique ID and possibly a name.
    # For now, a simplified version:
    new_repo = add_repository(repo.path) # This function would be in store.py
    return new_repo

@app.get("/api/repos", response_model=List[Repository])
async def list_repositories():
    return get_repositories() # This function would be in store.py
```

- [ ] **Step 3: Update `backend/store.py` to handle `add_repository` and `get_repositories`**

```python
# backend/store.py (simplified example, assuming JSON file storage)
import json
from pathlib import Path
import uuid

REPO_FILE = Path("./repositories.json")

def _read_repos():
    if not REPO_FILE.exists():
        return []
    return json.loads(REPO_FILE.read_text())

def _write_repos(repos):
    REPO_FILE.write_text(json.dumps(repos, indent=2))

def get_repositories():
    return _read_repos()

def add_repository(path: str):
    repos = _read_repos()
    # Basic validation: check if path already exists
    if any(repo['path'] == path for repo in repos):
        raise ValueError("Repository path already exists.")

    new_repo = {
        "id": str(uuid.uuid4()),
        "path": path,
        "name": Path(path).name # Simple name from path
    }
    repos.append(new_repo)
    _write_repos(repos)
    return new_repo
```

- [ ] **Step 4: Run the frontend and backend development servers, and verify repository addition works end-to-end.**

Run:
Backend:
```bash
cd backend
uvicorn main:app --reload
```
Frontend:
```bash
cd frontend
npm run dev
```
Expected:
1.  Frontend loads with "No repositories added yet."
2.  Click "Add Repository", modal opens.
3.  Browse and select a directory.
4.  Click "Confirm Add Repository".
5.  Modal closes, and the newly added repository appears in the sidebar list.
6.  The `repositories.json` file should be created/updated with the new repo entry.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Sidebar.tsx backend/main.py backend/store.py
git commit -m "feat(repo-management): Connect frontend modal to backend repo API, implement basic repo listing and adding"
```

---

### Task 6: Remove Old UI

**Goal:** Remove the previous, unsatisfactory UI elements related to adding repositories from the sidebar, ensuring a clean transition to the new modal-based approach.

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx` (remove any remnants of the old repo addition UI, if not already handled)
- Modify: `frontend/src/App.tsx` (ensure no old test components are present)

- [ ] **Step 1: Review `Sidebar.tsx` and remove any legacy repo addition input fields or buttons.**

```typescript
// frontend/src/components/Sidebar.tsx (review and clean up, ensuring only the new "Add Repository" button remains)
// This step is more about verification and cleanup after Task 4 and 5.
// Ensure no redundant elements or logic from the old "sucky" UI remain.
```

- [ ] **Step 2: Review `App.tsx` to confirm all temporary `FileBrowser` and `Modal` test integrations are removed.**

```typescript
// frontend/src/App.tsx (verify clean state)
// Ensure the div with "File Browser Test" and "Modal Test" is completely removed.
// It should only contain the main layout structure.
```

- [ ] **Step 3: Run the frontend development server and visually inspect that only the new "Add Repository" button and modal workflow are present.**

Run:
```bash
cd frontend
npm run dev
```
Expected: The frontend should load without any leftover elements from the old repo addition UI or the temporary test components. The "Add Repository" button in the sidebar should be the sole entry point for adding repos, triggering the new modal.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Sidebar.tsx frontend/src/App.tsx
git commit -m "refactor(frontend): Remove deprecated repository addition UI elements"
```
