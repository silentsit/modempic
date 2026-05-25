import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/admin";
import { findNotificationById, loadSocialProofStore } from "@/lib/social-proof/config";
import { SocialProofNotificationForm } from "../social-proof-notification-form";

type Params = Promise<{ id: string }>;

export default async function EditSocialProofNotificationPage({ params }: { params: Params }) {
  await requireStaff();
  const { id } = await params;
  const store = await loadSocialProofStore();
  const notification = findNotificationById(store, id);
  if (!notification) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1d2327]">Edit notification</h1>
      <SocialProofNotificationForm notification={notification} />
    </div>
  );
}
