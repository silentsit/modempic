import type { EmailFunnelType } from "@prisma/client";
import { FUNNEL_STEP_DELAYS } from "@/lib/email/funnels/definitions";

const FUNNEL_SLUG: Record<EmailFunnelType, string> = {
  WELCOME_SIGNUP: "welcome",
  ABANDONED_CART: "abandoned-cart",
  UNPAID_ORDER: "unpaid-order",
};

export function funnelContentKeyString(funnelType: EmailFunnelType, stepIndex: number): string {
  return `funnel-${FUNNEL_SLUG[funnelType]}-${stepIndex}`;
}

export function listFunnelContentKeyStrings(): string[] {
  const keys: string[] = [];
  for (const type of Object.keys(FUNNEL_STEP_DELAYS) as EmailFunnelType[]) {
    for (let i = 0; i < FUNNEL_STEP_DELAYS[type].length; i += 1) {
      keys.push(funnelContentKeyString(type, i));
    }
  }
  return keys;
}

type FunnelDefaultBlock = {
  subject: string;
  heading: string;
  subtitle: string;
  body: string;
  additionalContent: string;
  ctaLabel: string;
  ctaPath: string;
};

const site = "Modempic";

/** Default copy for funnel steps — merged into DEFAULT_EMAIL_CONTENT. */
export function buildDefaultFunnelEmailContentBlocks(): Record<string, FunnelDefaultBlock> {
  const entries: Record<string, FunnelDefaultBlock> = {};

  const welcome: FunnelDefaultBlock[] = [
    {
      subject: `Welcome to ${site} — your account is ready`,
      heading: "Welcome aboard",
      subtitle: `Thanks for joining ${site}. Here's how to get started.`,
      body: `Thanks for creating your ${site} account. You now have one place to browse Modafinil options, save your cart, and track orders from checkout to delivery.

Start with our catalog, compare strengths and pack sizes, and check out securely when you're ready. If you have questions before ordering, our support team is here to help.`,
      ctaLabel: "Browse the catalog",
      ctaPath: "/category/modafinil",
      additionalContent: "",
    },
    {
      subject: `Still exploring? Here's what customers order first on ${site}`,
      heading: "Popular picks to get you started",
      subtitle: "See what other customers choose on their first order.",
      body: `Not sure where to start? Most first-time customers compare a few Modafinil strengths and pack sizes before checking out.

Take another look at what's in stock, read product details, and add items to your cart — your selections stay saved while you decide.`,
      ctaLabel: "View best sellers",
      ctaPath: "/category/modafinil",
      additionalContent: "",
    },
    {
      subject: `Quick checkout tips for your first ${site} order`,
      heading: "Ready when you are",
      subtitle: "Shipping, payment, and order tracking — in one place.",
      body: `When you're ready to order, checkout takes just a few minutes. You'll get order confirmation by email, payment instructions for crypto checkout, and tracking updates once your package ships.

Your account keeps order history and shipment details in one dashboard so you never have to hunt for a tracking link.`,
      ctaLabel: "Go to your account",
      ctaPath: "/account",
      additionalContent: "",
    },
    {
      subject: `We're here if you need help — ${site}`,
      heading: "Questions before you order?",
      subtitle: "Reach support anytime from your account or our contact page.",
      body: `Choosing the right product matters. If you're comparing options or want help with checkout, payment, or shipping, our team can point you in the right direction.

You can also revisit your saved cart anytime — we'll keep your selections until you're ready.`,
      ctaLabel: "Contact support",
      ctaPath: "/contact",
      additionalContent: "",
    },
  ];

  const abandoned: FunnelDefaultBlock[] = [
    {
      subject: "You left something in your cart",
      heading: "Your cart is still waiting",
      subtitle: "Complete checkout in a few clicks — your items are saved.",
      body: `You added items to your cart but didn't finish checkout. Everything is still saved and ready when you are.

If you had questions about payment or shipping, reply to this email or visit our contact page — we're happy to help.`,
      ctaLabel: "Return to your cart",
      ctaPath: "/cart",
      additionalContent: "",
    },
    {
      subject: "Still thinking it over? Your cart hasn't changed",
      heading: "Don't lose your selections",
      subtitle: "Your cart is saved — pick up where you left off.",
      body: `A day later and your cart is still here. Review your items, adjust quantities if needed, and check out when it feels right.

Fast, discreet shipping and clear order tracking are built into every ${site} order.`,
      ctaLabel: "Review my cart",
      ctaPath: "/cart",
      additionalContent: "",
    },
    {
      subject: "A nudge: your cart total is still reserved",
      heading: "Finish checkout while stock lasts",
      subtitle: "Popular items can sell through — secure your order today.",
      body: `Inventory moves quickly on in-demand products. If you're still planning to order, completing checkout now helps avoid disappointment.

Your saved cart makes it easy — no need to start over.`,
      ctaLabel: "Complete checkout",
      ctaPath: "/cart",
      additionalContent: "",
    },
    {
      subject: "Last reminder — items in your cart",
      heading: "One more reminder",
      subtitle: "We'll stop nudging after this — your cart stays saved.",
      body: `This is our last reminder about the items waiting in your cart. After this, we won't send more cart reminders unless you add something new.

Whenever you're ready, your cart and account are here.`,
      ctaLabel: "Go to cart",
      ctaPath: "/cart",
      additionalContent: "",
    },
    {
      subject: `We saved your cart — come back anytime (${site})`,
      heading: "Your cart is still saved",
      subtitle: "No pressure — your selections will be here when you return.",
      body: `We know timing matters. Your cart remains saved in your account, so you can return days or weeks from now without starting over.

When you do order, you'll get email updates from payment through delivery.`,
      ctaLabel: "Open my cart",
      ctaPath: "/cart",
      additionalContent: "",
    },
  ];

  const unpaid: FunnelDefaultBlock[] = [
    {
      subject: "Complete payment for your order",
      heading: "Payment still pending",
      subtitle: "Your order is reserved — finish payment to lock it in.",
      body: `We created your order but haven't received payment yet. Complete crypto checkout to move your order into processing.

If you already sent payment, it may take a short time to confirm on-chain — you'll get a confirmation email as soon as it's detected.`,
      ctaLabel: "Complete payment",
      ctaPath: "/order/{order_number}/confirmation",
      additionalContent: "",
    },
    {
      subject: "Reminder: payment needed for your order",
      heading: "Your order is on hold",
      subtitle: "Payment instructions are waiting on your order page.",
      body: `It's been a day since you placed your order. Payment is the only step left before we prepare shipment.

Open your order page for payment details and status. Need help with crypto checkout? Our support team can walk you through it.`,
      ctaLabel: "View order & pay",
      ctaPath: "/order/{order_number}/confirmation",
      additionalContent: "",
    },
    {
      subject: "Don't lose your order — payment reminder",
      heading: "2 days since checkout",
      subtitle: "Unpaid orders may be cancelled if payment isn't received.",
      body: `Unpaid orders can be cancelled after a few days to free inventory for other customers. If you still intend to order, please complete payment soon.

Your order number and payment link are on your account order page.`,
      ctaLabel: "Pay now",
      ctaPath: "/order/{order_number}/confirmation",
      additionalContent: "",
    },
    {
      subject: "Final reminder: complete payment today",
      heading: "Last payment reminder",
      subtitle: "This is our final reminder before your order may be cancelled.",
      body: `This is our last automated reminder about your unpaid order. If we don't receive payment, the order may be cancelled and stock released.

If you're having trouble with payment, contact us — we'd rather help you finish than lose your order.`,
      ctaLabel: "Complete payment",
      ctaPath: "/order/{order_number}/confirmation",
      additionalContent: "",
    },
  ];

  welcome.forEach((block, i) => {
    entries[funnelContentKeyString("WELCOME_SIGNUP", i)] = block;
  });
  abandoned.forEach((block, i) => {
    entries[funnelContentKeyString("ABANDONED_CART", i)] = block;
  });
  unpaid.forEach((block, i) => {
    entries[funnelContentKeyString("UNPAID_ORDER", i)] = block;
  });

  return entries;
}
