// frontend/src/components/FileBrowser.tsx
import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../utils/api';
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
                const response = await fetch(`${getBaseUrl()}/api/ls?path=${encodeURIComponent(currentPath)}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setContents(data.entries.map((entry: any) => ({
                    name: entry.name,
                    path: entry.path,
                    type: entry.is_dir ? 'directory' : 'file',
                })));
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
            onSelectPath(entry.path); // Implicitly select directory on navigation
        } else if (allowFileSelection) {
            onSelectPath(entry.path);
        }
    };

    // Remove handleSelectCurrentDirectory and the associated button, as selection is now implicit for directories.

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
