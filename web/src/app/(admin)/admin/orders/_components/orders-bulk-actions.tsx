"use client";

import { useRef, useTransition } from "react";
import { bulkDeleteOrdersAction, bulkSetOrderStatusAction } from "@/lib/actions/admin";

export function OrdersBulkActions({ checkboxFormId }: { checkboxFormId: string }) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [pending, startTransition] = useTransition();

  function onApply() {
    const action = selectRef.current?.value ?? "";
    if (!action) return;

    const checked = document.querySelectorAll<HTMLInputElement>(
      `input[name="orderIds"][form="${checkboxFormId}"]:checked`,
    );
    const ids = [...checked].map((el) => el.value).filter(Boolean);
    if (!ids.length) {
      window.alert("Select at least one order.");
      return;
    }

    if (action === "delete") {
      if (!window.confirm(`Delete ${ids.length} selected order(s)? This cannot be undone.`)) return;
      const fd = new FormData();
      for (const id of ids) fd.append("orderIds", id);
      startTransition(() => {
        void bulkDeleteOrdersAction(fd);
      });
      return;
    }

    if (action.startsWith("status:")) {
      const status = action.slice("status:".length).toUpperCase();
      const fd = new FormData();
      for (const id of ids) fd.append("orderIds", id);
      fd.set("status", status);
      startTransition(() => {
        void bulkSetOrderStatusAction(fd);
      });
    }
  }

  return (
    <>
      <select
        ref={selectRef}
        className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
        aria-label="Bulk actions"
        defaultValue=""
        disabled={pending}
      >
        <option value="">Bulk actions</option>
        <option value="status:processing">Mark Processing</option>
        <option value="status:completed">Mark Completed</option>
        <option value="status:cancelled">Mark Cancelled</option>
        <option value="delete">Delete</option>
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={onApply}
        className="h-8 rounded-md border border-[#dcdcde] bg-white px-3 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7] disabled:opacity-50"
      >
        {pending ? "Applying…" : "Apply"}
      </button>
    </>
  );
}
