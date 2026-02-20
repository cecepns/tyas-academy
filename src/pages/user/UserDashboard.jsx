import { useEffect, useState } from "react";
import { Package, ListChecks, Users, Receipt } from "lucide-react";
import api from "../../utils/apiClient";

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [myTransaksiCount, setMyTransaksiCount] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, transaksiRes] = await Promise.all([
          api.get("/public/overview"),
          api.get("/user/transaksi"),
        ]);
        setStats(overviewRes.data);
        setMyTransaksiCount(Array.isArray(transaksiRes.data) ? transaksiRes.data.length : 0);
      } catch {
        // ignore, cards will fallback to "-"
      }
    };
    load();
  }, []);

  const cards = [
    {
      key: "total_paket",
      label: "Total Paket",
      icon: Package,
      color: "bg-blue-50 text-blue-700",
      value: (s) => s?.total_paket,
    },
    {
      key: "total_tryout",
      label: "Total Tryout",
      icon: ListChecks,
      color: "bg-violet-50 text-violet-700",
      value: (s) => s?.total_tryout,
    },
    {
      key: "total_users",
      label: "Total User",
      icon: Users,
      color: "bg-emerald-50 text-emerald-700",
      value: (s) => s?.total_users,
    },
    {
      key: "my_transaksi",
      label: "Transaksi Kamu",
      icon: Receipt,
      color: "bg-amber-50 text-amber-700",
      value: () => myTransaksiCount,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Dashboard User
        </h1>
        <p className="text-xs text-slate-500">
          Akses paket, bimbel, materi, dan tryout yang sudah kamu beli.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = card.value(stats);
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${card.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {card.label}
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {value ?? "-"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserDashboard;

