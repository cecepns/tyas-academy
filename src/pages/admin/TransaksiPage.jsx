import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "../../utils/apiClient";
import { useToast } from "../../components/common/ToastContext";

const formatTanggal = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // yyyy-mm-dd
  const timePart = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart} ${timePart}`;
};

const TransaksiPage = () => {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/transaksi", {
        params: { page, limit, search },
      });
      setItems(res.data.data);
      setTotal(res.data.total);
    } catch {
      show("error", "Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          Manajemen Transaksi
        </h1>
        <p className="text-base text-slate-500 mt-1">
          Lihat riwayat transaksi user untuk semua paket.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="relative w-full max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama user / paket..."
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

      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                User
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Paket
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Harga
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Status
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-semibold">
                Tanggal
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  Belum ada data.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-50">
                  <td className="px-4 py-3">{item.user_name}</td>
                  <td className="px-4 py-3">{item.nama_paket}</td>
                  <td className="px-3 py-2 text-slate-500">
                    Rp {item.harga?.toLocaleString?.("id-ID") ?? item.harga}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          item.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : item.status === "expired"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                      <select
                        className="border border-slate-200 rounded px-2 py-1 text-[11px] bg-white"
                        value={item.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            await api.patch(
                              `/admin/transaksi/${item.id}/status`,
                              { status: newStatus }
                            );
                            setItems((prev) =>
                              prev.map((tr) =>
                                tr.id === item.id
                                  ? { ...tr, status: newStatus }
                                  : tr
                              )
                            );
                            show(
                              "success",
                              "Status transaksi berhasil diperbarui"
                            );
                          } catch (err) {
                            show(
                              "error",
                              err.response?.data?.message ||
                                "Gagal memperbarui status"
                            );
                          }
                        }}
                      >
                        <option value="pending">pending</option>
                        <option value="success">success</option>
                        <option value="failed">failed</option>
                        <option value="expired">expired</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {formatTanggal(item.tanggal)}
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
    </div>
  );
};

export default TransaksiPage;

