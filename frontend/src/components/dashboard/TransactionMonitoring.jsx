import { MaterialIcon } from "@/components/ui/Icons";

export default function TransactionMonitoring({ stats }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-main">Monitoring Transaksi</h2>
      
      <div className="bg-card/50 border border-surface rounded-2xl divide-y divide-surface">
        {/* Total Transaksi */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 text-primary-light rounded-lg">
              <MaterialIcon name="payments" />
            </div>
            <h3 className="text-main text-sm font-semibold">Total Transaksi</h3>
          </div>
          <span className="text-lg font-bold text-main">
            {stats?.total_transactions || 0}
          </span>
        </div>

        {/* Revenue */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
              <MaterialIcon name="trending_up" />
            </div>
            <h3 className="text-main text-sm font-semibold">Revenue Platform</h3>
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
              <h3 className="text-main text-sm font-semibold">Total Komisi</h3>
              <p className="text-xs text-muted">Pemasukan bersih</p>
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