import { SocialProofNotificationForm } from "../social-proof-notification-form";

export default function NewSocialProofNotificationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1d2327]">New notification</h1>
      <SocialProofNotificationForm notification={null} />
    </div>
  );
}
