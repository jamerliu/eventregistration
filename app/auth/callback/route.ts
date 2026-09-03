import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SCHOOL_DOMAIN = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN?.toLowerCase();

// Supabase redirects here after a student clicks the confirmation link in their sign-up
// email (or a password-reset link, depending on flow), with a ?code= to exchange for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  // Hard enforcement of the school domain, even though we also hint Google's account
  // picker toward it — a hint alone can be bypassed by typing a different account in.
  if (SCHOOL_DOMAIN && !data.user.email.toLowerCase().endsWith(`@${SCHOOL_DOMAIN}`)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?error=wrong_domain`);
  }

  return NextResponse.redirect(origin);
}
