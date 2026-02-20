import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Headphones,
  ListChecks,
  Video,
  Users,
} from "lucide-react";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";

const items = [
  {
    icon: GraduationCap,
    title: "Bimbel Online",
    desc: "Ikuti bimbel online langsung bersama Kak Tyas untuk pendampingan intensif.",
  },
  {
    icon: ListChecks,
    title: "Paket Try Out",
    desc: "Try out sesuai kisi-kisi terbaru untuk persiapan ujian CPNS, Sekolah Kedinasan, PPPK, dan UKOM.",
  },
  {
    icon: Video,
    title: "Video Pembelajaran",
    desc: "Video interaktif dan menyenangkan terhubung langsung ke YouTube CardioDemy.",
  },
  {
    icon: BookOpen,
    title: "Materi PDF & Video",
    desc: "Materi teks dan video sebagai bahan belajar kapan pun dan di mana pun.",
  },
  {
    icon: Users,
    title: "Komunitas & Testimoni",
    desc: "Bergabung dengan komunitas dan lihat kisah sukses peserta yang lulus bersama CardioDemy.",
  },
  {
    icon: Headphones,
    title: "Pendampingan Berkelanjutan",
    desc: "Update materi dan bimbingan rutin agar progres belajar tetap terarah.",
  },
];

const Layanan = () => {
  const [paket, setPaket] = useState([]);
  const [loadingPaket, setLoadingPaket] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6;

  const fileBase = useMemo(() => getFileBase(), []);

  useEffect(() => {
    const load = async () => {
      setLoadingPaket(true);
      try {
        const res = await api.get("/public/paket", {
          params: { page, limit },
        });
        setPaket(res.data?.data || []);
        setTotal(res.data?.total || 0);
      } catch {
        // ignore error di halaman publik
      } finally {
        setLoadingPaket(false);
      }
    };
    load();
  }, [page, limit]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
      <div
        className="max-w-2xl mb-10"
        data-aos="fade-up"
      >
        <p className="text-base uppercase tracking-[0.2em] text-primary-500 mb-2">
          Layanan CardioDemy
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3">
          Ekosistem Belajar Lengkap dalam Satu Sistem
        </h1>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed">
          Sistem informasi bimbel online yang mengintegrasikan manajemen user,
          paket, bimbel, materi, bank soal, tryout, transaksi, testimoni, dan
          kode promo dengan tampilan modern dan responsif.
        </p>
      </div>

      <div
        className="grid md:grid-cols-3 gap-6"
        data-aos="fade-up"
        data-aos-delay="80"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex gap-3"
            >
              <div className="mt-1">
                <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">
                  {item.title}
                </p>
                <p className="text-base text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs md:text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    CRUD admin & user
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-12"
        data-aos="fade-up"
        data-aos-delay="120"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
            Paket Layanan
          </h2>
        </div>
        {loadingPaket && (
          <p className="text-sm text-slate-500">Memuat paket...</p>
        )}
        {!loadingPaket && paket.length === 0 && (
          <p className="text-base text-slate-500">
            Belum ada paket yang tersedia.
          </p>
        )}
        {!loadingPaket && paket.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paket.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
                >
                  {p.cover_image && (
                    <div className="h-32 w-full overflow-hidden">
                      <img
                        src={`${fileBase}${p.cover_image}`}
                        alt={p.nama_paket}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-base font-semibold text-slate-900 mb-1">
                      {p.nama_paket}
                    </p>
                    <p className="text-sm text-slate-500 mb-2">
                      {p.durasi_aktif === 0
                        ? "Akses selamanya"
                        : `Akses ${p.durasi_aktif} hari`}
                    </p>
                    {p.fitur_paket && (
                      <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-3 leading-relaxed">
                        {p.fitur_paket}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-base font-semibold text-primary-600">
                        Rp {p.harga?.toLocaleString?.("id-ID") ?? p.harga}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <p>
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Layanan;

