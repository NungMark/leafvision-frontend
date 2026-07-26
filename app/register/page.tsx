"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      alert("username ต้องมีอย่างน้อย 3 ตัวอักษร");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      alert("รูปแบบ email ไม่ถูกต้อง เช่น example@gmail.com");
      return;
    }

    if (password.length < 8) {
      alert("password ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Register failed");
        return;
      }

      alert("Register สำเร็จ กรุณาเข้าสู่ระบบ");

      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถเชื่อมต่อ backend ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-96 w-96 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="absolute left-[45%] top-[20%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_430px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Create New Account
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Register{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                Account
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              สมัครบัญชีผู้ใช้เพื่อเข้าใช้งานระบบจำแนกชนิดพืชจากภาพใบไม้
              บัญชีใหม่จะได้รับ role เป็น User โดยอัตโนมัติ
            </p>

            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
              <InfoCard label="Role" value="User" />
              <InfoCard label="Login" value="Email/Username" />
              <InfoCard label="Security" value="Hash Password" />
            </div>

            <div className="mt-6 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100/90">
              ระบบจะไม่เก็บรหัสผ่านจริง แต่จะเก็บเป็น password hash
              เพื่อความปลอดภัยของผู้ใช้
            </div>
          </div>

          <form
            onSubmit={handleRegister}
            className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl backdrop-blur"
          >
            <div className="mb-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl">
                🌿
              </div>

              <h2 className="text-2xl font-black">Create account</h2>
              <p className="mt-1 text-sm text-slate-400">
                สมัครบัญชีใหม่สำหรับใช้งานระบบ
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                  placeholder="mark"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                  placeholder="example@gmail.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-4 font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
            >
              {loading ? "Creating account..." : "Register"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-400">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                href="/login"
                className="font-bold text-emerald-300 hover:text-emerald-200"
              >
                Login here
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-black text-emerald-300">{value}</p>
    </div>
  );
}
