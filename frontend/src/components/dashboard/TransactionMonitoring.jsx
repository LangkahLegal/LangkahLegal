import { MaterialIcon } from "@/components/ui/Icons";

export default function TransactionMonitoring({ stats }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-white">Monitoring Transaksi</h2>
      
      <div className="bg-[#1f1d35]/50 border border-white/5 rounded-2xl divide-y divide-white/5">
        {/* Total Transaksi */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6f59fe]/20 text-[#ada3ff] rounded-lg">
              <MaterialIcon name="payments" />
            </div>
            <h3 className="text-white text-sm font-semibold">Total Transaksi</h3>
          </div>
          <span className="text-lg font-bold text-white">
            {stats?.total_transactions || 0}
          </span>
        </div>

        {/* Revenue */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
              <MaterialIcon name="trending_up" />
            </div>
            <h3 className="text-white text-sm font-semibold">Revenue Platform</h3>
          </div>
          <span className="text-md sm:text-lg font-bold text-green-400">
            Rp {Number(stats?.total_revenue || 0).toLocaleString("id-ID")}
          </span>
        </div>

        {/* Komisi */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <MaterialIcon name="account_balance_wallet" />
            </div>
            <div>
              <h3 className="text-white text-sm font-semibold">Total Komisi</h3>
              <p className="text-xs text-[#aca8c1]">Pemasukan bersih</p>
            </div>
          </div>
          <span className="text-md sm:text-lg font-bold text-blue-400">
            Rp {Number(stats?.total_commission || 0).toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </section>
  );
}