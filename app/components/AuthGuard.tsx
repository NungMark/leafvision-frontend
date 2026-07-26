"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, clearAuth, getAuthHeaders, getToken } from "../lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          clearAuth();
          router.replace("/login");
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error(error);
        clearAuth();
        router.replace("/login");
      }
    };

    verifyAuth();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl">
            🌿
          </div>
          <h1 className="text-2xl font-black">Checking authentication...</h1>
          <p className="mt-2 text-sm text-slate-400">
            กำลังตรวจสอบสิทธิ์การเข้าใช้งาน
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}