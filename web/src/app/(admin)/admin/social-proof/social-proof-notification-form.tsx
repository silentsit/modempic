"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SocialProofNotificationPreview } from "@/components/social-proof/notification-preview";
import { upsertSocialProofNotificationAction } from "@/lib/actions/social-proof";
import {
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_SOCIAL_PROOF_EXCLUDE_PATHS,
  type SocialProofNotification,
  type SocialProofType,
} from "@/lib/social-proof/schema";

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#1d2327]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="rounded border-[#dcdcde]" />
      {label}
    </label>
  );
}

const POSITION_OPTIONS = [
  ["bottom-left", "Bottom left"],
  ["bottom-right", "Bottom right"],
  ["top-left", "Top left"],
  ["top-right", "Top right"],
] as const;

export function SocialProofNotificationForm({ notification }: { notification: SocialProofNotification | null }) {
  const cfg = notification?.config;
  const isNew = !notification;
  const [type, setType] = useState<SocialProofType>(notification?.type ?? "stream");

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form action={upsertSocialProofNotificationAction} className="space-y-8">
        {notification ? <input type="hidden" name="id" value={notification.id} /> : null}

        <section className="space-y-4 rounded-lg border border-[#dcdcde] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#1d2327]">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Notification name</Label>
              <Input id="name" name="name" required defaultValue={notification?.name ?? "Recent purchases"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as SocialProofType)}
                className="h-10 w-full rounded-md border border-[#dcdcde] bg-white px-3 text-sm"
              >
                <option value="stream">Stream — individual purchase & signup activity</option>
                <option value="combo">Combo — aggregate visitor count</option>
                <option value="informational">Informational — static trust message</option>
                <option value="reviews">Reviews — approved product reviews</option>
                <option value="counter">Counter — synthetic live visitor count</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={notification?.status ?? "active"}
                className="h-10 w-full rounded-md border border-[#dcdcde] bg-white px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority (lower = first)</Label>
              <Input id="priority" name="priority" type="number" min={0} max={999} defaultValue={notification?.priority ?? 0} />
            </div>
          </div>
        </section>

        {type === "informational" ? (
          <section className="space-y-4 rounded-lg border border-[#dcdcde] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#1d2327]">Message</h2>
            <div className="space-y-1.5">
              <Label htmlFor="infoTitle">Title</Label>
              <Input
                id="infoTitle"
                name="infoTitle"
                required
                defaultValue={cfg?.informational?.title ?? "Free US shipping"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="infoBody">Body</Label>
              <Textarea
                id="infoBody"
                name="infoBody"
                rows={3}
                required
                defaultValue={cfg?.informational?.body ?? "On orders $50 and over."}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="infoIcon">Icon</Label>
                <select
                  id="infoIcon"
                  name="infoIcon"
                  defaultValue={cfg?.informational?.icon ?? "shield"}
                  className="h-10 w-full rounded-md border border-[#dcdcde] bg-white px-3 text-sm"
                >
                  <option value="shield">Shield (trust)</option>
                  <option value="truck">Truck (shipping)</option>
                  <option value="star">Star (quality)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="infoLinkUrl">Link URL (optional)</Label>
                <Input id="infoLinkUrl" name="infoLinkUrl" defaultValue={cfg?.informational?.linkUrl ?? ""} placeholder="/shop" />
              </div>
            </div>
          </section>
        ) : null}

        {type === "combo" ? (
          <section className="space-y-4 rounded-lg border border-[#dcdcde] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#1d2327]">Combo copy</h2>
            <div className="space-y-1.5">
              <Label htmlFor="comboMessage">Action phrase</Label>
              <Input
                id="comboMessage"
                name="comboMessage"
                defaultValue={cfg?.comboMessage ?? "visited our store"}
                placeholder="visited our store"
              />
              <p className="text-xs text-[#50575e]">
                Rotates site-wide copy (“247 people visited our store in the last 24 hours”) and product lines
                (“870 people purchased Artvigil 150mg in the last 7 days”). Counts are synthetic (50–999).
              </p>
            </div>
          </section>
        ) : null}

        {type === "reviews" ? (
          <section className="space-y-4 rounded-lg border border-[#dcdcde] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#1d2327]">Review source</h2>
            <p className="text-sm text-[#50575e]">Pulls approved reviews from your catalog. Only reviews at or above the minimum rating are shown.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="reviewsMinRating">Minimum rating</Label>
                <Input id="reviewsMinRating" name="reviewsMinRating" type="number" min={1} max={5} defaultValue={cfg?.reviews?.minRating ?? 4} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reviewsTake">Max in rotation</Label>
                <Input id="reviewsTake" name="reviewsTake" type="number" min={1} max={15} defaultValue={cfg?.reviews?.take ?? 8} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reviewsWindowDays">Review age (days)</Label>
                <Input id="reviewsWindowDays" name="reviewsWindowDays" type="number" min={1} max={90} defaultValue={cfg?.reviews?.windowDays ?? 30} />
              </div>
            </div>
          </section>
        ) : null}

        {type === "counter" ? (
          <section className="space-y-4 rounded-lg border border-[#dcdcde] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#1d2327]">Live counter</h2>
            <p className="text-sm text-[#50575e]">
              Displays a synthetic visitor count (50–999) derived from your notification ID. Presence heartbeats
              still run in the background but do not affect the displayed number.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="counterScope">Count scope</Label>
                <select
                  id="counterScope"
                  name="counterScope"
                  defaultValue={cfg?.counter?.scope ?? "page"}
                  className="h-10 w-full rounded-md border border-[#dcdcde] bg-white px-3 text-sm"
                >
                  <option value="page">This page only</option>
                  <option value="site">Entire site</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="counterWindowMinutes">Active window (minutes)</Label>
                <Input id="counterWindowMinutes" name="counterWindowMinutes" type="number" min={1} max={30} defaultValue={cfg?.counter?.windowMinutes ?? 5} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="counterMinDisplay">Show when at least</Label>
                <Input id="counterMinDisplay" name="counterMinDisplay" type="number" min={1} max={50} defaultValue={cfg?.counter?.minDisplay ?? 2} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="counterMessage">Message after count</Label>
                <Input id="counterMessage" name="counterMessage" defaultValue={cfg?.counter?.message ?? "visitors are online"} />
                <p className="text-xs text-[#50575e]">Shown as: “127 visitors are online”</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-4 rounded-lg border border-[#dcdcde] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#1d2327]">Display pages</h2>
          <div className="space-y-1.5">
            <Label htmlFor="paths">Show on paths</Label>
            <Textarea
              id="paths"
              name="paths"
              rows={3}
              className="font-mono text-sm"
              defaultValue={(cfg?.paths ?? ["/", "/shop", "/product"]).join("\n")}
            />
            <p className="text-xs text-[#50575e]">
              One path prefix per line. Use <code className="rounded bg-[#f0f0f1] px-1">*</code> alone to allow all
              pages (exclude list still applies).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="excludePaths">Exclude paths</Label>
            <Textarea
              id="excludePaths"
              name="excludePaths"
              rows={3}
              className="font-mono text-sm"
              defaultValue={(cfg?.excludePaths?.length ? cfg.excludePaths : [...DEFAULT_SOCIAL_PROOF_EXCLUDE_PATHS]).join(
                "\n",
              )}
            />
            <p className="text-xs text-[#50575e]">
              Prefix match — e.g. <code className="rounded bg-[#f0f0f1] px-1">/checkout</code> also blocks{" "}
              <code className="rounded bg-[#f0f0f1] px-1">/checkout/success</code>.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="position">Desktop position</Label>
              <select
                id="position"
                name="position"
                defaultValue={cfg?.position ?? "bottom-left"}
                className="h-10 w-full rounded-md border border-[#dcdcde] bg-white px-3 text-sm"
              >
                {POSITION_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobilePosition">Mobile position (optional)</Label>
              <select
                id="mobilePosition"
                name="mobilePosition"
                defaultValue={cfg?.mobilePosition ?? ""}
                className="h-10 w-full rounded-md border border-[#dcdcde] bg-white px-3 text-sm"
              >
                <option value="">Same as desktop</option>
                {POSITION_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Checkbox name="mobileEnabled" label="Show on mobile" defaultChecked={cfg?.mobileEnabled ?? true} />
        </section>

        <section className="space-y-4 rounded-lg border border-[#dcdcde] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#1d2327]">Timing & behavior</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="initialDelaySec">Initial delay (sec)</Label>
              <Input id="initialDelaySec" name="initialDelaySec" type="number" min={0} max={120} defaultValue={cfg?.initialDelaySec ?? 3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayDurationSec">Display duration (sec)</Label>
              <Input id="displayDurationSec" name="displayDurationSec" type="number" min={2} max={60} defaultValue={cfg?.displayDurationSec ?? 7} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gapBetweenSec">Gap between (sec)</Label>
              <Input id="gapBetweenSec" name="gapBetweenSec" type="number" min={1} max={120} defaultValue={cfg?.gapBetweenSec ?? 5} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="snoozeHours">Snooze after dismiss (hours)</Label>
              <Input id="snoozeHours" name="snoozeHours" type="number" min={1} max={168} defaultValue={cfg?.snoozeHours ?? 4} />
            </div>
            {type === "stream" ? (
              <p className="text-sm text-[#50575e] sm:col-span-2">
                NotificationX-style layout: name + location + “just purchased” on line 1, product name bold on line 2,
                time + verified on line 3. Product purchase aggregates are interleaved automatically.
              </p>
            ) : null}
            {type !== "informational" && type !== "counter" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="windowDays">Activity window (days)</Label>
                  <Input id="windowDays" name="windowDays" type="number" min={1} max={14} defaultValue={cfg?.windowDays ?? 7} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxAgeHours">Max event age (hours)</Label>
                  <Input id="maxAgeHours" name="maxAgeHours" type="number" min={1} max={720} defaultValue={cfg?.maxAgeHours ?? 72} />
                </div>
              </>
            ) : null}
            {type === "combo" || type === "stream" ? (
              <div className="space-y-1.5">
                <Label htmlFor="aggregateHours">Aggregate window (hours)</Label>
                <Input id="aggregateHours" name="aggregateHours" type="number" min={1} max={720} defaultValue={cfg?.aggregateHours ?? 24} />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="roundedPx">Corner radius (px)</Label>
              <Input id="roundedPx" name="roundedPx" type="number" min={0} max={32} defaultValue={cfg?.roundedPx ?? 16} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Checkbox name="loop" label="Loop notifications" defaultChecked={cfg?.loop ?? true} />
            <Checkbox name="dismissible" label="Allow dismiss (snooze)" defaultChecked={cfg?.dismissible ?? true} />
            {type === "stream" ? (
              <>
                <Checkbox name="showLocation" label="Show location" defaultChecked={cfg?.showLocation ?? true} />
                <Checkbox name="showProductImage" label="Show product thumbnail" defaultChecked={cfg?.showProductImage ?? true} />
                <Checkbox name="clickable" label="Link to product page" defaultChecked={cfg?.clickable ?? true} />
              </>
            ) : null}
            {type === "reviews" ? (
              <>
                <Checkbox name="showProductImage" label="Show product thumbnail" defaultChecked={cfg?.showProductImage ?? true} />
                <Checkbox name="clickable" label="Link to product reviews" defaultChecked={cfg?.clickable ?? true} />
              </>
            ) : null}
            {type === "informational" ? (
              <Checkbox name="clickable" label="Link entire card" defaultChecked={cfg?.clickable ?? true} />
            ) : null}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">{isNew ? "Create notification" : "Save notification"}</Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/social-proof">Cancel</Link>
          </Button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <SocialProofNotificationPreview type={type} config={cfg ?? DEFAULT_NOTIFICATION_CONFIG} />
      </aside>
    </div>
  );
}
