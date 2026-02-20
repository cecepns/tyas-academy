import { useState } from "react";

const WA_NUMBER = "628998843311";

const Kontak = () => {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [subjek, setSubjek] = useState("");
  const [pesan, setPesan] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = [
      "*Pesan dari Website CardioDemy*",
      "",
      `Nama: ${nama.trim() || "-"}`,
      `Email: ${email.trim() || "-"}`,
      `Subjek: ${subjek.trim() || "-"}`,
      "",
      "Pesan:",
      pesan.trim() || "-",
    ].join("\n");
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="mb-8" data-aos="fade-up">
        <p className="text-sm md:text-base uppercase tracking-[0.2em] text-primary-500 mb-2">
          Kontak
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3">
          Hubungi Tim CardioDemy
        </h1>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed">
          Jika Anda tertarik mengimplementasikan sistem ini untuk lembaga
          bimbel, atau memiliki pertanyaan seputar fitur, silakan hubungi kami
          melalui form berikut. Pesan akan dikirim ke WhatsApp kami.
        </p>
      </div>

      <div
        className="bg-white rounded-xl border border-slate-100 shadow-sm p-5"
        data-aos="fade-up"
        data-aos-delay="80"
      >
        <form onSubmit={handleSubmit} className="grid gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
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
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Tulis pesan atau kebutuhan Anda"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary-600 text-white text-sm hover:bg-primary-700"
            >
              Kirim ke WhatsApp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Kontak;

