import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  ListChecks,
  BookOpen,
  GraduationCap,
  Package,
  Receipt,
  MessageCircle,
  Percent,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const adminMenu = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "Manajemen User", icon: Users },
    { to: "/admin/tipe-soal", label: "Tipe Soal", icon: ListChecks },
    { to: "/admin/bank-soal", label: "Bank Soal", icon: FileText },
    { to: "/admin/tryout", label: "Try Out", icon: ListChecks },
    { to: "/admin/materi", label: "Materi", icon: BookOpen },
    { to: "/admin/bimbel", label: "Bimbel", icon: GraduationCap },
    { to: "/admin/paket", label: "Paket", icon: Package },
    { to: "/admin/transaksi", label: "Transaksi", icon: Receipt },
    { to: "/admin/testimoni", label: "Testimoni", icon: MessageCircle },
    { to: "/admin/kode-promo", label: "Kode Promo", icon: Percent }
  ];

  const userMenu = [
    { to: "/user", label: "Dashboard", icon: LayoutDashboard },
    { to: "/user/paket", label: "Beli Paket", icon: ShoppingBag },
    { to: "/user/bimbel", label: "Bimbel", icon: GraduationCap },
    { to: "/user/materi", label: "Materi", icon: BookOpen },
    { to: "/user/tryout", label: "Try Out", icon: ListChecks },
    { to: "/user/transaksi", label: "Transaksi", icon: Receipt }
  ];

  const menu = role === "admin" ? adminMenu : userMenu;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-50 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`bg-white/95 backdrop-blur border-r border-slate-200 shadow-sm flex flex-col transition-all duration-200 ease-out
          fixed md:relative inset-y-0 left-0 z-50 w-64
          ${collapsed ? "md:w-16" : "md:w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
              TA
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900 truncate">
                  CardioDemy
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {role} dashboard
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setMobileOpen(false)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 text-base">
          {menu.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={index === 0}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition ${
                    isActive
                      ? "bg-primary-50 text-primary-700 border border-primary-100 shadow-sm"
                      : "text-slate-600"
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {(!collapsed || mobileOpen) && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 px-3 py-4 text-sm text-slate-500 shrink-0">
          {(!collapsed || mobileOpen) && (
            <div className="mb-3">
              <p className="font-semibold text-slate-700 text-sm truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base md:text-lg font-semibold text-slate-800 truncate">
              {role === "admin" ? "Admin Dashboard" : "Dashboard Belajar"}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

