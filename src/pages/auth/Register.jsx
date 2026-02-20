import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/common/ToastContext";
import logo from "../../assets/logo.webp";

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { show } = useToast();

  const onSubmit = async (values) => {
    try {
      await registerUser(values);
      show("success", "Registrasi berhasil");
      navigate("/user");
    } catch (e) {
      show("error", e.response?.data?.message || "Gagal registrasi");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-10">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-100 mb-2 bg-slate-50 flex items-center justify-center">
            <img
              src={logo}
              alt="Tyas Academy"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-primary-500">
            Tyas Academy
          </p>
        </div>
        <h1 className="text-lg font-semibold text-slate-900 mb-1 text-center">
          Daftar User Baru
        </h1>
        <p className="text-xs text-slate-500 mb-5 text-center">
          Buat akun untuk mengakses bimbel, materi, dan tryout.
        </p>
        <form className="space-y-4 text-sm" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              {...register("name", { required: "Nama wajib diisi" })}
            />
            {errors.name && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              {...register("email", { required: "Email wajib diisi" })}
            />
            {errors.email && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              {...register("password", {
                required: "Password wajib diisi",
                minLength: {
                  value: 6,
                  message: "Minimal 6 karakter",
                },
              })}
            />
            {errors.password && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 rounded bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-60"
          >
            {isSubmitting ? "Memproses..." : "Daftar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;

