"use client";

// BottomTabBar — the app's main navigation, fixed to the bottom of the
// screen like a native iPhone app. Four tabs: Itinerary, Map, Costs, Info.
//
// Details that make it feel native:
//   - a translucent dark background with a blur, so content scrolling
//     underneath is softly visible
//   - extra padding at the very bottom equal to the iPhone's "safe area",
//     so the bar never collides with the home indicator line
//   - the active tab glows warm amber; inactive tabs are muted

import { List, Map, Coins, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// The four tab identifiers, shared with the trip page.
export type TabId = "itinerary" | "map" | "costs" | "info";

// Each tab's icon and label, in display order.
const TABS: { id: TabId; label: string; icon: typeof List }[] = [
  { id: "itinerary", label: "Itinerary", icon: List },
  { id: "map", label: "Map", icon: Map },
  { id: "costs", label: "Costs", icon: Coins },
  { id: "info", label: "Info", icon: Info },
];

interface BottomTabBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomTabBar({
  activeTab,
  onChange,
}: BottomTabBarProps) {
  return (
    // Fixed to the bottom, centred, never wider than 480px (so on a
    // tablet the app still looks like a phone app in the middle).
    <nav
      className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-border"
      style={{
        backgroundColor: "rgba(26, 26, 26, 0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        // Pushes the bar's content up above the iPhone home indicator.
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              // Each tab is a quarter of the width and 56px tall — well
              // above the 44px minimum touch target.
              className={cn(
                "flex h-14 flex-1 flex-col items-center justify-center gap-1",
                isActive ? "text-accent" : "text-ink-faint"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 2} aria-hidden />
              <span className="text-[10.5px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
