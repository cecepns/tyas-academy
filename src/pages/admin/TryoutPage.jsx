import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";
import { useToast } from "../../components/common/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const TryoutPage = () => {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [bankOptions, setBankOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      judul_tryout: "",
      slug: "",
      deskripsi: "",
      durasi: 60,
      soal_ids: [],
    },
  });

  const limit = 10;
  const fileBase = useMemo(() => getFileBase(), []);

  const loadBankSoal = async () => {
    try {
      const res = await api.get("/admin/bank-soal", {
        params: { page: 1, limit: 1000 },
      });
      setBankOptions(
        res.data.data.map((b) => {
          const plainText = String(b.soal || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const preview =
            plainText.length > 80 ? `${plainText.slice(0, 80)}...` : plainText;
          return {
            value: b.id,
            label: `${b.nama_tipe_soal || ""} – ${preview || "Soal #"+b.id}`,
          };
        })
      );
    } catch {
      show("error", "Gagal memuat bank soal");
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/tryout", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      show("error", "Gagal memuat tryout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankSoal();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const onAdd = () => {
    setEditingId(null);
    setBannerFile(null);
    setBannerPreview(null);
    reset({
      judul_tryout: "",
      slug: "",
      deskripsi: "",
      durasi: 60,
      soal_ids: [],
    });
    setOpenForm(true);
  };

  const onEdit = async (id) => {
    try {
      const res = await api.get(`/admin/tryout/${id}`);
      const data = res.data;
      setEditingId(id);
      setBannerFile(null);
      setBannerPreview(data.banner_image || null);
      reset({
        judul_tryout: data.judul_tryout,
        slug: data.slug,
        deskripsi: data.deskripsi || "",
        durasi: data.durasi,
        soal_ids: data.soal?.map((s) => s.bank_soal_id) || [],
      });
      setOpenForm(true);
    } catch {
      show("error", "Gagal mengambil detail tryout");
    }
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("judul_tryout", values.judul_tryout);
      if (values.slug) formData.append("slug", values.slug);
      formData.append("deskripsi", values.deskripsi || "");
      formData.append("durasi", String(values.durasi || 0));
      formData.append("soal_ids", JSON.stringify(values.soal_ids || []));
      if (bannerFile) formData.append("banner_image", bannerFile);
      if (editingId) {
        await api.put(`/admin/tryout/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Tryout diperbarui");
      } else {
        await api.post("/admin/tryout", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Tryout ditambahkan");
      }
      // reset form & tutup modal
      setEditingId(null);
      setBannerFile(null);
      setBannerPreview(null);
      reset({
        judul_tryout: "",
        slug: "",
        deskripsi: "",
        durasi: 60,
        soal_ids: [],
      });
      setOpenForm(false);
      load();
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal menyimpan tryout");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/tryout/${deleteId}`);
      show("success", "Tryout dihapus");
      setDeleteId(null);
      load();
    } catch {
      show("error", "Gagal menghapus tryout");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Manajemen Try Out
          </h1>
          <p className="text-xs text-slate-500">
            Atur judul, durasi, banner, dan daftar soal tryout.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-2 rounded bg-primary-600 text-white text-xs hover:bg-primary-700"
        >
          <Plus className="w-3 h-3" />
          Tryout Baru
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul / slug..."
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
                Judul
              </th>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">
                Slug
              </th>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">
                Durasi (menit)
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
                  <td className="px-3 py-2">{item.judul_tryout}</td>
                  <td className="px-3 py-2 text-slate-500">{item.slug}</td>
                  <td className="px-3 py-2 text-slate-500">{item.durasi}</td>
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
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-slate-100 p-5 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                {editingId ? "Edit Tryout" : "Tambah Tryout"}
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
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">
                    Judul Tryout
                  </label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("judul_tryout", {
                      required: "Judul wajib diisi",
                    })}
                  />
                  {errors.judul_tryout && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.judul_tryout.message}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Slug akan digenerate otomatis dari judul jika dikosongkan.
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
                <div className="md:col-span-2">
                  <label className="block mb-1 text-slate-700">
                    Deskripsi Tryout
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("deskripsi")}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">
                    Durasi (menit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("durasi", {
                      required: "Durasi wajib diisi",
                    })}
                  />
                  {errors.durasi && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.durasi.message}
                    </p>
                  )}
                  <div className="mt-3">
                    <label className="block mb-1 text-slate-700">
                      Banner Image (opsional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setBannerFile(e.target.files?.[0] || null)
                      }
                      className="block w-full text-[11px] text-slate-500 file:mr-2 file:px-2 file:py-1.5 file:rounded file:border-0 file:bg-slate-100 file:text-slate-700"
                    />
                    {bannerPreview && (
                      <img
                        src={`${fileBase}${bannerPreview}`}
                        alt="Banner tryout"
                        className="mt-2 h-20 rounded border border-slate-100 object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block mb-1 text-slate-700">
                  List Soal Tryout
                </label>
                <Controller
                  name="soal_ids"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isMulti
                      options={bankOptions}
                      placeholder="Pilih soal dari bank soal"
                      classNamePrefix="rs"
                      onChange={(opts) =>
                        field.onChange(opts.map((o) => o.value))
                      }
                      value={bankOptions.filter((o) =>
                        (field.value || []).includes(o.value)
                      )}
                    />
                  )}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Soal yang dipilih akan muncul saat user mengerjakan tryout
                  ini.
                </p>
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Tryout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Tryout"
        description="Yakin ingin menghapus tryout ini beserta daftar soalnya?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default TryoutPage;

