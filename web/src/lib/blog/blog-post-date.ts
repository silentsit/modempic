type BlogPostDates = {
  publishedAt: Date | null;
  updatedAt: Date;
};

export type BlogPostCardDate = {
  date: Date;
  label: "Published" | "Updated";
};

/** Pick the date blog cards should show: updated when content changed after publish. */
export function getBlogPostCardDate(post: BlogPostDates): BlogPostCardDate {
  if (post.publishedAt && post.updatedAt.getTime() > post.publishedAt.getTime()) {
    return { label: "Updated", date: post.updatedAt };
  }

  if (post.publishedAt) {
    return { label: "Published", date: post.publishedAt };
  }

  return { label: "Updated", date: post.updatedAt };
}
