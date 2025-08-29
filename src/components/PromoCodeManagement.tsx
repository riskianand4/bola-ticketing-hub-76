import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Tag,
  Percent,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  promo_type: "ticket" | "merchandise" | "both";
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  promo_type: "ticket" | "merchandise" | "both";
  min_purchase_amount: number;
  max_discount_amount: number;
  usage_limit: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
}

const initialFormData: FormData = {
  code: "",
  name: "",
  description: "",
  discount_type: "percentage" as const,
  discount_value: 0,
  promo_type: "both" as const,
  min_purchase_amount: 0,
  max_discount_amount: 0,
  usage_limit: 0,
  is_active: true,
  valid_from: new Date().toISOString().slice(0, 16),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16),
};

export function PromoCodeManagement() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes((data as PromoCode[]) || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Gagal memuat kode promo");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const promoData = {
        ...formData,
        discount_value: Number(formData.discount_value),
        min_purchase_amount:
          formData.min_purchase_amount > 0
            ? Number(formData.min_purchase_amount)
            : null,
        max_discount_amount:
          formData.max_discount_amount > 0
            ? Number(formData.max_discount_amount)
            : null,
        usage_limit:
          formData.usage_limit > 0 ? Number(formData.usage_limit) : null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
      };

      if (editingPromo) {
        const { error } = await supabase
          .from("promo_codes")
          .update(promoData)
          .eq("id", editingPromo.id);

        if (error) throw error;
        toast.success("Kode promo berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("promo_codes")
          .insert([promoData]);

        if (error) throw error;
        toast.success("Kode promo berhasil dibuat");
      }

      setIsDialogOpen(false);
      setEditingPromo(null);
      setFormData(initialFormData);
      fetchPromoCodes();
    } catch (error) {
      console.error("Error saving promo code:", error);
      toast.error("Gagal menyimpan kode promo");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      promo_type: promo.promo_type,
      min_purchase_amount: promo.min_purchase_amount || 0,
      max_discount_amount: promo.max_discount_amount || 0,
      usage_limit: promo.usage_limit || 0,
      is_active: promo.is_active,
      valid_from: new Date(promo.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(promo.valid_until).toISOString().slice(0, 16),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kode promo ini?")) return;

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Kode promo berhasil dihapus");
      fetchPromoCodes();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Gagal menghapus kode promo");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(
        `Kode promo berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`
      );
      fetchPromoCodes();
    } catch (error) {
      console.error("Error updating promo status:", error);
      toast.error("Gagal mengubah status kode promo");
    }
  };

  const getDiscountDisplay = (type: string, value: number) => {
    return type === "percentage"
      ? `${value}%`
      : `Rp ${value.toLocaleString("id-ID")}`;
  };

  const getPromoTypeColor = (type: string) => {
    switch (type) {
      case "ticket":
        return "bg-blue-100 text-blue-800";
      case "merchandise":
        return "bg-green-100 text-green-800";
      case "both":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Memuat kode promo...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Manajemen Kode Promo</h2>
          <p className="text-muted-foreground">
            Kelola kode promo untuk tiket dan merchandise
          </p>
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              setEditingPromo(null);
              setFormData(initialFormData);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kode Promo
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? "Edit Kode Promo" : "Tambah Kode Promo"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Promo</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="DISKON50"
                  required
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Promo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Diskon Spesial 50%"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Deskripsi singkat tentang promo ini"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Jenis Diskon</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: "percentage" | "fixed_amount") =>
                    setFormData((prev) => ({ ...prev, discount_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="fixed_amount">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">Nilai Diskon</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  max={
                    formData.discount_type === "percentage" ? 100 : undefined
                  }
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discount_value: Number(e.target.value),
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo_type">Berlaku Untuk</Label>
                <Select
                  value={formData.promo_type}
                  onValueChange={(value: "ticket" | "merchandise" | "both") =>
                    setFormData((prev) => ({ ...prev, promo_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ticket">Tiket</SelectItem>
                    <SelectItem value="merchandise">Merchandise</SelectItem>
                    <SelectItem value="both">Tiket & Merchandise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_purchase">Min. Pembelian (Rp)</Label>
                <Input
                  id="min_purchase"
                  type="number"
                  min="0"
                  value={formData.min_purchase_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      min_purchase_amount: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_discount">Max. Diskon (Rp)</Label>
                <Input
                  id="max_discount"
                  type="number"
                  min="0"
                  value={formData.max_discount_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_discount_amount: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage_limit">Limit Penggunaan</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="0"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      usage_limit: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Berlaku Dari</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      valid_from: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Berlaku Sampai</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      valid_until: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : editingPromo ? "Perbarui" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Daftar Kode Promo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden lg:block overflow-x-auto ">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Kode</TableHead>
                  <TableHead className="min-w-[120px]">Nama</TableHead>
                  <TableHead className="min-w-[90px]">Tipe</TableHead>
                  <TableHead className="min-w-[80px]">Diskon</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">
                    Berlaku
                  </TableHead>
                  <TableHead className="min-w-[80px] hidden md:table-cell">
                    Penggunaan
                  </TableHead>
                  <TableHead className="min-w-[70px]">Status</TableHead>
                  <TableHead className="min-w-[80px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-bold">
                      <div className="max-w-[80px] truncate" title={promo.code}>
                        {promo.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[120px]">
                        <div
                          className="font-medium truncate"
                          title={promo.name}
                        >
                          {promo.name}
                        </div>
                        {promo.description && (
                          <div
                            className="text-sm text-muted-foreground truncate max-w-[120px]"
                            title={promo.description}
                          >
                            {promo.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getPromoTypeColor(
                          promo.promo_type
                        )} text-xs whitespace-nowrap`}
                      >
                        {promo.promo_type === "ticket"
                          ? "Tiket"
                          : promo.promo_type === "merchandise"
                          ? "Merchandise"
                          : "Semua"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 max-w-[80px]">
                        {promo.discount_type === "percentage" ? (
                          <Percent className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        ) : (
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        )}
                        <span className="truncate text-sm">
                          {getDiscountDisplay(
                            promo.discount_type,
                            promo.discount_value
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-xs sm:text-sm max-w-[100px]">
                        <div className="truncate">
                          {format(new Date(promo.valid_from), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                        <div className="text-muted-foreground truncate">
                          s/d{" "}
                          {format(new Date(promo.valid_until), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 max-w-[80px]">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="text-sm truncate">
                          {promo.used_count}
                          {promo.usage_limit && `/${promo.usage_limit}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={() =>
                          toggleStatus(promo.id, promo.is_active)
                        }
                        className="scale-75 sm:scale-100"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(promo)}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(promo.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0 sm:h-9 sm:w-9"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {promoCodes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm sm:text-base">
                  Belum ada kode promo. Tambah kode promo pertama Anda!
                </div>
              </div>
            )}
          </div>

          <div className="block sm:hidden mt-4">
            {promoCodes.map((promo) => (
              <div
                key={`mobile-${promo.id}`}
                className="border rounded-lg p-3 mb-3 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-mono font-bold text-sm truncate"
                      title={promo.code}
                    >
                      {promo.code}
                    </div>
                    <div
                      className="font-medium text-sm truncate"
                      title={promo.name}
                    >
                      {promo.name}
                    </div>
                  </div>
                  <Switch
                    checked={promo.is_active}
                    onCheckedChange={() =>
                      toggleStatus(promo.id, promo.is_active)
                    }
                    className="scale-75 ml-2"
                  />
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge
                    className={`${getPromoTypeColor(promo.promo_type)} text-xs`}
                  >
                    {promo.promo_type === "ticket"
                      ? "Tiket"
                      : promo.promo_type === "merchandise"
                      ? "Merchandise"
                      : "Semua"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {promo.discount_type === "percentage" ? (
                      <Percent className="h-3 w-3" />
                    ) : (
                      <DollarSign className="h-3 w-3" />
                    )}
                    <span>
                      {getDiscountDisplay(
                        promo.discount_type,
                        promo.discount_value
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {promo.used_count}
                      {promo.usage_limit && `/${promo.usage_limit}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(promo)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(promo.id)}
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
