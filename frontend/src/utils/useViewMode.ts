// In frontend/src/utils/useViewMode.ts
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type ViewMode = 'tabs' | 'persona';

const useViewMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('viewMode') as ViewMode) || 'tabs';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
    const targetPath = viewMode === 'tabs' ? '/' : '/persona';
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [viewMode, navigate, location.pathname]);

  return [viewMode, setViewMode] as const;
};

export default useViewMode;
