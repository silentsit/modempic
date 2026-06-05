import Link from "next/link";
import { listRecentAdminAudit } from "@/lib/admin/audit-log";

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function entityHref(entityType: string, entityId: string | null) {
  if (!entityId) return null;
  if (entityType === "order") return `/admin/orders/${entityId}`;
  if (entityType === "product") return `/admin/products/${entityId}`;
  return null;
}

export default async function AdminAuditPage() {
  const logs = await listRecentAdminAudit(100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1d2327]">Audit log</h1>
        <p className="mt-1 text-sm text-[#50575e]">Recent staff changes to products, orders, and catalog settings.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[11px] uppercase tracking-wider text-[#50575e]">
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Actor</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#787c82]">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const href = entityHref(log.entityType, log.entityId);
                return (
                  <tr key={log.id} className="border-b border-[#f0f0f1] align-top">
                    <td className="px-4 py-3 text-xs text-[#646970]">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-[#50575e]">{log.actorEmail ?? "Staff"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-[#1d2327]">
                      {log.action}
                      {href ? (
                        <>
                          {" "}
                          <Link href={href} className="font-normal text-[#2271b1] hover:underline">
                            view
                          </Link>
                        </>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#3c434a]">{log.summary}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
