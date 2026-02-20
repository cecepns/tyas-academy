import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import ReactQuill from "react-quill";
import Select from "react-select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "../../utils/apiClient";
import { useToast } from "../../components/common/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const defaultOpsi = [
  { label: "A", konten: "", skor: 0, benar: false },
  { label: "B", konten: "", skor: 0, benar: false },
];

const BankSoalPage = () => {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipeOptions, setTipeOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

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
      tipe_soal_id: null,
      soal: "",
      pembahasan: "",
      opsi: defaultOpsi,
    },
  });

  const opsi = watch("opsi");
  const limit = 10;

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
      ],
    }),
    []
  );

  const loadTipeSoal = async () => {
    try {
      const res = await api.get("/admin/tipe-soal/all");
      setTipeOptions(
        res.data.map((t) => ({ value: t.id, label: `${t.kode_soal} - ${t.nama_tipe_soal}` }))
      );
    } catch {
      show("error", "Gagal memuat tipe soal");
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/bank-soal", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      show("error", "Gagal memuat bank soal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTipeSoal();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const onAdd = () => {
    setEditingId(null);
    setImageFile(null);
    reset({
      tipe_soal_id: null,
      soal: "",
      pembahasan: "",
      opsi: defaultOpsi,
    });
    setOpenForm(true);
  };

  const onEdit = async (id) => {
    try {
      const res = await api.get(`/admin/bank-soal/${id}`);
      const data = res.data;
      setEditingId(id);
      setImageFile(null);
      reset({
        tipe_soal_id: data.tipe_soal_id,
        soal: data.soal,
        pembahasan: data.pembahasan || "",
        opsi:
          data.opsi?.map((o) => ({
            label: o.label,
            konten: o.konten,
            skor: o.skor,
            benar: !!o.benar,
          })) || defaultOpsi,
      });
      setOpenForm(true);
    } catch {
      show("error", "Gagal mengambil detail soal");
    }
  };

  const onSubmit = async (values) => {
    try {
      const jumlahBenar = values.opsi.filter((o) => o.benar).length;
      if (values.opsi.length < 2) {
        show("error", "Minimal 2 opsi jawaban");
        return;
      }
      if (jumlahBenar === 0) {
        show("error", "Pilih minimal satu jawaban yang benar");
        return;
      }
      const formData = new FormData();
      formData.append("tipe_soal_id", values.tipe_soal_id);
      formData.append("soal", values.soal);
      formData.append("pembahasan", values.pembahasan || "");
      formData.append(
        "opsi",
        JSON.stringify(
          values.opsi.map((o) => ({
            label: o.label,
            konten: o.konten,
            skor: Number(o.skor || 0),
            benar: !!o.benar,
          }))
        )
      );
      if (imageFile) {
        formData.append("image", imageFile);
      }
      if (editingId) {
        await api.put(`/admin/bank-soal/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Soal diperbarui");
      } else {
        await api.post("/admin/bank-soal", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        show("success", "Soal ditambahkan");
      }
      // reset form & tutup modal setelah simpan
      setEditingId(null);
      setImageFile(null);
      reset({
        tipe_soal_id: null,
        soal: "",
        pembahasan: "",
        opsi: defaultOpsi,
      });
      setOpenForm(false);
      load();
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal menyimpan soal");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/bank-soal/${deleteId}`);
      show("success", "Soal dihapus");
      setDeleteId(null);
      load();
    } catch {
      show("error", "Gagal menghapus soal");
    }
  };

  const updateOpsi = (index, field, value) => {
    const updated = [...opsi];
    updated[index] = { ...updated[index], [field]: value };
    setValue("opsi", updated);
  };

  const addOpsi = () => {
    const labels = ["A", "B", "C", "D", "E"];
    const used = opsi.map((o) => o.label);
    const next = labels.find((l) => !used.includes(l));
    if (!next) return;
    setValue("opsi", [...opsi, { label: next, konten: "", skor: 0, benar: false }]);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Manajemen Bank Soal
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Kelola soal, pembahasan, dan opsi jawaban.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-2 rounded bg-primary-600 text-white text-xs hover:bg-primary-700"
        >
          <Plus className="w-3 h-3" />
          Soal Baru
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="relative w-full max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari soal / tipe soal..."
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
                Tipe Soal
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Soal
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
                  <td className="px-4 py-3">{item.nama_tipe_soal}</td>
                  <td className="px-4 py-3">
                    <div
                      className="line-clamp-2 prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: item.soal }}
                    />
                  </td>
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
                {editingId ? "Edit Soal" : "Tambah Soal"}
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
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="text-xs space-y-3"
            >
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block mb-1 text-slate-700">Tipe Soal</label>
                  <Controller
                    name="tipe_soal_id"
                    control={control}
                    rules={{ required: "Tipe soal wajib dipilih" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={tipeOptions}
                        placeholder="Pilih tipe soal"
                        classNamePrefix="rs"
                        onChange={(opt) => field.onChange(opt?.value || null)}
                        value={
                          tipeOptions.find((o) => o.value === field.value) ||
                          null
                        }
                      />
                    )}
                  />
                  {errors.tipe_soal_id && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.tipe_soal_id.message}
                    </p>
                  )}
                  <div className="mt-3">
                    <label className="block mb-1 text-slate-700">
                      Gambar (opsional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] || null)
                      }
                      className="block w-full text-[11px] text-slate-500 file:mr-2 file:px-2 file:py-1.5 file:rounded file:border-0 file:bg-slate-100 file:text-slate-700"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Jika diisi, gambar akan di-upload ke server.
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="block mb-1 text-slate-700">Soal</label>
                    <Controller
                      name="soal"
                      control={control}
                      rules={{ required: "Soal wajib diisi" }}
                      render={({ field }) => (
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    value={field.value}
                    onChange={field.onChange}
                  />
                      )}
                    />
                    {errors.soal && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {errors.soal.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-700">
                      Pembahasan
                    </label>
                    <Controller
                      name="pembahasan"
                      control={control}
                      render={({ field }) => (
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    value={field.value}
                    onChange={field.onChange}
                  />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-800">Opsi Jawaban</p>
                  {opsi.length < 5 && (
                    <button
                      type="button"
                      onClick={addOpsi}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Plus className="w-3 h-3" />
                      Tambah Opsi
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Minimal 2 opsi. Pilih checkbox untuk jawaban yang benar. Skor
                  default 0 dapat diubah per opsi.
                </p>
                <div className="space-y-3">
                  {opsi.map((opt, idx) => (
                    <div
                      key={opt.label}
                      className="border border-slate-100 rounded-md p-2 bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 font-semibold text-xs">
                            {opt.label}
                          </span>
                          <label className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                            <input
                              type="checkbox"
                              checked={!!opt.benar}
                              onChange={(e) =>
                                updateOpsi(idx, "benar", e.target.checked)
                              }
                            />
                            Jawaban benar
                          </label>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-slate-500">Skor:</span>
                          <input
                            type="number"
                            min={0}
                            className="w-16 px-1 py-0.5 rounded border border-slate-200 text-xs"
                            value={opt.skor}
                            onChange={(e) =>
                              updateOpsi(idx, "skor", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <ReactQuill
                        theme="snow"
                        modules={quillModules}
                        value={opt.konten}
                        onChange={(val) => updateOpsi(idx, "konten", val)}
                      />
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Soal"
        description="Yakin ingin menghapus soal ini beserta opsi jawabannya?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default BankSoalPage;

