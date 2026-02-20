import { useEffect, useState } from "react";
import api from "../../utils/apiClient";
import { Users, Package, Receipt, ListChecks } from "lucide-react";

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/public/overview");
        setStats(res.data);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const cards = [
    {
      key: "total_users",
      label: "Total User",
      icon: Users,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "total_paket",
      label: "Total Paket",
      icon: Package,
      color: "bg-blue-50 text-blue-700",
    },
    {
      key: "total_transaksi",
      label: "Total Transaksi",
      icon: Receipt,
      color: "bg-amber-50 text-amber-700",
    },
    {
      key: "total_tryout",
      label: "Total Tryout",
      icon: ListChecks,
      color: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Ringkasan Sistem
        </h1>
        <p className="text-xs text-slate-500">
          Pantau performa sistem bimbel online CardioDemy secara sekilas.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
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
                  {stats ? stats[card.key] : "-"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardOverview;

