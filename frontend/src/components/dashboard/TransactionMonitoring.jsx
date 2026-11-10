import { MaterialIcon } from "@/components/ui/Icons";

export default function TransactionMonitoring({ stats }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-main">Monitoring Transaksi</h2>
      
      <div className="bg-card border border-surface rounded-2xl divide-y divide-surface shadow-soft">
        {/* Total Transaksi */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-soft text-primary-text rounded-lg">
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
            <div className="p-2 bg-sage-soft text-sage-text rounded-lg">
              <MaterialIcon name="trending_up" />
            </div>
            <h3 className="text-main text-sm font-semibold">Revenue Platform</h3>
          </div>
          <span className="text-md sm:text-lg font-bold text-sage-text">
            Rp {Number(stats?.total_revenue || 0).toLocaleString("id-ID")}
          </span>
        </div>

        {/* Komisi */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-soft text-info-text rounded-lg">
              <MaterialIcon name="account_balance_wallet" />
            </div>
            <div>
              <h3 className="text-main text-sm font-semibold">Total Komisi</h3>
              <p className="text-xs text-muted">Pemasukan bersih</p>
            </div>
          </div>
          <span className="text-md sm:text-lg font-bold text-info-text">
            Rp {Number(stats?.total_commission || 0).toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </section>
  );
}