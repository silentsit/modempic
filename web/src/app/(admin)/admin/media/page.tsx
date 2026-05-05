import { prisma } from "@/lib/db";
import { createMediaAction, deleteMediaAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminMediaPage() {
  const list = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="text-2xl font-bold">Media library</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Log URLs to assets you already host (Blob, S3, etc.).</p>
      <ul className="mt-3 space-y-1 text-sm">
        {list.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2 break-all">
            <span>
              {m.filename} — {m.url}
            </span>
            <form action={deleteMediaAction}>
              <input type="hidden" name="id" value={m.id} />
              <Button type="submit" size="sm" variant="destructive">
                Delete
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-lg font-semibold">Add reference</h2>
      <form action={createMediaAction} className="mt-2 max-w-md space-y-2">
        <div>
          <Label htmlFor="url">URL</Label>
          <Input id="url" name="url" type="url" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="filename">Label</Label>
          <Input id="filename" name="filename" required className="mt-1" />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
