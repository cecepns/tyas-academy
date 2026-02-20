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
          <div className="flex items-center gap-2 text-slate-700 mb-3">
            <History className="w-5 h-5 text-primary-500" />
            <span className="font-medium">Riwayat Pengerjaan</span>
            <span className="text-sm text-slate-500 font-normal">
              (Total: {attempts.length} kali)
            </span>
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
                  className="flex flex-wrap items-center justify-between gap-2 py-3 px-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(a.created_at)} · {formatTime(a.created_at)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Skor: {a.total_score}/{a.max_score} ({Number(a.percentage).toFixed(1)}%)
                      {a.lulus ? (
                        <span className="ml-2 text-emerald-600 font-medium">Lulus</span>
                      ) : (
                        <span className="ml-2 text-rose-600 font-medium">Belum lulus</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setStatistikHasilId(statistikHasilId === a.id ? null : a.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Statistik
                    </button>
                    <button
                      type="button"
                      onClick={() => openPembahasan(a.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-200 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Pembahasan
                    </button>
                  </div>
                  {statistikHasilId === a.id && (
                    <div className="w-full mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 grid grid-cols-2 gap-2">
                      <span>Total skor: {a.total_score} / {a.max_score}</span>
                      <span>Persentase: {Number(a.percentage).toFixed(2)}%</span>
                      <span>Status: {a.lulus ? "Lulus" : "Belum lulus"}</span>
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
            <span className="font-medium">Leaderboard</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <p className="text-white font-medium">Memuat pembahasan...</p>
        </div>
      )}
      {pembahasanDetail && !pembahasanLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={closePembahasan}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Pembahasan · {formatDate(pembahasanDetail.created_at)} {formatTime(pembahasanDetail.created_at)}
              </h2>
              <button
                type="button"
                onClick={closePembahasan}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <p className="text-sm text-slate-600">
                Skor: {pembahasanDetail.total_score}/{pembahasanDetail.max_score} (
                {Number(pembahasanDetail.percentage).toFixed(2)}%) ·{" "}
                {pembahasanDetail.lulus ? "Lulus" : "Belum lulus"}
              </p>
              {Array.isArray(pembahasanDetail.details) &&
                pembahasanDetail.details.map((d, idx) => (
                  <div
                    key={d.bank_soal_id}
                    className="border border-slate-100 rounded-xl p-3 bg-slate-50"
                  >
                    <p className="font-semibold text-slate-800 mb-1">
                      Soal {idx + 1}
                    </p>
                    <div
                      className="prose prose-sm max-w-none mb-2"
                      dangerouslySetInnerHTML={{ __html: d.soal }}
                    />
                    <p className="text-xs text-slate-700 mb-1">
                      Jawaban kamu:{" "}
                      <span className="font-semibold">
                        {d.jawaban_user || "-"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-700 mb-2">
                      Jawaban benar:{" "}
                      <span className="font-semibold">
                        {d.jawaban_benar || "-"}
                      </span>
                    </p>
                    {d.pembahasan && (
                      <div className="text-xs text-slate-600">
                        <p className="font-semibold mb-1">Pembahasan:</p>
                        <div
                          className="prose prose-[0.7rem] max-w-none"
                          dangerouslySetInnerHTML={{ __html: d.pembahasan }}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTryoutDashboardPage;
