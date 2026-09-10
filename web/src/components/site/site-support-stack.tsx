import { SiteChatSlot } from "./site-chat-slot";
import { WhatsAppWidget } from "./whatsapp-widget";

/**
 * Bottom-right support stack: WhatsApp above the AI chat launcher.
 * The chat panel reads `--support-panel-bottom` so it sits above both buttons.
 */
export function SiteSupportStack() {
  return (
    <div
      className="pointer-events-none fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-50 flex flex-col-reverse items-end gap-2.5 max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] [--support-panel-bottom:calc(1.25rem+8.375rem+env(safe-area-inset-bottom))] max-lg:[--support-panel-bottom:calc(5.5rem+8.375rem+env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto">
        <SiteChatSlot stacked />
      </div>
      <div className="pointer-events-auto">
        <WhatsAppWidget />
      </div>
    </div>
  );
}
