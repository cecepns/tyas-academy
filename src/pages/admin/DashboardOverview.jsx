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
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          Ringkasan Sistem
        </h1>
        <p className="text-base text-slate-500 mt-1">
          Pantau performa sistem bimbel online CardioDemy secara sekilas.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition-shadow p-5 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} shadow-sm`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm uppercase tracking-wide text-slate-500 font-medium">
                  {card.label}
                </p>
                <p className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">
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

