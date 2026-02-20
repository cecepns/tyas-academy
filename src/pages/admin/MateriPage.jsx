import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";
import { useToast } from "../../components/common/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const materiTypeOptions = [
  { value: "video_link", label: "Video Link" },
  { value: "pdf_file", label: "PDF File" },
];

const MateriPage = () => {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [pdfFiles, setPdfFiles] = useState({});

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      judul_materi: "",
      slug: "",
      deskripsi: "",
      konten_materi: [],
    },
  });

  const konten = watch("konten_materi");
  const limit = 10;

  const [bannerPreview, setBannerPreview] = useState(null);
  const fileBase = useMemo(() => getFileBase(), []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/materi", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      show("error", "Gagal memuat materi");
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
    setBannerFile(null);
    setBannerPreview(null);
    setPdfFiles({});
    reset({
      judul_materi: "",
      slug: "",
      deskripsi: "",
      konten_materi: [],
    });
    setOpenForm(true);
  };

  const onEdit = async (id) => {
    try {
      const res = await api.get(`/admin/materi/${id}`);
      const data = res.data;
      setEditingId(id);
      setBannerFile(null);
      setBannerPreview(data.banner_image || null);
      setPdfFiles({});
      reset({
        judul_materi: data.judul_materi,
        slug: data.slug,
        deskripsi: data.deskripsi || "",
        konten_materi:
          data.konten?.map((k) => ({
            tipe_materi: k.tipe_materi,
            video_link: k.video_link || "",
            pdf_label: k.pdf_file ? "File sudah terupload" : "",
            client_key: "",
          })) || [],
      });
      setOpenForm(true);
    } catch {
      show("error", "Gagal mengambil detail materi");
    }
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("judul_materi", values.judul_materi);
      if (values.slug) formData.append("slug", values.slug);
      formData.append("deskripsi", values.deskripsi || "");

      const kontenPayload = (values.konten_materi || []).map((k, idx) => {
        const base = { tipe_materi: k.tipe_materi };
        if (k.tipe_materi === "video_link") {
          base.video_link = k.video_link;
        } else if (k.tipe_materi === "pdf_file") {
          const file = pdfFiles[idx];
          if (file) {
            base.client_key = file.name;
            formData.append("pdf_files", file, file.name);
          }
        }
        return base;
      });

      formData.append("konten_materi", JSON.stringify(kontenPayload));
      if (bannerFile) {
        formData.append("banner_image", bannerFile);
      }

      if (editingId) {
        await api.put(`/admin/materi/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Materi diperbarui");
      } else {
        await api.post("/admin/materi", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Materi ditambahkan");
      }
      // reset form & tutup modal
      setEditingId(null);
      setBannerFile(null);
      setBannerPreview(null);
      setPdfFiles({});
      reset({
        judul_materi: "",
        slug: "",
        deskripsi: "",
        konten_materi: [],
      });
      setOpenForm(false);
      load();
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal menyimpan materi");
    }
  };

  const addKonten = () => {
    setValue("konten_materi", [
      ...(konten || []),
      { tipe_materi: "video_link", video_link: "", pdf_label: "", client_key: "" },
    ]);
  };

  const updateKonten = (index, field, value) => {
    const updated = [...(konten || [])];
    updated[index] = { ...updated[index], [field]: value };
    setValue("konten_materi", updated);
  };

  const handlePdfChange = (index, file) => {
    setPdfFiles((prev) => ({ ...prev, [index]: file || undefined }));
    if (file) {
      updateKonten(index, "pdf_label", file.name);
    } else {
      updateKonten(index, "pdf_label", "");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/materi/${deleteId}`);
      show("success", "Materi dihapus");
      setDeleteId(null);
      load();
    } catch {
      show("error", "Gagal menghapus materi");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Manajemen Materi
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Kelola judul, deskripsi, banner, dan konten materi (video / PDF).
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-2 rounded bg-primary-600 text-white text-xs hover:bg-primary-700"
        >
          <Plus className="w-3 h-3" />
          Materi Baru
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
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
          <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Judul
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Dibuat
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
                  <td className="px-4 py-3">{item.judul_materi}</td>
                  <td className="px-3 py-2 text-slate-500">{item.slug}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.created_at?.slice(0, 10)}
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
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl border border-slate-100 p-5 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                {editingId ? "Edit Materi" : "Tambah Materi"}
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
                    Judul Materi
                  </label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("judul_materi", {
                      required: "Judul wajib diisi",
                    })}
                  />
                  {errors.judul_materi && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.judul_materi.message}
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
                    Deskripsi Materi
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("deskripsi")}
                  />
                </div>
                <div>
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
                      alt="Banner materi"
                      className="mt-2 h-20 rounded border border-slate-100 object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-800">Konten Materi</p>
                  <button
                    type="button"
                    onClick={addKonten}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah Konten
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Setiap baris bisa berupa video link atau file PDF.
                </p>
                <div className="space-y-3">
                  {(konten || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-100 rounded-md p-3 bg-slate-50"
                    >
                      <div className="grid md:grid-cols-3 gap-2 items-start">
                        <div>
                          <label className="block mb-1 text-slate-700">
                            Tipe Materi
                          </label>
                          <Controller
                            name={`konten_materi.${idx}.tipe_materi`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                options={materiTypeOptions}
                                classNamePrefix="rs"
                                onChange={(opt) =>
                                  field.onChange(opt?.value || "video_link")
                                }
                                value={materiTypeOptions.find(
                                  (o) => o.value === field.value
                                )}
                              />
                            )}
                          />
                        </div>
                        {item.tipe_materi === "video_link" && (
                          <div className="md:col-span-2">
                            <label className="block mb-1 text-slate-700">
                              URL Video
                            </label>
                            <input
                              className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              value={item.video_link || ""}
                              onChange={(e) =>
                                updateKonten(
                                  idx,
                                  "video_link",
                                  e.target.value
                                )
                              }
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              Contoh: link YouTube atau platform video lainnya.
                            </p>
                          </div>
                        )}
                        {item.tipe_materi === "pdf_file" && (
                          <div className="md:col-span-2">
                            <label className="block mb-1 text-slate-700">
                              File PDF
                            </label>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) =>
                                handlePdfChange(
                                  idx,
                                  e.target.files?.[0] || null
                                )
                              }
                              className="block w-full text-[11px] text-slate-500 file:mr-2 file:px-2 file:py-1.5 file:rounded file:border-0 file:bg-slate-100 file:text-slate-700"
                            />
                            {item.pdf_label && (
                              <p className="text-[11px] text-slate-500 mt-1">
                                Saat ini: {item.pdf_label}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Materi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Materi"
        description="Yakin ingin menghapus materi ini beserta kontennya?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default MateriPage;

