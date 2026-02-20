import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "../../utils/apiClient";
import { useToast } from "../../components/common/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";

const UsersPage = () => {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const limit = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      show("error", "Gagal memuat user");
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
      if (editing) {
        await api.put(`/admin/users/${editing.id}`, values);
        show("success", "User diperbarui");
      } else {
        await api.post("/admin/users", values);
        show("success", "User ditambahkan");
      }
      setEditing(null);
      reset({});
      load();
      setOpenForm(false);
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal menyimpan user");
    }
  };

  const onEdit = (item) => {
    setEditing(item);
    reset({
      name: item.name,
      email: item.email,
      role: item.role,
      password: "",
    });
    setOpenForm(true);
  };

  const onAdd = () => {
    setEditing(null);
    reset({
      name: "",
      email: "",
      role: "user",
      password: "",
    });
    setOpenForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/users/${deleteId}`);
      show("success", "User dihapus");
      setDeleteId(null);
      load();
    } catch {
      show("error", "Gagal menghapus user");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Manajemen User
          </h1>
          <p className="text-xs text-slate-500">
            Kelola akun admin dan user CardioDemy.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-2 rounded bg-primary-600 text-white text-xs hover:bg-primary-700"
        >
          <Plus className="w-3 h-3" />
          Tambah User
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama / email..."
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
                Nama
              </th>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">
                Email
              </th>
              <th className="px-3 py-2 text-left text-slate-500 font-medium">
                Role
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
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.email}</td>
                  <td className="px-3 py-2 capitalize">{item.role}</td>
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
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl border border-slate-100 p-5 text-xs">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                {editing ? "Edit User" : "Tambah User"}
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
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Nama</label>
                  <input
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("name", { required: "Nama wajib diisi" })}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">Email</label>
                  <input
                    type="email"
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("email", { required: "Email wajib diisi" })}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Password</label>
                  <input
                    type="password"
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("password", {
                      validate: (v) =>
                        editing && !v
                          ? true
                          : v
                          ? v.length >= 6
                          : "Minimal 6 karakter",
                    })}
                  />
                  {errors.password && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                  {editing && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kosongkan jika tidak ingin mengubah password.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-slate-700">Role</label>
                  <select
                    className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register("role", { required: "Role wajib dipilih" })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.role.message}
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
        title="Hapus User"
        description="Yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default UsersPage;

