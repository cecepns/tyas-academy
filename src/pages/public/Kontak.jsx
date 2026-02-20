const Kontak = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="mb-8" data-aos="fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-500 mb-2">
          Kontak
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-3">
          Hubungi Tim Tyas Academy
        </h1>
        <p className="text-sm text-slate-600">
          Jika Anda tertarik mengimplementasikan sistem ini untuk lembaga
          bimbel, atau memiliki pertanyaan seputar fitur, silakan hubungi kami
          melalui form berikut.
        </p>
      </div>

      <div
        className="bg-white rounded-xl border border-slate-100 shadow-sm p-5"
        data-aos="fade-up"
        data-aos-delay="80"
      >
        <form className="grid gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Nama Anda"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="email@contoh.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Subjek
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Contoh: Implementasi sistem di lembaga kami"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pesan
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Tulis pesan atau kebutuhan Anda"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded bg-primary-600 text-white text-sm hover:bg-primary-700"
            >
              Kirim Pesan (Dummy)
            </button>
          </div>
        </form>
        <p className="text-[11px] text-slate-400 mt-3">
          Form ini hanya contoh tampilan. Integrasi ke backend dapat ditambahkan
          sesuai kebutuhan.
        </p>
      </div>
    </div>
  );
};

export default Kontak;

