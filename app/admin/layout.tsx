import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { requireOwner } from "@/lib/auth-helpers";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "workshop",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwner();

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <Wordmark size="nav" href="/admin" />
        <div className="admin-top-right">
          <span className="admin-owner-email">{session.user.email}</span>
          <SignOutButton />
          <ThemeToggle />
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-side">
          <AdminNav />
          <a className="admin-link" href="/" target="_blank" rel="noreferrer">
            view public site ↗
          </a>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
