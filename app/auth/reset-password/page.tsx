"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  // Supabase's browser client automatically picks up the recovery token from the URL
  // (sent by the reset-password email) and creates a temporary session, so by the time
  // this form is submitted, updateUser() applies to the right account.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="max-w-sm mx-auto py-24 text-center">
      <h1 className="font-display text-4xl tracking-tight mb-10">Set a new password</h1>

      {done ? (
        <p className="font-body">Password updated — redirecting you now…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="font-body text-sm italic">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Working…" : "Update Password"}
          </Button>
        </form>
      )}
    </div>
  );
}
