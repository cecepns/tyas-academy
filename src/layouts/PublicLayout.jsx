import { Link, NavLink, Outlet } from "react-router-dom";
import { BookOpen, GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Logo from '../assets/logo.webp'
import AOS from "aos";

const PublicLayout = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/layanan", label: "Layanan" },
    { to: "/testimoni", label: "Testimoni" },
    { to: "/kontak", label: "Kontak" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-14 h-auto">
              <img src={Logo} alt="Tyas Academy" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Tyas Academy</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `hover:text-primary-600 transition ${
                    isActive ? "text-primary-600 font-medium" : "text-slate-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="px-4 py-2 rounded-full border border-primary-500 text-primary-600 text-sm hover:bg-primary-50"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-full bg-primary-600 text-white text-sm hover:bg-primary-700 flex items-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              Daftar Bimbel
            </Link>
          </nav>
          <button
            className="md:hidden text-slate-700"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4">
            <nav className="flex flex-col gap-2 text-sm mt-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded hover:bg-slate-50 ${
                      isActive
                        ? "text-primary-600 font-medium"
                        : "text-slate-700"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex gap-2 mt-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-3 py-2 text-center rounded border border-primary-500 text-primary-600 text-sm"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-3 py-2 text-center rounded bg-primary-600 text-white text-sm"
                >
                  Daftar
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-100 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Tyas Academy. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            Sistem Informasi Bimbel Online.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

