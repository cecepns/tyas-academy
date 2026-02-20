import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";

const UserResourcesPage = ({ type }) => {
  const [data, setData] = useState({ bimbel: [], materi: [], tryout: [] });
  const [loading, setLoading] = useState(false);
  const fileBase = useMemo(() => getFileBase(), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/user/resources");
        setData(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const section =
    type === "bimbel"
      ? data.bimbel
      : type === "materi"
      ? data.materi
      : data.tryout;

  const titleMap = {
    bimbel: "Bimbel",
    materi: "Materi",
    tryout: "Tryout",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {titleMap[type]}
        </h1>
        <p className="text-xs text-slate-500">
          Daftar {titleMap[type].toLowerCase()} yang bisa kamu akses dari paket
          yang sudah dibeli.
        </p>
      </div>

      {loading && <p className="text-xs text-slate-500">Memuat data...</p>}
      {!loading && section.length === 0 && (
        <p className="text-xs text-slate-500">
          Belum ada {titleMap[type].toLowerCase()} yang bisa diakses.
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {type === "bimbel" &&
          section.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden"
            >
              {b.cover_image && (
                <div className="h-28 w-full overflow-hidden border-b border-slate-100">
                  <img
                    src={`${fileBase}${b.cover_image}`}
                    alt={b.judul_bimbel}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {b.judul_bimbel}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Link meeting:{" "}
                  <a
                    href={b.link_meeting}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 underline"
                  >
                    {b.link_meeting}
                  </a>
                </p>
                {b.catatan_meeting && (
                  <p className="text-[11px] text-slate-500 mt-1 whitespace-pre-line">
                    {b.catatan_meeting}
                  </p>
                )}
              </div>
            </div>
          ))}

        {type === "materi" &&
          section.map((m) => (
            <Link
              key={m.id}
              to={`/user/materi/${m.id}`}
              state={{ materi: m }}
              className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden hover:border-primary-200 hover:shadow-md transition"
            >
              {m.banner_image && (
                <div className="h-28 w-full overflow-hidden border-b border-slate-100">
                  <img
                    src={`${fileBase}${m.banner_image}`}
                    alt={m.judul_materi}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {m.judul_materi}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {m.deskripsi}
                </p>
                <p className="text-[11px] text-primary-600 mt-2">
                  Lihat detail materi →
                </p>
              </div>
            </Link>
          ))}

        {type === "tryout" &&
          section.map((t) => (
            <Link
              key={t.id}
              to={`/user/tryout/${t.id}`}
              state={{ tryout: t }}
              className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden hover:border-primary-200 hover:shadow-md transition"
            >
              {t.banner_image && (
                <div className="h-28 w-full overflow-hidden border-b border-slate-100">
                  <img
                    src={`${fileBase}${t.banner_image}`}
                    alt={t.judul_tryout}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {t.judul_tryout}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Durasi: {t.durasi} menit
                </p>
                <p className="text-[11px] text-primary-600 mt-2">
                  Buka detail tryout →
                </p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default UserResourcesPage;

