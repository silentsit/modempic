import { prisma } from "@/lib/db";
import { deleteEmailTemplateAction, upsertEmailTemplateAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export default async function AdminEmailsPage() {
  const [logs, templates] = await Promise.all([prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }), prisma.emailTemplate.findMany()]);
  return (
    <div>
      <h1 className="text-2xl font-bold">Email automations & logs</h1>
      <h2 className="mt-4 text-sm font-medium">Templates (keys)</h2>
      <div className="mt-2 space-y-3 text-sm">
        {templates.map((t) => (
          <form key={t.id} action={upsertEmailTemplateAction} className="rounded-lg border border-[var(--border)] p-3">
            <input type="hidden" name="id" value={t.id} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input name="key" defaultValue={t.key} aria-label="Template key" required />
              <Input name="subject" defaultValue={t.subject} aria-label="Subject" required />
            </div>
            <Textarea name="bodyHint" defaultValue={t.bodyHint ?? ""} rows={3} className="mt-2" aria-label="Body hint" />
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" name="active" defaultChecked={t.active} className="h-4 w-4" />
              Active
            </label>
            <div className="mt-3 flex gap-2">
              <Button type="submit" size="sm" variant="secondary">
                Save
              </Button>
              <Button formAction={deleteEmailTemplateAction} type="submit" size="sm" variant="destructive">
                Delete
              </Button>
            </div>
          </form>
        ))}
      </div>
      <h2 className="mt-6 text-sm font-medium">Create template</h2>
      <form action={upsertEmailTemplateAction} className="mt-2 max-w-xl space-y-2">
        <Input name="key" placeholder="order.confirmation" required />
        <Input name="subject" placeholder="Subject" required />
        <Textarea name="bodyHint" placeholder="Body hint or internal notes" rows={3} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
          Active
        </label>
        <Button type="submit">Create template</Button>
      </form>
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
