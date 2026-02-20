import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";
import { useToast } from "../../components/common/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const BimbelPage = () => {
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      judul_bimbel: "",
      slug: "",
      deskripsi: "",
      link_meeting: "",
      catatan_meeting: "",
    },
  });

  const limit = 10;

  const fileBase = useMemo(() => getFileBase(), []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/bimbel", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      show("error", "Gagal memuat bimbel");
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
    setCoverFile(null);
    setCoverPreview(null);
    reset({
      judul_bimbel: "",
      slug: "",
      deskripsi: "",
      link_meeting: "",
      catatan_meeting: "",
    });
    setOpenForm(true);
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    setCoverFile(null);
    setCoverPreview(item.cover_image || null);
    reset({
      judul_bimbel: item.judul_bimbel,
      slug: item.slug,
      deskripsi: item.deskripsi || "",
      link_meeting: item.link_meeting,
      catatan_meeting: item.catatan_meeting || "",
    });
    setOpenForm(true);
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("judul_bimbel", values.judul_bimbel);
      if (values.slug) formData.append("slug", values.slug);
      formData.append("deskripsi", values.deskripsi || "");
      formData.append("link_meeting", values.link_meeting);
      formData.append("catatan_meeting", values.catatan_meeting || "");
      if (coverFile) formData.append("cover_image", coverFile);
      if (editingId) {
        await api.put(`/admin/bimbel/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Bimbel diperbarui");
      } else {
        await api.post("/admin/bimbel", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Bimbel ditambahkan");
      }
      // reset form & tutup modal
      setEditingId(null);
      setCoverFile(null);
      setCoverPreview(null);
      reset({
        judul_bimbel: "",
        slug: "",
        deskripsi: "",
        link_meeting: "",
        catatan_meeting: "",
      });
      setOpenForm(false);
      load();
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal menyimpan bimbel");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/bimbel/${deleteId}`);
      show("success", "Bimbel dihapus");
      setDeleteId(null);
      load();
    } catch {
      show("error", "Gagal menghapus bimbel");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Manajemen Bimbel
          </h1>
          <p className="text-xs text-slate-500">
            Atur judul, slug, deskripsi, cover, link meeting, dan catatan.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-2 rounded bg-primary-600 text-white text-xs hover:bg-primary-700"
        >
          <Plus className="w-3 h-3" />
          Bimbel Baru
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
                Link Meeting
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
                  <td className="px-3 py-2">{item.judul_bimbel}</td>
                  <td className="px-3 py-2 text-slate-500">{item.slug}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.link_meeting}
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
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl border border-slate-100 p-5 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                {editingId ? "Edit Bimbel" : "Tambah Bimbel"}
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
                    Judul Bimbel
                  </label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("judul_bimbel", {
                      required: "Judul wajib diisi",
                    })}
                  />
                  {errors.judul_bimbel && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.judul_bimbel.message}
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
                    Deskripsi Bimbel
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("deskripsi")}
                  />
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
                      alt="Cover bimbel"
                      className="mt-2 h-20 rounded border border-slate-100 object-cover"
                    />
                  )}
                  <label className="block mt-3 mb-1 text-slate-700">
                    Link Meeting
                  </label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("link_meeting", {
                      required: "Link meeting wajib diisi",
                    })}
                  />
                  {errors.link_meeting && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.link_meeting.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">
                  Catatan Meeting
                </label>
                <textarea
                  rows={2}
                  className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  {...register("catatan_meeting")}
                />
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Bimbel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Bimbel"
        description="Yakin ingin menghapus bimbel ini?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default BimbelPage;

