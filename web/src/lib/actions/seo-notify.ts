"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin/audit-log";
import { requireStaff } from "@/lib/auth/admin";
import {
  notifySearchEngines,
  SEO_NOTIFY_LAST_RUN_KEY,
  type SeoNotifyResult,
} from "@/lib/seo/notify-search-engines";

function parseCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true" || formData.get(key) === "1";
}

export async function notifySearchEnginesAction(formData: FormData) {
  const staff = await requireStaff();
  const indexNow = parseCheckbox(formData, "indexNow");
  const googleSearchConsole = parseCheckbox(formData, "googleSearchConsole");

  if (!indexNow && !googleSearchConsole) {
    redirect("/admin/seo?notice=notify_none_selected");
  }

  const result = await notifySearchEngines({ indexNow, googleSearchConsole });

  await prisma.storeSetting.upsert({
    where: { key: SEO_NOTIFY_LAST_RUN_KEY },
    create: {
      key: SEO_NOTIFY_LAST_RUN_KEY,
      value: { ...result, triggeredBy: staff.user.email } as object,
    },
    update: {
      value: { ...result, triggeredBy: staff.user.email } as object,
    },
  });

  await recordAdminAudit({
    actorId: staff.user.id,
    actorEmail: staff.user.email,
    action: "seo.notify",
    entityType: "store_setting",
    entityId: SEO_NOTIFY_LAST_RUN_KEY,
    summary: `Search engine notify (${result.urlCount} URLs, ok=${result.ok})`,
    changes: {
      indexNow: result.indexNow?.ok ?? null,
      googleSearchConsole: result.googleSearchConsole?.ok ?? null,
    },
  });

  revalidatePath("/admin/seo");
  redirect(result.ok ? "/admin/seo?notice=notify_ok" : "/admin/seo?notice=notify_partial");
}

export type SeoNotifyLastRun = SeoNotifyResult & { triggeredBy?: string };
