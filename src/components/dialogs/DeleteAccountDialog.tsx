import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userId: string;
}

export function DeleteAccountDialog({ open, onOpenChange, userEmail, userId }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const expectedText = "HAPUS AKUN SAYA";
  const isConfirmTextValid = confirmText === expectedText;

  const handleDeleteAccount = async () => {
    if (!isConfirmTextValid) return;

    setLoading(true);
    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({
        title: "Akun berhasil dihapus",
        description: "Akun Anda telah dihapus secara permanen.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.replace('/');
    } catch (error: any) {
      toast({
        title: "Gagal menghapus akun",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setConfirmText("");
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hapus Akun Permanen
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              <strong>Peringatan:</strong> Tindakan ini akan menghapus akun Anda secara permanen dan tidak dapat dibatalkan.
            </p>
            <p>
              Semua data Anda termasuk profil, riwayat tiket, dan pengaturan akan dihapus.
            </p>
            <p>
              Email akun: <strong>{userEmail}</strong>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmText">
              Untuk konfirmasi, ketik: <strong className="text-destructive">{expectedText}</strong>
            </Label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedText}
              className="border-destructive/50 focus:border-destructive"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isConfirmTextValid || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus Akun Permanen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}