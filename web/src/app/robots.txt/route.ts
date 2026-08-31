import { renderRobotsTxt, robotsTxtResponse } from "@/lib/seo/robots-txt";

export const revalidate = 3600;

export function GET() {
  return robotsTxtResponse(renderRobotsTxt());
}
