import { useEffect, useState } from "react";
import api from "../../utils/apiClient";

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

const UserTransaksiPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/user/transaksi");
        setItems(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          Riwayat Transaksi
        </h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Lihat riwayat pembelian paket bimbel kamu.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Memuat data...</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500">
          Belum ada transaksi yang tercatat.
        </p>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
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
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{item.nama_paket}</td>
                <td className="px-4 py-3 text-slate-600">
                  Rp {item.harga?.toLocaleString?.("id-ID") ?? item.harga}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : item.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatTanggal(item.tanggal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default UserTransaksiPage;

