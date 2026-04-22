import { prisma } from "@/lib/db";
export default async function AdminEmailsPage() {
  const [logs, templates] = await Promise.all([prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }), prisma.emailTemplate.findMany()]);
  return (
    <div>
      <h1 className="text-2xl font-bold">Email automations & logs</h1>
      <h2 className="mt-4 text-sm font-medium">Templates (keys)</h2>
      <ul className="text-sm">
        {templates.map((t) => (
          <li key={t.id}>
            {t.key} — {t.active ? "on" : "off"} — {t.subject}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-sm font-medium">Recent sends</h2>
      <div className="mt-2 max-h-96 overflow-y-auto text-xs">
        {logs.map((l) => (
          <div key={l.id} className="border-b border-[var(--border)] py-1">
            {l.to} — {l.template} — {l.status} — {l.createdAt.toISOString()}
            {l.error ? <span className="text-red-600"> {l.error}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
