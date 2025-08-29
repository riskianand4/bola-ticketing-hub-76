import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function LoginDialog({ 
  open, 
  onOpenChange, 
  title = "Login Diperlukan",
  description = "Silakan login terlebih dahulu untuk melanjutkan."
}: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Link to="/login" className="w-full">
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          </Link>
          <Link to="/register" className="w-full">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Daftar Akun Baru
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}