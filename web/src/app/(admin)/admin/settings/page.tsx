import { prisma } from "@/lib/db";
import { deleteStoreSettingAction, setStoreSettingAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminSettingsPage() {
  const settings = await prisma.storeSetting.findMany({ orderBy: { key: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Store settings</h1>
      <p className="text-sm text-[var(--muted-foreground)]">JSON value per key (payment, email, feature flags)</p>
      <ul className="mt-4 space-y-2 text-sm">
        {settings.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span>
              {s.key} = {JSON.stringify(s.value)}
            </span>
            <form action={deleteStoreSettingAction}>
              <input type="hidden" name="key" value={s.key} />
              <Button type="submit" size="sm" variant="destructive">
                Delete
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-lg font-semibold">Set / update</h2>
      <form action={setStoreSettingAction} className="mt-2 max-w-xl space-y-2">
        <div>
          <Label htmlFor="key">Key</Label>
          <Input id="key" name="key" required placeholder="payment.guardarian.mode" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="value">Value (JSON)</Label>
          <Textarea id="value" name="value" required rows={4} className="mt-1 font-mono text-sm" defaultValue='{"mode":"sandbox"}' />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
