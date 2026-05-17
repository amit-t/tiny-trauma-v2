"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; label: string }[] = [
  { href: "/admin", label: "dashboard" },
  { href: "/admin/posts", label: "posts" },
  { href: "/admin/brainstorm", label: "brainstorm" },
  { href: "/admin/campaigns", label: "campaigns" },
  { href: "/admin/subscribers", label: "subscribers" },
  { href: "/admin/cross-post", label: "cross-post" },
  { href: "/admin/settings", label: "settings" },
];

export function AdminNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="admin-side-nav" aria-label="Admin sections">
      {ITEMS.map((item) => {
        const isActive =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? "active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
