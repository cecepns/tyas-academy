import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Testimoni = () => {
  const [items, setItems] = useState([]);
  const fileBase = useMemo(() => getFileBase(), []);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

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
        <p className="text-base uppercase tracking-[0.2em] text-primary-500 mb-2">
          Testimoni
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3">
          Apa Kata Peserta tentang CardioDemy
        </h1>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed">
          Testimoni Peserta yang telah mengikuti bimbel, materi, dan tryout
          melalui sistem CardioDemy.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-base text-slate-500" data-aos="fade-up" data-aos-delay="80">
          Belum ada testimoni yang ditampilkan.
        </p>
      ) : (
        <div
          className="relative pt-16 md:pt-0 px-4 md:px-6"
          data-aos="fade-up"
          data-aos-delay="80"
        >
          <button
            ref={prevRef}
            type="button"
            className="absolute top-2 left-1/2 -translate-x-14 md:left-0 md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-slate-200 text-primary-600 flex items-center justify-center hover:bg-primary-50 hover:border-primary-200 transition shadow-sm"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <button
            ref={nextRef}
            type="button"
            className="absolute top-2 left-1/2 translate-x-2 md:left-auto md:right-0 md:top-1/2 md:translate-x-0 md:-translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-slate-200 text-primary-600 flex items-center justify-center hover:bg-primary-50 hover:border-primary-200 transition shadow-sm"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop
            className="testimoni-swiper !pb-12"
          >
            {items.map((t, idx) => (
              <SwiperSlide key={idx.toString()}>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 h-full flex flex-col min-h-[180px]">
                  <div className="flex items-center gap-3">
                    {t.foto ? (
                      <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden border border-slate-100 bg-slate-50">
                        <img
                          src={`${fileBase}${t.foto}`}
                          alt={t.nama}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-primary-100 text-primary-700">
                        <span className="text-sm font-semibold leading-none select-none">
                          {t.nama?.[0]}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-medium text-slate-800 truncate">
                        {t.nama}
                      </p>
                      <p className="text-xs md:text-sm text-amber-500">
                        Peserta
                      </p>
                    </div>
                  </div>
                  <p className="text-base text-slate-600 leading-relaxed flex-1 mt-3">
                    {t.testimoni}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};

export default Testimoni;

