import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PlayCircle, FileText } from "lucide-react";
import api from "../../utils/apiClient";
import getFileBase from "../../utils/fileBase";

const UserMateriDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.state?.materi || null;
  const [materi, setMateri] = useState(initial);
  const [konten, setKonten] = useState([]);
  const [loading, setLoading] = useState(!initial);

  const fileBase = getFileBase();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/user/materi/${id}`);
        setMateri(res.data);
        setKonten(res.data?.konten || []);
      } catch (e) {
        navigate("/user/materi", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !materi) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Memuat materi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          {materi.judul_materi}
        </h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Materi ini berasal dari paket yang sudah kamu beli.
        </p>
      </div>

      {materi.banner_image && (
        <div className="w-full max-w-xl">
          <img
            src={`${fileBase}${materi.banner_image}`}
            alt={materi.judul_materi}
            className="w-full rounded-lg border border-slate-100 object-cover"
          />
        </div>
      )}

      {materi.deskripsi && (
        <p className="text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">{materi.deskripsi}</p>
      )}

      {konten.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            Konten Materi
          </p>
          <div className="space-y-2 text-sm">
            {konten.map((k) => (
              <div
                key={k.id}
                className="border border-slate-100 rounded-lg p-3 bg-white flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                  {k.tipe_materi === "video_link" ? (
                    <PlayCircle className="w-4 h-4 text-primary-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-primary-600" />
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-800">
                    {k.tipe_materi === "video_link" ? "Video" : "File PDF"}
                  </p>
                  {k.tipe_materi === "video_link" && k.video_link && (
                    <a
                      href={k.video_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline mt-0.5"
                    >
                      Buka video
                    </a>
                  )}
                  {k.tipe_materi === "pdf_file" && k.pdf_file && (
                    <a
                      href={`${fileBase}${k.pdf_file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline mt-0.5"
                    >
                      Buka PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMateriDetailPage;

