import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "../../utils/apiClient";
import { useToast } from "../../components/common/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const TipeSoalPage = () => {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm();
  const { errors, isSubmitting } = formState;

  const limit = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/tipe-soal", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      show("error", "Gagal memuat tipe soal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const onSubmit = async (values) => {
    try {
      const payload = {
        nama_tipe_soal: values.nama_tipe_soal,
        passing_grade: Number(values.passing_grade || 0),
      };
      if (values.kode_soal) payload.kode_soal = values.kode_soal;
      if (editing) {
        await api.put(`/admin/tipe-soal/${editing.id}`, payload);
        show("success", "Tipe soal diperbarui");
      } else {
        await api.post("/admin/tipe-soal", payload);
        show("success", "Tipe soal ditambahkan");
      }
      setEditing(null);
      reset({});
      load();
      setOpenForm(false);
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal menyimpan tipe soal");
    }
  };

  const onAdd = () => {
    setEditing(null);
    reset({
      kode_soal: "",
      nama_tipe_soal: "",
      passing_grade: 0,
    });
    setOpenForm(true);
  };

  const onEdit = (item) => {
    setEditing(item);
    reset({
      kode_soal: item.kode_soal,
      nama_tipe_soal: item.nama_tipe_soal,
      passing_grade: item.passing_grade,
    });
    setOpenForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/tipe-soal/${deleteId}`);
      show("success", "Tipe soal dihapus");
      setDeleteId(null);
      load();
    } catch {
      show("error", "Gagal menghapus tipe soal");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Manajemen Tipe Soal
          </h1>
          <p className="text-base text-slate-500 mt-1">
            Atur kode soal, nama tipe, dan passing grade.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-2 rounded bg-primary-600 text-white text-xs hover:bg-primary-700"
        >
          <Plus className="w-3 h-3" />
          Tambah Tipe Soal
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="relative w-full max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode / nama tipe soal..."
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
                Kode Soal
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Nama Tipe Soal
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Passing Grade
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
                  <td className="px-4 py-3">{item.kode_soal}</td>
                  <td className="px-4 py-3">{item.nama_tipe_soal}</td>
                  <td className="px-4 py-3">{item.passing_grade}</td>
                  <td className="px-4 py-3 text-right">
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
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 p-6 text-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                {editing ? "Edit Tipe Soal" : "Tambah Tipe Soal"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpenForm(false);
                  setEditing(null);
                }}
                className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px]"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Kode Soal</label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Opsional, kosongkan untuk generate otomatis"
                    {...register("kode_soal")}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Jika dikosongkan, sistem akan membuat kode otomatis (TS-XXXX).
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">
                    Nama Tipe Soal
                  </label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("nama_tipe_soal", {
                      required: "Nama tipe soal wajib diisi",
                    })}
                  />
                  {errors.nama_tipe_soal && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.nama_tipe_soal.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">
                    Passing Grade (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("passing_grade", {
                      required: "Passing grade wajib diisi",
                    })}
                  />
                  {errors.passing_grade && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.passing_grade.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpenForm(false);
                    setEditing(null);
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
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Hapus Tipe Soal"
        description="Yakin ingin menghapus tipe soal ini? Soal yang terkait juga dapat terpengaruh."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default TipeSoalPage;

