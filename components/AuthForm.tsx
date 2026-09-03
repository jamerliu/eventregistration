"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const SCHOOL_DOMAIN = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN ?? "";

type Mode = "sign-in" | "sign-up" | "forgot-password";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function domainIsValid(value: string) {
    if (!SCHOOL_DOMAIN) return true;
    return value.toLowerCase().endsWith(`@${SCHOOL_DOMAIN.toLowerCase()}`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!domainIsValid(email)) {
      setError(`Please use your school email address ending in @${SCHOOL_DOMAIN}.`);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setMessage("Check your school inbox for a confirmation link to finish signing up.");
      return;
    }

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    // forgot-password
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("If that email has an account, a reset link has been sent.");
  }

  return (
    <div className="max-w-sm mx-auto text-left">
      <div className="flex gap-8 justify-center mb-10 font-mono text-xs uppercase tracking-widest">
        <button
          className={mode === "sign-in" ? "underline underline-offset-4" : "text-[#525252]"}
          onClick={() => {
            setMode("sign-in");
            setError(null);
            setMessage(null);
          }}
        >
          Sign In
        </button>
        <button
          className={mode === "sign-up" ? "underline underline-offset-4" : "text-[#525252]"}
          onClick={() => {
            setMode("sign-up");
            setError(null);
            setMessage(null);
          }}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>School email</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={SCHOOL_DOMAIN ? `you@${SCHOOL_DOMAIN}` : "you@school.edu"}
          />
        </div>

        {mode !== "forgot-password" && (
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}

        {error && <p className="font-body text-sm italic">{error}</p>}
        {message && <p className="font-body text-sm italic">{message}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? "Working…"
            : mode === "sign-up"
            ? "Create Account"
            : mode === "forgot-password"
            ? "Send Reset Link"
            : "Sign In"}
        </Button>

        {mode === "sign-in" && (
          <button
            type="button"
            className="block mx-auto font-mono text-xs uppercase tracking-widest underline underline-offset-4"
            onClick={() => {
              setMode("forgot-password");
              setError(null);
              setMessage(null);
            }}
          >
            Forgot password?
          </button>
        )}
        {mode === "forgot-password" && (
          <button
            type="button"
            className="block mx-auto font-mono text-xs uppercase tracking-widest underline underline-offset-4"
            onClick={() => {
              setMode("sign-in");
              setError(null);
              setMessage(null);
            }}
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
