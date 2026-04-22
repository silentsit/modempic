import { setStoreSettingAction } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default async function AdminCampaignsPage() {
  const c = await prisma.storeSetting.findUnique({ where: { key: "campaign.main" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Social proof / campaigns</h1>
      <p className="text-sm text-[var(--muted-foreground)]">JSON snippets for hero bars, UGC quotes, and timed banners.</p>
      <form action={setStoreSettingAction} className="mt-4 max-w-xl space-y-2">
        <input type="hidden" name="key" value="campaign.main" />
        <Label htmlFor="value">Campaign JSON</Label>
        <Textarea
          id="value"
          name="value"
          rows={6}
          className="font-mono text-sm"
          defaultValue={JSON.stringify(c?.value ?? { message: "Free US shipping on orders $50+" }, null, 2)}
        />
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
