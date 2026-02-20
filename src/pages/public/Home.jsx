import { Link } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, ListChecks, Shield, Users } from "lucide-react";
import heroImg from "../../assets/hero.png";
import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";
import "swiper/css";
import "swiper/css/pagination";

const Home = () => {
  const [overview, setOverview] = useState(null);
  const [testimoni, setTestimoni] = useState([]);
  const [paket, setPaket] = useState([]);
  const testimoniSwiperRef = useRef(null);

  const fileBase = useMemo(() => getFileBase(), []);

  useEffect(() => {
    const load = async () => {
      try {
        const [oRes, tRes, pRes] = await Promise.all([
          api.get("/public/overview"),
          api.get("/public/testimoni"),
          api.get("/public/paket", {
            params: { page: 1, limit: 6 },
          }),
        ]);
        setOverview(oRes.data);
        setTestimoni(tRes.data);
        setPaket(pRes.data?.data || []);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  return (
    <div>
      <section className="bg-transparent">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div data-aos="fade-right">
            <p className="text-base uppercase tracking-[0.2em] text-primary-600 mb-3 font-medium">
              Bimbel Online & Tryout
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold mb-4 leading-tight text-slate-800">
              Raih Mimpimu Jadi{" "}
              <span className="text-primary-600">ASN & Kedinasan</span> bersama{" "}
              <span className="text-amber-500">CardioDemy</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 mb-6 leading-relaxed">
              Bimbingan belajar online terlengkap untuk persiapan CPNS, PPPK,
              Sekolah Kedinasan, dan UKOM. Belajar kapan saja, di mana saja!.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-full bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
              >
                Daftar Sekarang
              </Link>
              <Link
                to="/layanan"
                className="px-5 py-2.5 rounded-full border-2 border-primary-500 text-primary-600 text-sm font-medium hover:bg-primary-50"
              >
                Lihat Layanan
              </Link>
            </div>
          </div>
          <div data-aos="fade-left">
            <div className="rounded-xl p-4 backdrop-blur flex items-center justify-center">
              <img
                src={heroImg}
                alt="Tyas Widi Rahayu - CardioDemy"
                className="w-full h-full object-cover drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section video & highlight platform */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div
            className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
            data-aos="fade-right"
          >
            <div className="relative w-full pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/HqCQZQ5Zp8M?rel=0&modestbranding=1"
                title="CardioDemy - YouTube"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
          <div data-aos="fade-left">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 text-xs md:text-sm text-primary-700 font-medium mb-3">
              ✨ Tentang Kami
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-3">
              Platform Bimbel Online{" "}
              <span className="text-primary-600">Terpercaya</span> &{" "}
              <span className="text-primary-600">Berkualitas</span>
            </h2>
            <p className="text-base text-slate-600 mb-4 leading-relaxed">
              CardioDemy hadir sebagai solusi terbaik bagi pejuang NIP dan
              Sekolah Kedinasan. Kami berkomitmen memberikan pendampingan
              belajar yang intensif, update, dan terarah untuk membantumu meraih
              impian menjadi ASN.
            </p>
            <ul className="space-y-2 text-base text-slate-600 mb-5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </span>
                <div>
                  <p className="font-medium text-slate-800 text-base">Materi Terupdate</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Kisi-kisi sesuai regulasi terbaru untuk CPNS, PPPK, dan
                    Kedinasan.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </span>
                <div>
                  <p className="font-medium text-slate-800 text-base">
                    Pengajar Berpengalaman
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Dibimbing langsung oleh Kak Tyas dan tim pengajar
                    profesional.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </span>
                <div>
                  <p className="font-medium text-slate-800 text-base">
                    Metode Belajar yang Fun
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Pembelajaran interaktif, tidak membosankan, dan mudah
                    dipahami.
                  </p>
                </div>
              </li>
            </ul>
            <Link
              to="/layanan"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 text-white text-base font-medium hover:bg-primary-700"
            >
              Pelajari Lebih Lanjut
              <span className="text-base leading-none">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div
          className="grid md:grid-cols-3 gap-6 mb-10"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">
              Bimbel Online
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              Ikuti bimbel online langsung bersama Kak Tyas untuk pendampingan
              intensif.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <ListChecks className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">
              Paket Try Out
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              Try out sesuai kisi-kisi terbaru untuk persiapan ujian CPNS,
              Sekolah Kedinasan, PPPK, dan UKOM.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">
              Video Pembelajaran
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              Video interaktif dan menyenangkan yang terhubung langsung ke
              YouTube CardioDemy.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">
              Materi PDF &amp; Video
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              Materi teks dan video sebagai bahan belajar kapan pun dan di mana
              pun.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">
              Komunitas &amp; Testimoni
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              Bergabung dengan komunitas dan lihat kisah sukses peserta yang
              lulus bersama CardioDemy.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">
              Pendampingan Berkelanjutan
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              Update materi dan bimbingan rutin agar progres belajar tetap
              terarah.
            </p>
          </div>
        </div>

        {paket.length > 0 && (
          <div className="mb-10" data-aos="fade-up" data-aos-delay="80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                Paket Layanan CardioDemy
              </h2>
              <Link
                to="/layanan"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Lihat semua paket
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paket.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
                >
                  {p.cover_image && (
                    <div className="h-44 w-full overflow-hidden">
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
                      <Link
                        to="/login"
                        className="text-sm px-3 py-1.5 rounded-full border border-primary-500 text-primary-600 hover:bg-primary-50"
                      >
                        Beli Paket
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {testimoni.length > 0 && (
          <div className="mt-12" data-aos="fade-up" data-aos-delay="150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-800">
                Cerita Sukses Peserta
              </h2>
              <Link
                to="/testimoni"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Lihat semua
              </Link>
            </div>
            <div className="relative pt-16 md:pt-0 px-4 md:px-6">
              <button
                type="button"
                onClick={() => testimoniSwiperRef.current?.swiper?.slidePrev()}
                className="absolute top-2 left-1/2 -translate-x-14 md:left-0 md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-slate-200 text-primary-600 flex items-center justify-center hover:bg-primary-50 hover:border-primary-200 transition shadow-sm touch-manipulation active:scale-95"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => testimoniSwiperRef.current?.swiper?.slideNext()}
                className="absolute top-2 left-1/2 translate-x-2 md:left-auto md:right-0 md:top-1/2 md:translate-x-0 md:-translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-slate-200 text-primary-600 flex items-center justify-center hover:bg-primary-50 hover:border-primary-200 transition shadow-sm touch-manipulation active:scale-95"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <Swiper
                ref={testimoniSwiperRef}
                modules={[Pagination, Autoplay]}
                spaceBetween={16}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop
                className="testimoni-swiper !pb-12"
              >
              {testimoni.slice(0, 6).map((t, idx) => (
                <SwiperSlide key={idx.toString()}>
                  <div className="bg-white rounded-xl border border-slate-100 p-4 h-full flex flex-col min-h-[180px]">
                    <div className="flex items-center gap-3 mb-3">
                      {t.foto ? (
                        <div className="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden border border-slate-100 bg-slate-50">
                          <img
                            src={`${fileBase}${t.foto}`}
                            alt={t.nama}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-primary-100 text-primary-700">
                          <span className="text-xs font-semibold leading-none select-none">
                            {t.nama?.[0]}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium text-slate-800 truncate">
                          {t.nama}
                        </p>
                        <p className="text-xs text-amber-500">Peserta</p>
                      </div>
                    </div>
                    <p className="text-base text-slate-600 leading-relaxed flex-1">{t.testimoni}</p>
                  </div>
                </SwiperSlide>
              ))}
              </Swiper>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
