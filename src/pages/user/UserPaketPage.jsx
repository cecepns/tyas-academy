import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";
import { useToast } from "../../components/common/ToastContext";

const UserPaketPage = () => {
  const { show } = useToast();
  const [paket, setPaket] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      kode_promo: "",
    },
  });

  const kodePromo = watch("kode_promo");
  const [promoInfo, setPromoInfo] = useState(null);

  const fileBase = useMemo(() => getFileBase(), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/user/paket");
        setPaket(res.data);
      } catch {
        show("error", "Gagal memuat paket");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidatePromo = async () => {
    if (!selected) {
      show("error", "Pilih paket terlebih dahulu");
      return;
    }
    if (!kodePromo) {
      show("error", "Masukkan kode promo");
      return;
    }
    try {
      const res = await api.post("/user/validate-promo", {
        kode_promo: kodePromo,
        total: selected.harga,
      });
      setPromoInfo(res.data);
      show("success", "Promo valid");
    } catch (e) {
      setPromoInfo(null);
      show("error", e.response?.data?.message || "Kode promo tidak valid");
    }
  };

  const onCheckout = async () => {
    if (!selected) {
      show("error", "Pilih paket terlebih dahulu");
      return;
    }
    try {
      const res = await api.post("/user/checkout", {
        paket_id: selected.id,
        kode_promo: kodePromo || undefined,
      });
      const midtrans = res.data?.midtrans;
      if (!midtrans?.redirect_url) {
        show(
          "error",
          "Gagal mendapatkan URL pembayaran. Silakan coba lagi."
        );
        return;
      }
      setPromoInfo(null);
      show("success", "Mengalihkan ke halaman pembayaran Midtrans...");
      window.location.href = midtrans.redirect_url;
    } catch (e) {
      show("error", e.response?.data?.message || "Checkout gagal");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Beli Paket</h1>
        <p className="text-xs text-slate-500">
          Pilih paket bimbel, masukkan kode promo, dan lanjutkan ke pembayaran
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          {loading && (
            <p className="text-xs text-slate-500">Memuat paket...</p>
          )}
          {!loading && paket.length === 0 && (
            <p className="text-xs text-slate-500">
              Belum ada paket yang tersedia.
            </p>
          )}
          {!loading &&
            paket.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelected(p)}
                className={`w-full text-left bg-white border rounded-lg shadow-sm p-3 text-xs ${
                  selected?.id === p.id
                    ? "border-primary-500 ring-1 ring-primary-200"
                    : "border-slate-100 hover:border-primary-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {p.cover_image && (
                    <div className="w-full max-w-44 h-auto rounded-md overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                      <img
                        src={`${fileBase}${p.cover_image}`}
                        alt={p.nama_paket}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {p.nama_paket}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {p.durasi_aktif === 0
                            ? "Akses selamanya"
                            : `Akses ${p.durasi_aktif} hari`}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary-600">
                        Rp {p.harga?.toLocaleString?.("id-ID") ?? p.harga}
                      </p>
                    </div>
                    {p.fitur_paket && (
                      <div className="mt-2 text-[11px] text-slate-600 whitespace-pre-line">
                        {p.fitur_paket}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
        </div>

        <div className="bg-white border border-slate-100 rounded-lg shadow-sm p-4 text-xs space-y-3">
          <p className="font-semibold text-slate-800 mb-1">Ringkasan</p>
          {selected ? (
            <>
              {selected.cover_image && (
                <div className="mb-3">
                  <div className="w-full h-28 rounded-md overflow-hidden border border-slate-100 bg-slate-50">
                    <img
                      src={`${fileBase}${selected.cover_image}`}
                      alt={selected.nama_paket}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <p className="text-sm font-semibold text-slate-900">
                {selected.nama_paket}
              </p>
              <p className="text-[11px] text-slate-500">
                Harga: Rp{" "}
                {selected.harga?.toLocaleString?.("id-ID") ?? selected.harga}
              </p>
              <p className="text-[11px] text-slate-500">
                Durasi:{" "}
                {selected.durasi_aktif === 0
                  ? "Akses selamanya"
                  : `${selected.durasi_aktif} hari`}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-slate-500">
              Pilih paket terlebih dahulu.
            </p>
          )}

          <form
            className="space-y-2 border-t border-slate-100 pt-3"
            onSubmit={handleSubmit(onCheckout)}
          >
            <div>
              <label className="block mb-1 text-slate-700">
                Kode Promo (opsional)
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Contoh: DISKON50"
                  {...register("kode_promo")}
                />
                <button
                  type="button"
                  onClick={handleValidatePromo}
                  className="px-3 py-1.5 rounded border border-primary-500 text-primary-600 hover:bg-primary-50"
                >
                  Cek
                </button>
              </div>
              {promoInfo && (
                <p className="text-[11px] text-emerald-600 mt-1">
                  Promo valid: potongan Rp{" "}
                  {promoInfo.potongan?.toLocaleString?.("id-ID") ??
                    promoInfo.potongan}
                  . Total akhir Rp{" "}
                  {promoInfo.finalTotal?.toLocaleString?.("id-ID") ??
                    promoInfo.finalTotal}
                  .
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-3 py-1.5 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {isSubmitting ? "Memproses..." : "Lanjutkan ke Pembayaran"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserPaketPage;

