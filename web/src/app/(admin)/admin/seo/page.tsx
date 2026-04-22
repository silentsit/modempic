import { prisma } from "@/lib/db";
import { setStoreSettingAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
export default async function AdminSeoPage() {
  const [cats, products, settings] = await Promise.all([
    prisma.category.findMany(),
    prisma.product.findMany({ take: 50 }),
    prisma.storeSetting.findMany(),
  ]);
  return (
    <div>
      <h1 className="text-2xl font-bold">SEO controls</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Defaults + per-entity title/description in catalog.</p>
      <h2 className="mt-4 font-medium">Default metadata (StoreSetting JSON)</h2>
      <form action={setStoreSettingAction} className="mt-2 max-w-xl space-y-2">
        <input type="hidden" name="key" value="seo.defaults" />
        <Label htmlFor="v">Value</Label>
        <Textarea
          id="v"
          name="value"
          rows={3}
          className="font-mono text-sm"
          defaultValue={JSON.stringify(
            (settings.find((s) => s.key === "seo.defaults")?.value as object) ?? { title: "Modempic", desc: "..." },
            null,
            2,
          )}
        />
        <Button type="submit" size="sm" variant="secondary">
          Save defaults
        </Button>
      </form>
      <h2 className="mt-6 text-sm font-medium">Categories (edit in DB or add admin CRUD later)</h2>
      <ul className="mt-1 text-xs text-[var(--muted-foreground)]">
        {cats.map((c) => (
          <li key={c.id}>
            {c.slug} — {c.seoTitle ?? c.name}
          </li>
        ))}
      </ul>
      <h2 className="mt-4 text-sm font-medium">Sample products</h2>
      <ul className="mt-1 text-xs text-[var(--muted-foreground)]">
        {products.slice(0, 10).map((p) => (
          <li key={p.id}>
            {p.slug} — {p.seoTitle ?? p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
