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