import { prisma } from "@/lib/db";
import { deleteEmailTemplateAction, upsertEmailTemplateAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EMAIL_APPEARANCE_STORE_KEY } from "@/lib/email/appearance-store";
import { EMAIL_CONTENT_STORE_KEY } from "@/lib/email/email-content-store";
import { normalizeEmailContentSettings } from "@/lib/email/email-content";
import { normalizeEmailAppearance } from "@/lib/email/email-appearance";
import { getSiteUrl } from "@/lib/site-url";
import { EmailCustomizer } from "./email-customizer";

export default async function AdminEmailsPage() {
  let logs: Awaited<ReturnType<typeof prisma.emailLog.findMany>> = [];
  let templates: Awaited<ReturnType<typeof prisma.emailTemplate.findMany>> = [];
  let appearanceValue: unknown = {};
  let contentValue: unknown = {};
  try {
    const [l, t, appearanceRow, contentRow] = await Promise.all([
      prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.emailTemplate.findMany(),
      prisma.storeSetting.findUnique({ where: { key: EMAIL_APPEARANCE_STORE_KEY } }),
      prisma.storeSetting.findUnique({ where: { key: EMAIL_CONTENT_STORE_KEY } }),
    ]);
    logs = l;
    templates = t;
    appearanceValue = appearanceRow?.value ?? {};
    contentValue = contentRow?.value ?? {};
  } catch (e) {
    console.error("[AdminEmailsPage] database load failed", e);
  }
  const initialAppearance = normalizeEmailAppearance(appearanceValue);
  const initialContent = normalizeEmailContentSettings(contentValue);
  const siteUrl = getSiteUrl();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#1d2327]">Emails</h1>
        <p className="mt-1 text-sm text-[#646970]">
          Email customizer — edit copy, preview by device, and send test emails.
        </p>
      </div>

      <section aria-labelledby="customizer-heading">
        <h2 id="customizer-heading" className="sr-only">
          Email customizer
        </h2>
        <EmailCustomizer
          initialAppearance={initialAppearance}
          initialContent={initialContent}
          siteUrl={siteUrl}
        />
      </section>

      <section>
        <h2 className="text-sm font-medium text-[#1d2327]">Templates (keys)</h2>
        <p className="mt-1 text-xs text-[#646970]">Internal automation keys — distinct from visual theme above.</p>
        <div className="mt-2 space-y-3 text-sm">
          {templates.map((t) => (
            <form key={t.id} action={upsertEmailTemplateAction} className="rounded-lg border border-[#dcdcde] bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
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
        <h3 className="mt-6 text-sm font-medium text-[#1d2327]">Create template</h3>
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
      </section>

      <section>
        <h2 className="text-sm font-medium text-[#1d2327]">Recent sends</h2>
        <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-[#dcdcde] bg-white text-xs shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          {logs.map((l) => (
            <div key={l.id} className="border-b border-[#f0f0f1] px-3 py-2 last:border-b-0">
              {l.to} — {l.template} — {l.status} — {l.createdAt.toISOString()}
              {l.error ? <span className="text-red-600"> {l.error}</span> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
