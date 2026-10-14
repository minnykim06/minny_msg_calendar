"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/calendar", label: "Together", icon: "📅" },
  { href: "/calendar/mine", label: "Mine", icon: "✏️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Nav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-paper/95 backdrop-blur border-t border-hairline">
      <div className="max-w-xl mx-auto grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                active ? "text-foreground font-medium" : "text-foreground/45"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
