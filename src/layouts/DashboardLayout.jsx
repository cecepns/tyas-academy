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
  ShoppingBag
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
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
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold">
              TA
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  CardioDemy
                </p>
                <p className="text-[11px] text-slate-500 capitalize">
                  {role} dashboard
                </p>
              </div>
            )}
          </div>
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
        <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
          {menu.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={index === 0}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-slate-50 ${
                    isActive
                      ? "bg-primary-50 text-primary-700 border border-primary-100"
                      : "text-slate-600"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 px-3 py-3 text-xs text-slate-500">
          {!collapsed && (
            <div className="mb-2">
              <p className="font-semibold text-slate-700 text-xs">
                {user?.name}
              </p>
              <p className="text-[11px]">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-slate-600 hover:bg-slate-50 text-xs"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4">
          <h1 className="text-sm font-semibold text-slate-800">
            {role === "admin" ? "Admin Dashboard" : "User Dashboard"}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

