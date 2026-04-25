import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, Home, Check } from 'lucide-react';
import { getBaseUrl } from '../utils/api';

interface FileSystemEntry {
    name: string;
    path: string;
    type: 'file' | 'directory';
}

interface FileBrowserProps {
    initialPath?: string;
    onSelectPath: (path: string) => void;
    onPathChange?: (path: string) => void;
    allowFileSelection?: boolean;
    title?: string;
    onClose?: () => void;
    showSelectButton?: boolean;
    showHeader?: boolean;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ 
    initialPath = '.', 
    onSelectPath, 
    onPathChange,
    allowFileSelection = false,
    title = "Select Directory",
    onClose,
    showSelectButton = true,
    showHeader = true
}) => {
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
                
                if (data.current_path) {
                    setCurrentPath(data.current_path);
                    if (onPathChange) onPathChange(data.current_path);
                }

                const entries = data.entries.map((entry: any) => ({
                    name: entry.name,
                    path: entry.path,
                    type: entry.is_dir ? 'directory' : 'file',
                }));

                setContents(entries);
                
                // If we got a real path back from the server (expanded ~), update our current path
                if (data.entries.length > 0 && !currentPath.startsWith('/') && data.entries[0].path.startsWith('/')) {
                   // This is a bit hacky, but if the first entry is absolute and we aren't, 
                   // we should probably be using absolute paths.
                   // However, /api/ls usually returns absolute paths for entries.
                }
            } catch (e: any) {
                setError(`Failed to fetch: ${e.message}`);
                setContents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchContents();
    }, [currentPath]);

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
    };

    const handleItemClick = (entry: FileSystemEntry) => {
        if (entry.type === 'directory') {
            handleNavigate(entry.path);
        } else if (allowFileSelection) {
            onSelectPath(entry.path);
            if (onClose) onClose();
        }
    };

    const handleSelectCurrent = () => {
        // We need to get the absolute path of the current directory.
        // The backend's /api/ls returns the parent path in the ".." entry if available.
        onSelectPath(currentPath);
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            {/* Header */}
            {showHeader && (
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-slate-200">{title}</span>
                    </div>
                    {showSelectButton && (
                        <button 
                            onClick={handleSelectCurrent}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Select Folder
                        </button>
                    )}
                </div>
            )}

            {/* Path Bar */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => handleNavigate('~')}
                    className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                    title="Home"
                >
                    <Home className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <span className="text-xs font-mono text-slate-400 whitespace-nowrap">{currentPath}</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-slate-950/20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <span className="text-xs font-medium">Scanning directory...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                            <ChevronRight className="w-6 h-6 text-red-500 rotate-90" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 mb-1">Navigation Failed</h4>
                        <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">{error}</p>
                        <button 
                            onClick={() => handleNavigate('.')}
                            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
                        >
                            Return to App Root
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-1">
                        {contents.map((entry) => (
                            <button
                                key={entry.path}
                                onClick={() => handleItemClick(entry)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 text-left group transition-all"
                            >
                                <div className={`p-1.5 rounded-md ${
                                    entry.type === 'directory' 
                                        ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' 
                                        : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {entry.type === 'directory' ? (
                                        <Folder className="w-4 h-4" />
                                    ) : (
                                        <File className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${
                                        entry.type === 'directory' ? 'font-medium text-slate-200' : 'text-slate-400'
                                    }`}>
                                        {entry.name}
                                    </p>
                                </div>
                                {entry.type === 'directory' && (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileBrowser;
