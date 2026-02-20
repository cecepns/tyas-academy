import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "../../utils/apiClient";
import { useToast } from "../../components/common/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const KodePromoPage = () => {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      kode_promo: "",
      tipe_diskon: "percent",
      nilai_diskon: "",
      expired_date: "",
      kuota: "",
      minimal_transaksi: "",
    },
  });

  const limit = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/kode-promo", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      show("error", "Gagal memuat kode promo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const onAdd = () => {
    setEditingId(null);
    reset({
      kode_promo: "",
      tipe_diskon: "percent",
      nilai_diskon: "",
      expired_date: "",
      kuota: "",
      minimal_transaksi: "",
    });
    setOpenForm(true);
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    reset({
      kode_promo: item.kode_promo,
      tipe_diskon: item.tipe_diskon,
      nilai_diskon: item.nilai_diskon,
      expired_date: item.expired_date?.slice(0, 10),
      kuota: item.kuota ?? "",
      minimal_transaksi: item.minimal_transaksi ?? "",
    });
    setOpenForm(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        kode_promo: values.kode_promo,
        tipe_diskon: values.tipe_diskon,
        nilai_diskon: Number(values.nilai_diskon),
        expired_date: values.expired_date,
        kuota: values.kuota ? Number(values.kuota) : 0,
        minimal_transaksi: values.minimal_transaksi
          ? Number(values.minimal_transaksi)
          : 0,
      };
      if (editingId) {
        await api.put(`/admin/kode-promo/${editingId}`, payload);
        show("success", "Kode promo diperbarui");
      } else {
        await api.post("/admin/kode-promo", payload);
        show("success", "Kode promo ditambahkan");
      }
      // reset form & tutup modal
      setEditingId(null);
      reset({
        kode_promo: "",
        tipe_diskon: "percent",
        nilai_diskon: "",
        expired_date: "",
        kuota: "",
        minimal_transaksi: "",
      });
      setOpenForm(false);
      load();
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal menyimpan kode promo");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/kode-promo/${deleteId}`);
      show("success", "Kode promo dihapus");
      setDeleteId(null);
      load();
    } catch {
      show("error", "Gagal menghapus kode promo");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Manajemen Kode Promo
          </h1>
          <p className="text-base text-slate-500 mt-1">
            Atur kode promo, jenis diskon, nilai, kuota, dan minimal transaksi.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-2 rounded bg-primary-600 text-white text-xs hover:bg-primary-700"
        >
          <Plus className="w-3 h-3" />
          Kode Promo Baru
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="relative w-full max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode promo..."
            className="w-full pl-6 pr-2 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <p className="text-slate-500">
          Total: <span className="font-semibold">{total}</span>
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Kode
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Tipe
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Nilai
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Expired
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Kuota
              </th>
              <th className="px-4 py-3 text-right text-slate-600 font-semibold">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  Belum ada data.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-50">
                  <td className="px-4 py-3">{item.kode_promo}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.tipe_diskon}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.tipe_diskon === "percent"
                      ? `${item.nilai_diskon}%`
                      : `Rp ${item.nilai_diskon?.toLocaleString?.("id-ID") ??
                          item.nilai_diskon
                        }`}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.expired_date?.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.kuota ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 mr-1"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded border border-red-100 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>
          Halaman {page} dari {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-2 py-1 rounded border border-slate-200 disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>

      {openForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl border border-slate-100 p-5 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                {editingId ? "Edit Kode Promo" : "Tambah Kode Promo"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpenForm(false);
                  setEditingId(null);
                }}
                className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px]"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">
                    Kode Promo
                  </label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    disabled={!!editingId}
                    {...register("kode_promo", {
                      required: "Kode wajib diisi",
                    })}
                  />
                  {errors.kode_promo && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.kode_promo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">
                    Tipe Diskon
                  </label>
                  <select
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("tipe_diskon")}
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">
                    Nilai Diskon
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("nilai_diskon", {
                      required: "Nilai diskon wajib diisi",
                    })}
                  />
                  {errors.nilai_diskon && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.nilai_diskon.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">
                    Expired Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("expired_date", {
                      required: "Expired date wajib diisi",
                    })}
                  />
                  {errors.expired_date && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.expired_date.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">
                    Kuota (opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("kuota")}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">
                    Minimal Transaksi (opsional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("minimal_transaksi")}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenForm(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Kode Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Kode Promo"
        description="Yakin ingin menghapus kode promo ini?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default KodePromoPage;

