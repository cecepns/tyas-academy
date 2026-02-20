import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/common/ToastContext";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import Home from "./pages/public/Home";
import Layanan from "./pages/public/Layanan";
import Testimoni from "./pages/public/Testimoni";
import Kontak from "./pages/public/Kontak";
import PaymentFinish from "./pages/public/PaymentFinish";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DashboardOverview from "./pages/admin/DashboardOverview";
import UsersPage from "./pages/admin/UsersPage";
import TipeSoalPage from "./pages/admin/TipeSoalPage";
import BankSoalPage from "./pages/admin/BankSoalPage";
import TryoutPage from "./pages/admin/TryoutPage";
import MateriPage from "./pages/admin/MateriPage";
import BimbelPage from "./pages/admin/BimbelPage";
import PaketPage from "./pages/admin/PaketPage";
import TransaksiPage from "./pages/admin/TransaksiPage";
import TestimoniPage from "./pages/admin/TestimoniPage";
import KodePromoPage from "./pages/admin/KodePromoPage";
import UserDashboard from "./pages/user/UserDashboard";
import UserPaketPage from "./pages/user/UserPaketPage";
import UserResourcesPage from "./pages/user/UserResourcesPage";
import UserTransaksiPage from "./pages/user/UserTransaksiPage";
import UserMateriDetailPage from "./pages/user/UserMateriDetailPage";
import UserTryoutDetailPage from "./pages/user/UserTryoutDetailPage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Landing */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/layanan" element={<Layanan />} />
            <Route path="/testimoni" element={<Testimoni />} />
            <Route path="/kontak" element={<Kontak />} />
            <Route path="/payment/finish" element={<PaymentFinish />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout role="admin" />}>
              <Route path="/admin" element={<DashboardOverview />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/tipe-soal" element={<TipeSoalPage />} />
              <Route path="/admin/bank-soal" element={<BankSoalPage />} />
              <Route path="/admin/tryout" element={<TryoutPage />} />
              <Route path="/admin/materi" element={<MateriPage />} />
              <Route path="/admin/bimbel" element={<BimbelPage />} />
              <Route path="/admin/paket" element={<PaketPage />} />
              <Route path="/admin/transaksi" element={<TransaksiPage />} />
              <Route path="/admin/testimoni" element={<TestimoniPage />} />
              <Route path="/admin/kode-promo" element={<KodePromoPage />} />
            </Route>
          </Route>

          {/* User */}
          <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
            <Route element={<DashboardLayout role="user" />}>
              <Route path="/user" element={<UserDashboard />} />
              <Route path="/user/paket" element={<UserPaketPage />} />
              <Route
                path="/user/tryout"
                element={<UserResourcesPage type="tryout" />}
              />
              <Route
                path="/user/tryout/:id"
                element={<UserTryoutDetailPage />}
              />
              <Route
                path="/user/bimbel"
                element={<UserResourcesPage type="bimbel" />}
              />
              <Route
                path="/user/materi"
                element={<UserResourcesPage type="materi" />}
              />
              <Route
                path="/user/materi/:id"
                element={<UserMateriDetailPage />}
              />
              <Route path="/user/transaksi" element={<UserTransaksiPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

