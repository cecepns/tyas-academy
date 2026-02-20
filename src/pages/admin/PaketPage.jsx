import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";
import { useToast } from "../../components/common/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const PaketPage = () => {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [bimbelOptions, setBimbelOptions] = useState([]);
  const [materiOptions, setMateriOptions] = useState([]);
  const [tryoutOptions, setTryoutOptions] = useState([]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nama_paket: "",
      slug: "",
      harga: "",
      durasi_aktif: 0,
      fitur_paket: "",
      bimbel_ids: [],
      materi_ids: [],
      tryout_ids: [],
    },
  });

  const limit = 10;

  const fileBase = useMemo(() => getFileBase(), []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/paket", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      show("error", "Gagal memuat paket");
    } finally {
      setLoading(false);
    }
  };

  const loadRelations = async () => {
    try {
      const [bRes, mRes, tRes] = await Promise.all([
        api.get("/admin/bimbel", { params: { page: 1, limit: 1000 } }),
        api.get("/admin/materi", { params: { page: 1, limit: 1000 } }),
        api.get("/admin/tryout", { params: { page: 1, limit: 1000 } }),
      ]);
      setBimbelOptions(
        bRes.data.data.map((b) => ({
          value: b.id,
          label: b.judul_bimbel,
        }))
      );
      setMateriOptions(
        mRes.data.data.map((m) => ({
          value: m.id,
          label: m.judul_materi,
        }))
      );
      setTryoutOptions(
        tRes.data.data.map((t) => ({
          value: t.id,
          label: t.judul_tryout,
        }))
      );
    } catch {
      show("error", "Gagal memuat data relasi paket");
    }
  };

  useEffect(() => {
    loadRelations();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const onAdd = () => {
    setEditingId(null);
    setCoverFile(null);
    setCoverPreview(null);
    reset({
      nama_paket: "",
      slug: "",
      harga: "",
      durasi_aktif: 0,
      fitur_paket: "",
      bimbel_ids: [],
      materi_ids: [],
      tryout_ids: [],
    });
    setOpenForm(true);
  };

  const onEdit = async (id) => {
    try {
      const res = await api.get(`/admin/paket/${id}`);
      const data = res.data;
      setEditingId(id);
      setCoverFile(null);
      setCoverPreview(data.cover_image || null);
      reset({
        nama_paket: data.nama_paket,
        slug: data.slug,
        harga: data.harga,
        durasi_aktif: data.durasi_aktif,
        fitur_paket: data.fitur_paket || "",
        bimbel_ids: (data.bimbel || []).map((b) => b.id),
        materi_ids: (data.materi || []).map((m) => m.id),
        tryout_ids: (data.tryout || []).map((t) => t.id),
      });
      setOpenForm(true);
    } catch {
      show("error", "Gagal mengambil detail paket");
    }
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("nama_paket", values.nama_paket);
      if (values.slug) formData.append("slug", values.slug);
      formData.append("harga", String(values.harga));
      formData.append("durasi_aktif", String(values.durasi_aktif || 0));
      formData.append("fitur_paket", values.fitur_paket || "");
      formData.append("bimbel_ids", JSON.stringify(values.bimbel_ids || []));
      formData.append("materi_ids", JSON.stringify(values.materi_ids || []));
      formData.append("tryout_ids", JSON.stringify(values.tryout_ids || []));
      if (coverFile) formData.append("cover_image", coverFile);
      if (editingId) {
        await api.put(`/admin/paket/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Paket diperbarui");
      } else {
        await api.post("/admin/paket", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Paket ditambahkan");
      }
      // reset form & tutup modal
      setEditingId(null);
      setCoverFile(null);
      setCoverPreview(null);
      reset({
        nama_paket: "",
        slug: "",
        harga: "",
        durasi_aktif: 0,
        fitur_paket: "",
        bimbel_ids: [],
        materi_ids: [],
        tryout_ids: [],
      });
      setOpenForm(false);
      load();
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal menyimpan paket");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/paket/${deleteId}`);
      show("success", "Paket dihapus");
      setDeleteId(null);
      load();
    } catch {
      show("error", "Gagal menghapus paket");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Manajemen Paket
          </h1>
          <p className="text-xs text-slate-500">
            Atur paket bimbel, harga, durasi, fitur, dan konten (bimbel, materi, tryout).
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-2 rounded bg-primary-600 text-white text-xs hover:bg-primary-700"
        >
          <Plus className="w-3 h-3" />
          Paket Baru
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama paket / slug..."
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
          <table className="w-full min-w-[640px] text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">
                Nama Paket
              </th>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">
                Harga
              </th>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">
                Durasi Aktif (hari)
              </th>
              <th className="px-3 py-2 text-right text-slate-500 font-medium">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  Belum ada data.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-50">
                  <td className="px-3 py-2">{item.nama_paket}</td>
                  <td className="px-3 py-2 text-slate-500">
                    Rp {item.harga?.toLocaleString?.("id-ID") ?? item.harga}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.durasi_aktif}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onEdit(item.id)}
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

      <div className="flex items-center justify-between text-xs text-slate-500">
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
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl border border-slate-100 p-5 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                {editingId ? "Edit Paket" : "Tambah Paket"}
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Card 1: Informasi Paket */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-800 mb-1">
                  Informasi Paket
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-700">
                      Nama Paket
                    </label>
                    <input
                      className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      {...register("nama_paket", {
                        required: "Nama paket wajib diisi",
                      })}
                    />
                    {errors.nama_paket && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {errors.nama_paket.message}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      Slug akan digenerate otomatis dari nama jika dikosongkan.
                    </p>
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">
                      Slug (opsional)
                    </label>
                    <input
                      className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      {...register("slug")}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-700">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      {...register("harga", {
                        required: "Harga wajib diisi",
                      })}
                    />
                    {errors.harga && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {errors.harga.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">
                      Durasi Aktif (hari)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      {...register("durasi_aktif")}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Isi 0 jika akses selamanya.
                    </p>
                  </div>
                  <div>
                  <label className="block mb-1 text-slate-700">
                    Cover Image (opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setCoverFile(e.target.files?.[0] || null)
                    }
                    className="block w-full text-[11px] text-slate-500 file:mr-2 file:px-2 file:py-1.5 file:rounded file:border-0 file:bg-slate-100 file:text-slate-700"
                  />
                  {coverPreview && (
                    <img
                      src={`${fileBase}${coverPreview}`}
                      alt="Cover paket"
                      className="mt-2 h-20 rounded border border-slate-100 object-cover"
                    />
                  )}
                  </div>
                </div>
              </div>

              {/* Card 2: Fitur Paket */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-800 mb-1">
                  Fitur Paket
                </p>
                <p className="text-[11px] text-slate-500">
                  Tulis fitur paket dalam bentuk list (satu baris satu poin).
                </p>
                <textarea
                  rows={4}
                  className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder={"1. Akses selamanya\n2. Bisa dikerjakan berulang"}
                  {...register("fitur_paket")}
                />
              </div>

              {/* Card 3: Konten Paket */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-800 mb-1">
                  Konten Paket
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-700">
                      Bimbel (multiple)
                    </label>
                    <Controller
                      name="bimbel_ids"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={bimbelOptions}
                          classNamePrefix="rs"
                          placeholder="Pilih bimbel"
                          onChange={(opts) =>
                            field.onChange(opts.map((o) => o.value))
                          }
                          value={bimbelOptions.filter((o) =>
                            (field.value || []).includes(o.value)
                          )}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">
                      Materi (multiple)
                    </label>
                    <Controller
                      name="materi_ids"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={materiOptions}
                          classNamePrefix="rs"
                          placeholder="Pilih materi"
                          onChange={(opts) =>
                            field.onChange(opts.map((o) => o.value))
                          }
                          value={materiOptions.filter((o) =>
                            (field.value || []).includes(o.value)
                          )}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">
                      Tryout (multiple)
                    </label>
                    <Controller
                      name="tryout_ids"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={tryoutOptions}
                          classNamePrefix="rs"
                          placeholder="Pilih tryout"
                          onChange={(opts) =>
                            field.onChange(opts.map((o) => o.value))
                          }
                          value={tryoutOptions.filter((o) =>
                            (field.value || []).includes(o.value)
                          )}
                        />
                      )}
                    />
                  </div>
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Paket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Paket"
        description="Yakin ingin menghapus paket ini beserta relasinya?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default PaketPage;

