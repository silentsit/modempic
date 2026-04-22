import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AddressForm } from "./form";
import { deleteAddressAction } from "@/lib/actions/address";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await auth();
  const list = await prisma.address.findMany({
    where: { userId: session!.user.id },
    orderBy: { id: "desc" },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold">Addresses</h2>
      {list.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {list.map((a) => (
            <li key={a.id} className="rounded-xl border border-[var(--border)] p-4 text-sm">
              <p className="font-medium">
                {a.label ?? "Address"} {a.isDefaultShipping ? "· Default ship" : null}{" "}
                {a.isDefaultBilling ? "· Default bill" : null}
              </p>
              <p className="mt-1 text-[var(--muted-foreground)]">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 ? <>{/* */}<br />{a.line2}</> : null}
                <br />
                {a.city}, {a.state} {a.postal}
              </p>
              <form action={deleteAddressAction} className="mt-2">
                <input type="hidden" name="id" value={a.id} />
                <Button type="submit" variant="ghost" size="sm" className="h-8 text-red-600">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      <h3 className="mt-8 text-sm font-medium uppercase text-[var(--muted-foreground)]">Add address</h3>
      <div className="mt-2 max-w-md">
        <AddressForm />
      </div>
    </div>
  );
}
