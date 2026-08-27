"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ReferralRedirect({ code }: { code: string }) {
  const router = useRouter();

  useEffect(() => {
    if (code && /^[a-z0-9]{4,20}$/.test(code.toLowerCase())) {
      localStorage.setItem("vault_ref", code);
    }
    router.replace("/");
  }, [code, router]);

  return (
    <main className="mx-auto max-w-[480px] min-h-screen px-4 py-16 text-center">
      <p className="font-display text-lg font-bold text-on-surface">Redirecting...</p>
    </main>
  );
}
