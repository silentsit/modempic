import Script from "next/script";

const DEFAULT_GA_ID = "G-PTC500RDB4";

export function googleMeasurementId() {
  const fromEnv = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return DEFAULT_GA_ID;
  }
  return "";
}

/** Google tag (gtag.js). One tag per page; omit locally unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */
export function GoogleTag() {
  const gaId = googleMeasurementId();
  if (!gaId) return null;

  return (
    <>
      {/* lazyOnload: gtag reads layout (offsetWidth) and forces reflow; keep it off the LCP path. */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
      <Script id="google-tag" strategy="lazyOnload">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');
`}
      </Script>
    </>
  );
}
