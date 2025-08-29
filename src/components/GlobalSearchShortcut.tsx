import { useEffect } from 'react';

interface GlobalSearchShortcutProps {
  onSearchOpen: () => void;
}

export function GlobalSearchShortcut({ onSearchOpen }: GlobalSearchShortcutProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpen();
      }
      
      // ESC to close search (handled in GlobalSearch component)
      // Forward slash to open search
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault();
        onSearchOpen();
      }
    };

    const isInputFocused = () => {
      const activeElement = document.activeElement;
      return activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable')
      );
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearchOpen]);

  return null;
}