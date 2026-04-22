import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { updatedAt: "desc" }, include: { images: { take: 1 } } });
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          New product
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Price</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2">Best</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)]">
                <td className="py-2 pr-2">
                  <Link href={`/admin/products/${p.id}`} className="text-[var(--primary)] hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="py-2 pr-2">{formatUsd(p.priceCents)}</td>
                <td className="py-2 pr-2">{p.status}</td>
                <td className="py-2">{p.isBestSeller ? "Yes" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
