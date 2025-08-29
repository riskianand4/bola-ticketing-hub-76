import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { 
  MoreHorizontal, 
  Trash2, 
  UserCheck, 
  UserX, 
  Search,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/utils/performance";

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  variant?: "default" | "destructive";
  action: (selectedItems: string[]) => Promise<void>;
}

interface BulkActionsBarProps<T> {
  selectedItems: string[];
  onClearSelection: () => void;
  items: T[];
  actions: BulkAction[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function BulkActionsBar<T extends { id: string }>({
  selectedItems,
  onClearSelection,
  items,
  actions,
  searchValue,
  onSearchChange,
  onRefresh,
  isLoading = false
}: BulkActionsBarProps<T>) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const debouncedSearchValue = useDebounce(searchValue, 300);

  useEffect(() => {
    onSearchChange(debouncedSearchValue);
  }, [debouncedSearchValue, onSearchChange]);

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedItems.length === 0) {
      toast.error("Pilih minimal satu item");
      return;
    }

    if (action.variant === "destructive") {
      setPendingAction(action);
      setShowConfirmDialog(true);
      return;
    }

    await executeBulkAction(action);
  };

  const executeBulkAction = async (action: BulkAction) => {
    setIsExecuting(true);
    try {
      await action.action(selectedItems);
      toast.success(`${action.label} berhasil untuk ${selectedItems.length} item`);
      onClearSelection();
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error(`Gagal melakukan ${action.label.toLowerCase()}`);
    } finally {
      setIsExecuting(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const exportToCSV = () => {
    const selectedData = items.filter(item => selectedItems.includes(item.id));
    const csvContent = [
      Object.keys(selectedData[0] || {}).join(","),
      ...selectedData.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Data berhasil diekspor");
  };

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            {/* Search */}
            <div className="flex-1">
              <SearchInput
                placeholder="Cari..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onClear={() => onSearchChange("")}
              />
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            {/* Selection Info */}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="secondary">
                  {selectedItems.length} dipilih
                </Badge>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onClearSelection}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={() => handleBulkAction(action)}
                  disabled={isExecuting}
                  className="flex items-center gap-2"
                >
                  <action.icon />
                  {action.label}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={isExecuting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Aksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin melakukan "{pendingAction?.label}" untuk {selectedItems.length} item terpilih?
              Aksi ini mungkin tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExecuting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingAction && executeBulkAction(pendingAction)}
              disabled={isExecuting}
              className={pendingAction?.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isExecuting ? "Memproses..." : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}