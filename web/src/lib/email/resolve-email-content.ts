import {
  contentKeyForPreview,
  interpolateEmailText,
  type EmailContentKey,
  type EmailContentSettings,
  type EmailPlaceholderVars,
  type EmailTemplateContent,
} from "@/lib/email/email-content";

export function resolveTemplateContent(
  settings: EmailContentSettings,
  key: EmailContentKey,
): EmailTemplateContent {
  return settings[key];
}

export function resolveEmailSubject(
  settings: EmailContentSettings,
  key: EmailContentKey,
  vars: EmailPlaceholderVars,
  fallback: string,
): string {
  const raw = settings[key].subject.trim();
  if (!raw) return interpolateEmailText(fallback, vars);
  return interpolateEmailText(raw, vars);
}

export { contentKeyForPreview };
