import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";
import Link from "next/link";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b-4 border-black">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-6 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Event Registration
        </Link>

        {user && (
          <nav className="flex items-center gap-8 font-mono text-xs uppercase tracking-widest">
            <Link href="/" className="hover:underline underline-offset-4">
              Events
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="hover:underline underline-offset-4">
                Admin
              </Link>
            )}
            <span className="text-[#525252] normal-case">{user.email}</span>
            <SignOutButton />
          </nav>
        )}
      </div>
    </header>
  );
}

