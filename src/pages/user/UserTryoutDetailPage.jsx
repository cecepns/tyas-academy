import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock3 } from "lucide-react";
import api from "../../utils/apiClient";
import { useToast } from "../../components/common/ToastContext";

const formatRemaining = (seconds) => {
  if (seconds == null) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const UserTryoutDetailPage = () => {
  const { id } = useParams();
  const { show } = useToast();
  const [tryout, setTryout] = useState(null);
  const [soal, setSoal] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/user/tryout/${id}`);
        setTryout(res.data);
        setSoal(res.data?.soal || []);
        if (res.data?.durasi) {
          setRemaining(res.data.durasi * 60);
        }
      } catch (e) {
        show(
          "error",
          e.response?.data?.message || "Gagal memuat detail tryout",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!tryout || remaining == null) return;
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => (prev != null ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [tryout, remaining]);

  useEffect(() => {
    if (!tryout) return;
    if (remaining !== 0) return;
    if (autoSubmitted || submitting || result) return;
    setAutoSubmitted(true);
    handleSubmit(true);
  }, [remaining, tryout, autoSubmitted, submitting, result]);

  const handleAnswerChange = (bankSoalId, label) => {
    setAnswers((prev) => ({
      ...prev,
      [bankSoalId]: label,
    }));
  };

  const handleSubmit = async (auto = false) => {
    if (!Object.keys(answers).length) {
      if (!auto) {
        show("error", "Pilih jawaban terlebih dahulu.");
      }
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/user/tryout/${id}/submit`, {
        answers,
      });
      setResult(res.data);
      if (!auto) {
        show("success", "Jawaban berhasil dikirim. Lihat hasil di bawah.");
      } else {
        show("success", "Waktu habis, jawaban otomatis dikirim.");
      }
    } catch (e) {
      show(
        "error",
        e.response?.data?.message || "Gagal mengirim jawaban tryout",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !tryout) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Memuat detail tryout...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            {tryout.judul_tryout}
          </h1>
          {tryout.deskripsi && (
            <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
              {tryout.deskripsi}
            </p>
          )}
          <p className="text-base text-slate-500 mt-1">
            Durasi pengerjaan: {tryout.durasi} menit.{" "}
            {typeof tryout.passingGrade === "number" && (
              <span className="ml-1">
                (Passing grade: {tryout.passingGrade}%)
              </span>
            )}
          </p>
        </div>
        {remaining != null && (
          <div className="inline-flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100">
            <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center">
              <Clock3 className="w-3 h-3" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs text-primary-600 uppercase tracking-wider">
                Sisa Waktu
              </span>
              <span className="text-base font-semibold text-primary-700">
                {formatRemaining(Math.max(remaining, 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {soal.length > 0 ? (
        <div className="space-y-4">
          {(() => {
            const s = soal[currentIndex];
            if (!s) return null;
            return (
              <div
                key={s.bank_soal_id}
                className="bg-white border border-slate-100 rounded-2xl shadow-md p-4 text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-900">
                    Soal {currentIndex + 1}
                  </p>
                  <p className="text-xs md:text-sm text-slate-500">
                    {currentIndex + 1} dari {soal.length}
                  </p>
                </div>
                <div
                  className="prose prose-sm max-w-none mb-3 !text-xl"
                  dangerouslySetInnerHTML={{ __html: s.soal }}
                />
                <div className="space-y-2">
                  {s.opsi.map((o) => (
                    <label
                      key={o.label}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`soal-${s.bank_soal_id}`}
                        className="mt-0.5"
                        checked={answers[s.bank_soal_id] === o.label}
                        onChange={() =>
                          handleAnswerChange(s.bank_soal_id, o.label)
                        }
                      />
                      <span className="text-slate-700">
                        <span className="font-semibold mr-1 text-lg">{o.label}.</span>
                        <span className="text-lg" dangerouslySetInnerHTML={{ __html: o.konten }} />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === soal.length - 1}
                onClick={() =>
                  setCurrentIndex((idx) => Math.min(soal.length - 1, idx + 1))
                }
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 disabled:opacity-40"
              >
                Berikutnya
              </button>
              {currentIndex === soal.length - 1 &&
                remaining !== 0 &&
                !result && (
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
                  >
                    {submitting ? "Mengirim..." : "Kirim Jawaban"}
                  </button>
                )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Belum ada soal yang terhubung ke tryout ini.
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link
              to={`/user/tryout/${id}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium underline-offset-2 hover:underline"
            >
              ← Ke dashboard tryout
            </Link>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-4 text-sm">
            <p className="font-semibold text-slate-900 mb-1">Hasil Tryout</p>
            <p className="text-slate-600">
              Skor: {result.totalScore} / {result.maxScore}
            </p>
            <p className="text-slate-600">
              Persentase: {result.percentage?.toFixed(2)}%
            </p>
            <p className="text-slate-600">
              Passing grade: {result.passingGrade}%
            </p>
            <p
              className={`mt-1 font-semibold ${
                result.lulus ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {result.lulus ? "LULUS" : "BELUM LULUS"}
            </p>
          </div>

          {Array.isArray(result.details) && result.details.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-4 text-sm space-y-3">
              <p className="font-semibold text-slate-900">Pembahasan Soal</p>
              {result.details.map((d, idx) => (
                <div
                  key={d.bank_soal_id}
                  className="border border-slate-100 rounded-md p-3 bg-slate-50"
                >
                  <p className="font-semibold text-slate-800 mb-1">
                    Soal {idx + 1}
                  </p>
                  <div
                    className="prose prose-sm max-w-none mb-2"
                    dangerouslySetInnerHTML={{ __html: d.soal }}
                  />
                  <p className="text-[11px] text-slate-700 mb-1">
                    Jawaban kamu:{" "}
                    <span className="font-semibold">
                      {d.jawaban_user || "-"}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-700 mb-2">
                    Jawaban benar:{" "}
                    <span className="font-semibold">
                      {d.jawaban_benar || "-"}
                    </span>
                  </p>
                  {d.pembahasan && (
                    <div className="text-[11px] text-slate-600">
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
          )}
        </div>
      )}
    </div>
  );
};

export default UserTryoutDetailPage;
