export function blogNoticeMessage(notice: string | undefined) {
  switch (notice) {
    case "deleted":
      return "Post deleted.";
    case "saved":
      return "Post saved.";
    case "created":
      return "Post created.";
    case "error":
      return "Could not save post. Check required fields and try again.";
    case "publish_blocked":
      return "Post was not published. Published posts need a lowercase hyphenated slug, SEO title, and meta description.";
    default:
      return null;
  }
}

export function BlogAdminNotice({ notice }: { notice: string | undefined }) {
  const message = blogNoticeMessage(notice);
  if (!message) return null;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        notice === "error" || notice === "publish_blocked"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-green-200 bg-green-50 text-green-900"
      }`}
      role="status"
    >
      {message}
    </div>
  );
}
