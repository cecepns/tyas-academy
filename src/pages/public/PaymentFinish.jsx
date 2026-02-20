import { useLocation, Link } from "react-router-dom";

const PaymentFinish = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const orderId = params.get("order_id");
  const statusCode = params.get("status_code");
  const transactionStatus = params.get("transaction_status");

  const isSuccess =
    transactionStatus === "capture" ||
    transactionStatus === "settlement" ||
    statusCode === "200";

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm px-6 py-8">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
          {isSuccess ? "Pembayaran Berhasil" : "Status Pembayaran"}
        </h1>
        <p className="text-base text-slate-500 mb-4 leading-relaxed">
          {isSuccess
            ? "Terima kasih, pembayaran Anda telah diproses. Akses paket akan segera aktif."
            : "Kami menerima respon dari Midtrans. Jika status belum jelas, silakan cek riwayat transaksi Anda."}
        </p>
        {orderId && (
          <p className="text-sm text-slate-500 mb-1">
            Kode Pesanan: <span className="font-semibold">{orderId}</span>
          </p>
        )}
        {transactionStatus && (
          <p className="text-sm text-slate-500 mb-4">
            Status Transaksi:{" "}
            <span className="font-semibold">{transactionStatus}</span>
          </p>
        )}
        <div className="flex flex-col gap-2 mt-2">
          <Link
            to="/user/transaksi"
            className="w-full px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            Lihat Riwayat Transaksi
          </Link>
          <Link
            to="/user"
            className="w-full px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFinish;

