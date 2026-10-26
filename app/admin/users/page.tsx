"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import { API_BASE_URL, clearAuth, getAuthHeaders, getToken } from "../../lib/auth";

type AdminUser = {
  id: number;
  username: string;
  email: string | null;
  role: "user" | "verifier" | "admin" | string;
  is_active: number;
  created_at: string | null;
  last_login: string | null;
};

type AdminUsersResponse = {
  total: number;
  users: AdminUser[];
};

const roleOptions = ["user", "verifier", "admin"];

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  const fetchCurrentUser = async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.user as AdminUser;
  };

  const fetchUsers = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [me, usersResponse] = await Promise.all([
        fetchCurrentUser(),
        fetch(`${API_BASE_URL}/admin/users`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (usersResponse.status === 403) {
        alert("บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้า Admin Users");
        router.push("/");
        return;
      }

      if (!usersResponse.ok) {
        throw new Error("Failed to fetch users");
      }

      const usersData: AdminUsersResponse = await usersResponse.json();

      setCurrentUser(me);
      setUsers(usersData.users);
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถโหลดรายชื่อผู้ใช้ได้ กรุณาตรวจสอบ backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const updateUserRole = async (userId: number, newRole: string) => {
    const target = users.find((user) => user.id === userId);

    if (!target) return;

    if (target.id === currentUser?.id && newRole !== "admin") {
      alert("ไม่สามารถลด role ของบัญชีตัวเองจาก admin ได้");
      return;
    }

    const confirmUpdate = confirm(
      `ต้องการเปลี่ยน role ของ ${target.username} เป็น ${newRole} ใช่ไหม?`
    );

    if (!confirmUpdate) return;

    setUpdatingUserId(userId);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "ไม่สามารถเปลี่ยน role ได้");
        return;
      }

      await fetchUsers();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดระหว่างเปลี่ยน role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleUserActive = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      alert("ไม่สามารถปิดใช้งานบัญชีตัวเองได้");
      return;
    }

    const nextActive = user.is_active === 1 ? 0 : 1;
    const actionText = nextActive === 1 ? "เปิดใช้งาน" : "ปิดใช้งาน";

    const confirmUpdate = confirm(
      `ต้องการ${actionText}บัญชี ${user.username} ใช่ไหม?`
    );

    if (!confirmUpdate) return;

    setUpdatingUserId(user.id);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          is_active: nextActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "ไม่สามารถเปลี่ยน active status ได้");
        return;
      }

      await fetchUsers();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดระหว่างเปลี่ยน active status");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      keyword.length === 0 ||
      user.username.toLowerCase().includes(keyword) ||
      (user.email || "").toLowerCase().includes(keyword);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active === 1) ||
      (statusFilter === "inactive" && user.is_active !== 1);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.is_active === 1).length;
  const inactiveUsers = users.filter((user) => user.is_active !== 1).length;
  const adminUsers = users.filter((user) => user.role === "admin").length;
  const verifierUsers = users.filter((user) => user.role === "verifier").length;
  const normalUsers = users.filter((user) => user.role === "user").length;

  return (
    <AuthGuard>
      <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] h-96 w-96 rounded-full bg-lime-400/10 blur-3xl" />
          <div className="absolute left-[45%] top-[20%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 md:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-xl">
                🌿
              </div>

              <div>
                <p className="text-lg font-black leading-none">
                  LeafVision <span className="text-emerald-300">AI</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Admin User Management
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Analyzer
              </Link>

              <Link
                href="/performance"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Performance
              </Link>

              <Link
                href="/history"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                History
              </Link>

              <Link
                href="/plants"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Plant Database
              </Link>

              <Link
                href="/admin/users"
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Admin Users
              </Link>

              <button
                onClick={logout}
                className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-400/10"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <section className="relative mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
          <header className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Admin Only
                </div>

                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  Manage{" "}
                  <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                    Users
                  </span>
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  Admin สามารถตรวจสอบบัญชีที่สมัครเข้ามา เปลี่ยน role เป็น User / Verifier / Admin
                  และเปิดหรือปิดสถานะบัญชีได้ โดยไม่แสดง password หรือ password hash
                </p>
              </div>

              <button
                onClick={fetchUsers}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
              >
                {loading ? "Refreshing..." : "Refresh Users"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-6">
              <MetricCard label="Total" value={String(totalUsers)} tone="white" />
              <MetricCard label="Active" value={String(activeUsers)} tone="emerald" />
              <MetricCard label="Inactive" value={String(inactiveUsers)} tone="slate" />
              <MetricCard label="Users" value={String(normalUsers)} tone="sky" />
              <MetricCard label="Verifiers" value={String(verifierUsers)} tone="lime" />
              <MetricCard label="Admins" value={String(adminUsers)} tone="yellow" />
            </div>
          </header>

          <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">Filters</h2>
                <p className="mt-1 text-sm text-slate-400">
                  ค้นหาและกรองผู้ใช้ตาม role หรือ active status
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-w-[260px] rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-400"
                  placeholder="Search username or email"
                />

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-400"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="verifier">Verifier</option>
                  <option value="admin">Admin</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-400"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur md:p-6">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black">Users Table</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Showing {filteredUsers.length} users from {users.length} records
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40">
                <p className="text-slate-400">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                  👤
                </div>
                <h3 className="text-xl font-bold">No users found</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  ยังไม่มีผู้ใช้ หรือไม่มี user ที่ตรงกับ filter นี้
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-700">
                <table className="w-full min-w-[1120px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-950/80 text-left text-slate-400">
                      <th className="p-3">ID</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3">Last Login</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      const isUpdating = updatingUserId === user.id;

                      return (
                        <tr key={user.id} className="border-b border-slate-800">
                          <td className="p-3 font-bold text-slate-300">#{user.id}</td>
                          <td className="p-3">
                            <div>
                              <p className="font-black text-white">{user.username}</p>
                              {isSelf && (
                                <p className="mt-1 text-xs font-bold text-emerald-300">
                                  Current admin account
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-300">{user.email || "-"}</td>
                          <td className="p-3">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="p-3">
                            <StatusBadge active={user.is_active === 1} />
                          </td>
                          <td className="p-3 text-slate-300">{formatDate(user.created_at)}</td>
                          <td className="p-3 text-slate-300">{formatDate(user.last_login)}</td>
                          <td className="p-3">
                            <div className="flex justify-end gap-2">
                              <select
                                value={user.role}
                                disabled={isUpdating}
                                onChange={(event) =>
                                  updateUserRole(user.id, event.target.value)
                                }
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {roleOptions.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => toggleUserActive(user)}
                                disabled={isUpdating || isSelf}
                                className={`rounded-xl border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  user.is_active === 1
                                    ? "border-red-400/30 text-red-300 hover:bg-red-400/10"
                                    : "border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10"
                                }`}
                              >
                                {user.is_active === 1 ? "Disable" : "Enable"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-400 backdrop-blur">
            <p>
              Admin Users • Role Management • Active Status Control • Passwords are never displayed
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "white" | "emerald" | "yellow" | "sky" | "lime" | "slate";
}) {
  const toneClass = {
    white: "text-white",
    emerald: "text-emerald-300",
    yellow: "text-yellow-300",
    sky: "text-sky-300",
    lime: "text-lime-300",
    slate: "text-slate-300",
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const className =
    role === "admin"
      ? "border-red-400/40 bg-red-400/10 text-red-300"
      : role === "verifier"
      ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {role.toUpperCase()}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${
        active
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
          : "border-slate-500/40 bg-slate-500/10 text-slate-300"
      }`}
    >
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
