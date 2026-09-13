import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ListChecks, Receipt, Award, BookOpen, ArrowRight } from "lucide-react";
import api from "../../utils/apiClient";

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [myTransaksiCount, setMyTransaksiCount] = useState(null);
  const [myHasilCount, setMyHasilCount] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, transaksiRes, hasilRes] = await Promise.all([
          api.get("/public/overview"),
          api.get("/user/transaksi"),
          api.get("/user/tryout-hasil"),
        ]);
        setStats(overviewRes.data);
        setMyTransaksiCount(Array.isArray(transaksiRes.data) ? transaksiRes.data.length : 0);
        setMyHasilCount(Array.isArray(hasilRes.data) ? hasilRes.data.length : 0);
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
      link: "/user/paket",
    },
    {
      key: "total_tryout",
      label: "Total Tryout",
      icon: ListChecks,
      color: "bg-violet-50 text-violet-700",
      value: (s) => s?.total_tryout,
      link: "/user/tryout",
    },
    {
      key: "my_hasil",
      label: "Hasil & Pembahasan",
      icon: Award,
      color: "bg-emerald-50 text-emerald-700",
      value: () => myHasilCount,
      link: "/user/hasil-tryout",
    },
    {
      key: "my_transaksi",
      label: "Transaksi Kamu",
      icon: Receipt,
      color: "bg-amber-50 text-amber-700",
      value: () => myTransaksiCount,
      link: "/user/transaksi",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          Dashboard Belajar
        </h1>
        <p className="text-base text-slate-500 mt-1">
          Akses paket, bimbel, materi, tryout, dan riwayat pembahasan yang sudah kamu kerjakan.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = card.value(stats);
          return (
            <Link
              key={card.key}
              to={card.link}
              className="bg-white rounded-2xl border border-slate-100 shadow-md hover:border-primary-200 hover:shadow-lg transition-all p-5 flex items-center gap-4 group"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} shadow-sm group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm uppercase tracking-wide text-slate-500 font-medium truncate">
                  {card.label}
                </p>
                <p className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">
                  {value ?? "-"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 rounded-2xl p-5 md:p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold">
            Lihat Pembahasan & Nilai Try Out Kamu
          </h2>
          <p className="text-sm text-primary-100 max-w-xl">
            Semua hasil tryout yang telah dikerjakan tersimpan rapi. Kamu bisa meninjau kunci jawaban dan pembahasan lengkap kapan saja tanpa perlu mengerjakan ulang.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/user/hasil-tryout"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-primary-50 transition shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Buka Hasil & Pembahasan
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

