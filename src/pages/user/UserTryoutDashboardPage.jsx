import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Users, History, Trophy, Play, BarChart3, BookOpen, X } from "lucide-react";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";
import { useToast } from "../../components/common/ToastContext";

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const UserTryoutDashboardPage = () => {
  const { id } = useParams();
  const { show } = useToast();
  const fileBase = getFileBase();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statistikHasilId, setStatistikHasilId] = useState(null);
  const [pembahasanDetail, setPembahasanDetail] = useState(null);
  const [pembahasanLoading, setPembahasanLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/user/tryout/${id}/dashboard`);
        setData(res.data);
      } catch (e) {
        show(
          "error",
          e.response?.data?.message || "Gagal memuat dashboard tryout",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, show]);

  const openPembahasan = async (hasilId) => {
    setPembahasanLoading(true);
    setPembahasanDetail(null);
    try {
      const res = await api.get(`/user/tryout/${id}/hasil/${hasilId}`);
      setPembahasanDetail(res.data);
    } catch (e) {
      show(
        "error",
        e.response?.data?.message || "Gagal memuat pembahasan",
      );
    } finally {
      setPembahasanLoading(false);
    }
  };

  const closePembahasan = () => {
    setPembahasanDetail(null);
  };

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Memuat dashboard tryout...</p>
      </div>
    );
  }

  const { tryout, total_peserta, attempts, leaderboard } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        {tryout.banner_image && (
          <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
            <img
              src={`${fileBase}${tryout.banner_image}`}
              alt={tryout.judul_tryout}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            {tryout.judul_tryout}
          </h1>
          {tryout.deskripsi && (
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {tryout.deskripsi}
            </p>
          )}
          <p className="text-sm text-slate-500 mt-1">
            Durasi: {tryout.durasi} menit
          </p>
        </div>
      </div>

      {/* Card 1: Total peserta + Mulai tryout */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 text-slate-700 mb-3">
            <Users className="w-5 h-5 text-primary-500" />
            <span className="font-medium">Total Peserta</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">
            {total_peserta} peserta
          </p>
          <Link
            to={`/user/tryout/${id}/kerjakan`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition"
          >
            <Play className="w-4 h-4" />
            Mulai tryout
          </Link>
        </div>
      </div>

      {/* Card 2: Riwayat pengerjaan */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-slate-700">
              <History className="w-5 h-5 text-primary-500" />
              <span className="font-semibold text-slate-900">Riwayat Pengerjaan & Pembahasan</span>
              <span className="text-sm text-slate-500 font-normal">
                (Total: {attempts.length} kali)
              </span>
            </div>
            <Link
              to="/user/hasil-tryout"
              className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
            >
              Semua Hasil Try Out →
            </Link>
          </div>
          
          <div className="mb-4 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Hasil tryout dan pembahasan tersimpan secara permanen. Anda dapat meninjau statistik dan kunci pembahasan kapan saja setelah login tanpa perlu mengerjakan ulang.
            </p>
          </div>

          {attempts.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">
              Belum ada riwayat. Klik &quot;Mulai tryout&quot; untuk mengerjakan.
            </p>
          ) : (
            <ul className="space-y-3">
              {attempts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(a.created_at)} · {formatTime(a.created_at)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Skor: <strong className="text-slate-800">{a.total_score}/{a.max_score}</strong> ({Number(a.percentage).toFixed(1)}%)
                      {a.lulus ? (
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-medium">Lulus</span>
                      ) : (
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-medium">Belum lulus</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setStatistikHasilId(statistikHasilId === a.id ? null : a.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Statistik
                    </button>
                    <button
                      type="button"
                      onClick={() => openPembahasan(a.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-600 text-xs font-medium text-white hover:bg-primary-700 shadow-xs transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Lihat Pembahasan
                    </button>
                  </div>
                  {statistikHasilId === a.id && (
                    <div className="w-full mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg">
                      <span>
                        Benar/Salah: <strong className="text-slate-800">{a.correct_count ?? 0}/{a.incorrect_count ?? 0}</strong>
                      </span>
                      <span>Total skor: <strong className="text-slate-800">{a.total_score} / {a.max_score}</strong></span>
                      <span>Persentase: <strong className="text-slate-800">{Number(a.percentage).toFixed(2)}%</strong></span>
                      <span>Status: <strong className={a.lulus ? "text-emerald-600" : "text-rose-600"}>{a.lulus ? "Lulus PG" : "Belum lulus"}</strong></span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Card 3: Leaderboard */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 text-slate-700 mb-3">
            <Trophy className="w-5 h-5 text-primary-500" />
            <span className="font-semibold text-slate-900">Leaderboard</span>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">
              Belum ada skor. Jadilah yang pertama mengerjakan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-2 pr-2 font-medium">Peringkat</th>
                    <th className="pb-2 pr-2 font-medium">Nama</th>
                    <th className="pb-2 pr-2 font-medium text-right">Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, idx) => (
                    <tr
                      key={row.user_id}
                      className="border-b border-slate-100 text-slate-800"
                    >
                      <td className="py-2.5 pr-2 font-medium">
                        #{idx + 1}
                      </td>
                      <td className="py-2.5 pr-2">{row.name}</td>
                      <td className="py-2.5 text-right font-medium">
                        {row.total_score}/{row.max_score} ({Number(row.percentage).toFixed(1)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Pembahasan */}
      {pembahasanLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl text-slate-700 text-sm font-medium flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Memuat pembahasan...
          </div>
        </div>
      )}
      {pembahasanDetail && !pembahasanLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm !mt-0"
          onClick={closePembahasan}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Pembahasan Try Out
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dikerjakan pada {formatDate(pembahasanDetail.created_at)} pukul {formatTime(pembahasanDetail.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={closePembahasan}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-4 sm:px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-900">
                  Skor: {pembahasanDetail.total_score}/{pembahasanDetail.max_score} (
                  {Number(pembahasanDetail.percentage).toFixed(1)}%)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    pembahasanDetail.lulus
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {pembahasanDetail.lulus ? "Lulus Passing Grade" : "Belum Lulus"}
                </span>
                <span className="text-slate-600">
                  Benar: <strong className="text-emerald-600">{pembahasanDetail.correct_count ?? 0}</strong> · Salah:{" "}
                  <strong className="text-rose-600">{pembahasanDetail.incorrect_count ?? 0}</strong>
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {Array.isArray(pembahasanDetail.details) &&
                pembahasanDetail.details.map((d, idx) => {
                  const isBenar =
                    d.jawaban_user &&
                    d.jawaban_benar &&
                    d.jawaban_user.trim().toUpperCase() ===
                      d.jawaban_benar.trim().toUpperCase();

                  return (
                    <div
                      key={d.bank_soal_id || idx}
                      className={`border rounded-2xl p-4 sm:p-5 bg-white shadow-xs ${
                        isBenar ? "border-emerald-200" : "border-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-slate-800 text-sm">
                          Soal {idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isBenar
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isBenar ? "Benar" : "Salah"}
                        </span>
                      </div>
                      
                      <div
                        className="prose prose-sm max-w-none mb-3 text-slate-800 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: d.soal }}
                      />

                      <div className="grid sm:grid-cols-2 gap-2 text-xs mb-3">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            isBenar
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                              : "bg-rose-50/60 border-rose-200 text-rose-900"
                          }`}
                        >
                          <span className="font-semibold block text-[11px] uppercase tracking-wider mb-0.5 opacity-75">
                            Jawaban Anda:
                          </span>
                          <span className="text-sm font-bold">
                            {d.jawaban_user ? `${d.jawaban_user}` : "(Tidak Dijawab)"}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl border bg-emerald-50/60 border-emerald-200 text-emerald-900">
                          <span className="font-semibold block text-[11px] uppercase tracking-wider mb-0.5 opacity-75">
                            Kunci Jawaban:
                          </span>
                          <span className="text-sm font-bold">
                            {d.jawaban_benar || "-"}
                          </span>
                        </div>
                      </div>

                      {d.pembahasan && (
                        <div className="mt-3 pt-3 border-t border-slate-100 bg-amber-50/40 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 rounded-b-2xl">
                          <p className="font-semibold text-xs text-amber-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                            Pembahasan:
                          </p>
                          <div
                            className="prose prose-sm max-w-none text-slate-700 text-xs sm:text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: d.pembahasan }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                type="button"
                onClick={closePembahasan}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
              >
                Tutup Pembahasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTryoutDashboardPage;
