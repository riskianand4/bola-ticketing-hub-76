import { useState } from 'react';
import { Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GlobalSearch } from '@/components/GlobalSearch';
import { GlobalSearchShortcut } from '@/components/GlobalSearchShortcut';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  className?: string;
  triggerClassName?: string;
  showShortcut?: boolean;
  iconOnly?: boolean;
}

export function SearchModal({ 
  className, 
  triggerClassName, 
  showShortcut = true,
  iconOnly = false
}: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        onClick={handleOpen}
        className={cn(
          iconOnly 
            ? "h-7 w-7 p-0" 
            : "w-full sm:w-80 justify-between text-muted-foreground hover:text-foreground",
          triggerClassName
        )}
      >
        {iconOnly ? (
          <Search className="h-4 w-4" />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Cari berita, pertandingan, pemain...</span>
              <span className="sm:hidden">Cari...</span>
            </div>
            {showShortcut && (
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground opacity-100">
                <Command className="h-3 w-3" />K
              </kbd>
            )}
          </>
        )}
      </Button>

      {/* Global Search Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn("max-w-2xl p-0", className)}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-left">Pencarian Global</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <GlobalSearch
              autoFocus
              onResultClick={handleClose}
              placeholder="Cari berita, pertandingan, pemain, merchandise..."
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts */}
      <GlobalSearchShortcut onSearchOpen={handleOpen} />
    </>
  );
}