import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";

const Testimoni = () => {
  const [items, setItems] = useState([]);
  const fileBase = useMemo(() => getFileBase(), []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/public/testimoni");
        setItems(res.data);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
      <div className="max-w-2xl mb-8" data-aos="fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-500 mb-2">
          Testimoni
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-3">
          Apa Kata Peserta tentang CardioDemy
        </h1>
        <p className="text-sm text-slate-600">
          Testimoni Peserta yang telah mengikuti bimbel, materi, dan tryout
          melalui sistem CardioDemy.
        </p>
      </div>

      <div
        className="grid md:grid-cols-3 gap-4"
        data-aos="fade-up"
        data-aos-delay="80"
      >
        {items.length === 0 && (
          <p className="text-xs text-slate-500">
            Belum ada testimoni yang ditampilkan.
          </p>
        )}
        {items.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              {t.foto ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-50">
                  <img
                    src={`${fileBase}${t.foto}`}
                    alt={t.nama}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">
                  {t.nama?.[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-800">{t.nama}</p>
                <p className="text-[11px] text-amber-500">Peserta</p>
              </div>
              <div className="ml-auto text-primary-500">
                <MessageCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-600">{t.testimoni}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimoni;

