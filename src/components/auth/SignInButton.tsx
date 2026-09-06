"use client";
import { useEffect, useState } from "react";

export default function SignInButton() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setEmail(j?.user?.email ?? null))
      .catch(() => {});
  }, []);
  if (email) {
    return (
      <span className="text-xs text-zinc-600 hidden sm:inline">
        {email} · <a href="/api/auth/signout" className="underline">Salir</a>
      </span>
    );
  }
  return (
    <a href="/auth/signin" className="text-sm bg-black text-white rounded-full px-3 py-1.5">
      Entrar
    </a>
  );
}
