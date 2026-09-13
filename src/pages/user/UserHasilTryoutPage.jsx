import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  BarChart3,
  RotateCcw,
  Search,
  Filter,
  X,
  Calendar,
  Clock,
  HelpCircle,
} from "lucide-react";
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

const UserHasilTryoutPage = () => {
  const { show } = useToast();
  const fileBase = getFileBase();
  const [hasilList, setHasilList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'lulus' | 'tidak_lulus'

  // Modal Pembahasan
  const [pembahasanLoading, setPembahasanLoading] = useState(false);
  const [pembahasanDetail, setPembahasanDetail] = useState(null);
  const [modalFilter, setModalFilter] = useState("all"); // 'all' | 'benar' | 'salah'

  useEffect(() => {
    loadHasil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHasil = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/tryout-hasil");
      setHasilList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      show(
        "error",
        e.response?.data?.message || "Gagal memuat riwayat hasil tryout"
      );
    } finally {
      setLoading(false);
    }
  };

  const openPembahasan = async (hasilId) => {
    setPembahasanLoading(true);
    setModalFilter("all");
    try {
      const res = await api.get(`/user/tryout-hasil/${hasilId}`);
      setPembahasanDetail(res.data);
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal memuat pembahasan");
    } finally {
      setPembahasanLoading(false);
    }
  };

  const closePembahasan = () => {
    setPembahasanDetail(null);
  };

  // Filtered list
  const filteredList = hasilList.filter((item) => {
    const matchSearch =
      !searchTerm ||
      item.judul_tryout?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "lulus" && item.lulus) ||
      (statusFilter === "tidak_lulus" && !item.lulus);
    return matchSearch && matchStatus;
  });

  // Calculate stats
  const totalDikerjakan = hasilList.length;
  const totalLulus = hasilList.filter((h) => h.lulus).length;
  const totalBelumLulus = totalDikerjakan - totalLulus;
  const avgScore =
    totalDikerjakan > 0
      ? (
        hasilList.reduce((acc, curr) => acc + Number(curr.percentage || 0), 0) /
        totalDikerjakan
      ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Hasil & Pembahasan Try Out
          </h1>
          <p className="text-base text-slate-500 mt-1">
            Riwayat pengerjaan tryout kamu tersimpan di sini. Kamu dapat melihat pembahasan kapan saja tanpa harus mengerjakan ulang.
          </p>
        </div>
        <Link
          to="/user/tryout"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Lihat Daftar Try Out
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">
              Total Dikerjakan
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {totalDikerjakan} kali
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">
              Lulus Passing Grade
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {totalLulus}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">
              Belum Lulus
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {totalBelumLulus}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">
              Rata-rata Skor
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {avgScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama tryout..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Semua ({hasilList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("lulus")}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "lulus"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-emerald-700"
                }`}
            >
              Lulus ({totalLulus})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("tidak_lulus")}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "tidak_lulus"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-rose-700"
                }`}
            >
              Belum Lulus ({totalBelumLulus})
            </button>
          </div>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-500">
          Memuat riwayat hasil tryout...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {hasilList.length === 0
              ? "Belum ada tryout yang dikerjakan"
              : "Tidak ada hasil tryout yang sesuai filter"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {hasilList.length === 0
              ? "Silakan kerjakan tryout yang tersedia pada paket kamu. Hasil dan pembahasan lengkap akan otomatis tersimpan di sini."
              : "Coba ubah kata kunci pencarian atau filter status."}
          </p>
          {hasilList.length === 0 && (
            <Link
              to="/user/tryout"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition mt-2"
            >
              Mulai Kerjakan Try Out
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-100 rounded-2xl shadow-md p-4 md:p-5 hover:border-primary-200 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                {item.banner_image ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0 bg-slate-50">
                    <img
                      src={`${fileBase}${item.banner_image}`}
                      alt={item.judul_tryout}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-slate-100 shrink-0 bg-primary-50 text-primary-600 flex items-center justify-center">
                    <BookOpen className="w-7 h-7" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.lulus
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                    >
                      {item.lulus ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Lulus PG
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Belum Lulus PG
                        </>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(item.created_at)}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(item.created_at)}
                    </span>
                  </div>

                  <h3 className="text-base md:text-lg font-semibold text-slate-900 truncate">
                    {item.judul_tryout}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                      Skor:{" "}
                      <strong className="text-slate-900">
                        {item.total_score}/{item.max_score}
                      </strong>{" "}
                      ({Number(item.percentage).toFixed(1)}%)
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                      Benar: <strong>{item.correct_count ?? 0}</strong>
                    </span>
                    <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg">
                      Salah: <strong>{item.incorrect_count ?? 0}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => openPembahasan(item.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 shadow-sm transition"
                >
                  <BookOpen className="w-4 h-4" />
                  Lihat Pembahasan
                </button>
                <Link
                  to={`/user/tryout/${item.tryout_id}/kerjakan`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                  title="Kerjakan ulang tryout ini"
                >
                  <RotateCcw className="w-4 h-4" />
                  Kerjakan Ulang
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Pembahasan */}
      {pembahasanLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex items-center gap-3 text-sm text-slate-700 font-medium">
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
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Pembahasan: {pembahasanDetail.judul_tryout}
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

            {/* Score Summary in Modal */}
            <div className="px-4 sm:px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className="font-semibold text-slate-900">
                  Skor: {pembahasanDetail.total_score} / {pembahasanDetail.max_score} (
                  {Number(pembahasanDetail.percentage).toFixed(1)}%)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pembahasanDetail.lulus
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

              {/* Filter in Modal */}
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  type="button"
                  onClick={() => setModalFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition ${modalFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter("benar")}
                  className={`px-2.5 py-1 rounded-md transition ${modalFilter === "benar"
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:text-emerald-700"
                    }`}
                >
                  Benar
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter("salah")}
                  className={`px-2.5 py-1 rounded-md transition ${modalFilter === "salah"
                      ? "bg-rose-600 text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:text-rose-700"
                    }`}
                >
                  Salah
                </button>
              </div>
            </div>

            {/* Modal Questions list */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {!Array.isArray(pembahasanDetail.details) ||
              pembahasanDetail.details.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-500">
                  Tidak ada data soal untuk pembahasan ini.
                </div>
              ) : (
                (() => {
                  const filteredQuestions = pembahasanDetail.details.filter(
                    (d) => {
                      const isBenar =
                        d.jawaban_user &&
                        d.jawaban_benar &&
                        d.jawaban_user.trim().toUpperCase() ===
                          d.jawaban_benar.trim().toUpperCase();
                      if (modalFilter === "benar") return isBenar;
                      if (modalFilter === "salah") return !isBenar;
                      return true;
                    }
                  );

                  if (filteredQuestions.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-500">
                        Tidak ada soal yang sesuai dengan filter ({modalFilter}).
                      </div>
                    );
                  }

                  return filteredQuestions.map((d, idx) => {
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
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="font-bold text-slate-800 text-sm">
                            Soal {idx + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isBenar
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isBenar ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Jawaban Benar
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Jawaban Salah
                              </>
                            )}
                          </span>
                        </div>

                        {/* Soal Content */}
                        <div
                          className="prose prose-sm max-w-none mb-4 text-slate-800 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: d.soal }}
                        />

                        {/* Options */}
                        {Array.isArray(d.opsi) && d.opsi.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {d.opsi.map((o) => {
                              const isUserChoice =
                                d.jawaban_user &&
                                d.jawaban_user.trim().toUpperCase() ===
                                  o.label.trim().toUpperCase();
                              const isCorrectChoice =
                                d.jawaban_benar &&
                                d.jawaban_benar.trim().toUpperCase() ===
                                  o.label.trim().toUpperCase();

                              return (
                                <div
                                  key={o.label}
                                  className={`px-3 py-2 rounded-xl text-xs flex items-start gap-2 border ${
                                    isCorrectChoice
                                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium"
                                      : isUserChoice
                                      ? "bg-rose-50/80 border-rose-300 text-rose-950"
                                      : "bg-slate-50 border-slate-100 text-slate-700"
                                  }`}
                                >
                                  <span className="font-bold shrink-0">
                                    {o.label}.
                                  </span>
                                  <div
                                    className="prose prose-xs max-w-none [&_p]:m-0 [&_p]:inline flex-1"
                                    dangerouslySetInnerHTML={{
                                      __html: o.konten,
                                    }}
                                  />
                                  {isCorrectChoice && (
                                    <span className="ml-auto shrink-0 font-semibold text-emerald-700 text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md">
                                      Kunci Benar
                                    </span>
                                  )}
                                  {isUserChoice && !isCorrectChoice && (
                                    <span className="ml-auto shrink-0 font-semibold text-rose-700 text-[10px] bg-rose-100 px-2 py-0.5 rounded-md">
                                      Jawaban Kamu
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Answers comparison */}
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
                              {d.jawaban_user
                                ? `${d.jawaban_user}`
                                : "(Tidak Dijawab)"}
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

                        {/* Pembahasan */}
                        {d.pembahasan ? (
                          <div className="mt-3 pt-3 border-t border-slate-100 bg-amber-50/40 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 rounded-b-2xl">
                            <p className="font-semibold text-xs text-amber-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                              Pembahasan Lengkap:
                            </p>
                            <div
                              className="prose prose-sm max-w-none text-slate-700 text-xs sm:text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: d.pembahasan }}
                            />
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-400 italic">
                            Tidak ada teks pembahasan tambahan untuk soal ini.
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Modal Footer */}
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

export default UserHasilTryoutPage;
