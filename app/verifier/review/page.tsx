"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import { API_BASE_URL, clearAuth, getAuthHeaders, getToken } from "../../lib/auth";

type TopPrediction = {
  name: string;
  confidence: number;
};

type ReviewLog = {
  id: number;
  filename: string;
  content_type: string;
  file_size: number;
  image_url?: string;
  status: string;
  prediction: string;
  display_name: string;
  confidence: number;
  top3: TopPrediction[];
  model_accuracy: number;
  confidence_threshold: number;
  processing_time_seconds: number;
  created_at: string;
  user_id: number;
  username: string;
  verified_status?: "pending" | "approved" | "rejected" | string;
  actual_class?: string | null;
  is_correct?: number | null;
  verification_note?: string | null;
  verified_by?: number | null;
  verified_by_username?: string | null;
  verified_at?: string | null;
};

type ReviewResponse = {
  total: number;
  logs: ReviewLog[];
};

type MeResponse = {
  authenticated: boolean;
  user: {
    id: number;
    username: string;
    email?: string;
    role: string;
  };
};

const actualClassOptions = [
  "Bamboo Grass",
  "Betel Vine",
  "Hairy Basil",
  "Holy Basil",
  "Kaffer Lime",
  "Kitchen Mint",
  "Laurel Clockvine",
  "Long Pepper",
  "Mitragyna Speciosa",
  "Siam Weed",
  "Siamese Neem",
  "Tiger Herbal",
  "Wildbetal Leafbush",
  "Unknown / Not clear",
];

export default function VerifierReviewPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [currentRole, setCurrentRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingLogId, setUpdatingLogId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [resultFilter, setResultFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  const [actualClassMap, setActualClassMap] = useState<Record<number, string>>({});
  const [noteMap, setNoteMap] = useState<Record<number, string>>({});

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  const fetchCurrentUser = async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return null;

    const data: MeResponse = await response.json();
    return data.user;
  };

  const fetchReviewLogs = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const user = await fetchCurrentUser();

      if (!user) {
        clearAuth();
        router.push("/login");
        return;
      }

      setCurrentRole(user.role);

      if (user.role !== "admin" && user.role !== "verifier") {
        alert("บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้า Verifier Review");
        router.push("/");
        return;
      }

      const params = new URLSearchParams({
        limit: String(limit),
        verified_status: statusFilter,
      });

      const response = await fetch(`${API_BASE_URL}/verifier/logs?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch review logs");
      }

      const data: ReviewResponse = await response.json();
      setLogs(data.logs);

      const nextActualClassMap: Record<number, string> = {};
      const nextNoteMap: Record<number, string> = {};

      data.logs.forEach((log) => {
        nextActualClassMap[log.id] =
          log.actual_class || log.prediction || "Unknown / Not clear";
        nextNoteMap[log.id] = log.verification_note || "";
      });

      setActualClassMap(nextActualClassMap);
      setNoteMap(nextNoteMap);
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถโหลด verification logs ได้ กรุณาตรวจสอบ backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewLogs();
  }, [limit, statusFilter]);

  const submitReview = async (
    log: ReviewLog,
    reviewStatus: "approved" | "rejected"
  ) => {
    const actualClass =
      actualClassMap[log.id] || log.prediction || "Unknown / Not clear";
    const note = noteMap[log.id] || "";

    if (reviewStatus === "rejected" && !actualClass) {
      alert("กรุณาเลือก actual class ก่อน Reject");
      return;
    }

    const confirmMessage =
      reviewStatus === "approved"
        ? `ยืนยันว่า prediction ของ log #${log.id} ถูกต้องใช่ไหม?`
        : `ยืนยันว่า prediction ของ log #${log.id} ผิด และ actual class คือ ${actualClass} ใช่ไหม?`;

    if (!confirm(confirmMessage)) return;

    setUpdatingLogId(log.id);

    try {
      const response = await fetch(`${API_BASE_URL}/verifier/logs/${log.id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          verified_status: reviewStatus,
          actual_class: actualClass,
          verification_note: note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Review failed");
        return;
      }

      await fetchReviewLogs();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดระหว่างบันทึกผล review");
    } finally {
      setUpdatingLogId(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (resultFilter === "all") return true;

    if (resultFilter === "success") return log.status === "success";
    if (resultFilter === "low_confidence") return log.status === "low_confidence";
    if (resultFilter === "correct") return log.is_correct === 1;
    if (resultFilter === "incorrect") return log.is_correct === 0;

    return true;
  });

  const pendingCount = logs.filter((log) => (log.verified_status || "pending") === "pending").length;
  const approvedCount = logs.filter((log) => log.verified_status === "approved").length;
  const rejectedCount = logs.filter((log) => log.verified_status === "rejected").length;
  const correctCount = logs.filter((log) => log.is_correct === 1).length;

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
                  Verifier Review
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
                href="/history"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                History
              </Link>

              <Link
                href="/verifier/review"
                className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-300 transition hover:bg-sky-400/20"
              >
                Verifier Review
              </Link>

              {currentRole === "admin" && (
                <Link
                  href="/admin/users"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                >
                  Admin Users
                </Link>
              )}

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
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Human Verification
                </div>

                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  Prediction{" "}
                  <span className="bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">
                    Review
                  </span>
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  Verifier ตรวจสอบผลลัพธ์การทำนายย้อนหลัง กด Approve เมื่อโมเดลทายถูก
                  หรือ Reject พร้อมระบุ actual class เมื่อโมเดลทายผิด
                </p>
              </div>

              <button
                onClick={fetchReviewLogs}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
              >
                {loading ? "Refreshing..." : "Refresh Review Logs"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <MetricCard label="Pending" value={String(pendingCount)} tone="yellow" />
              <MetricCard label="Approved" value={String(approvedCount)} tone="emerald" />
              <MetricCard label="Rejected" value={String(rejectedCount)} tone="red" />
              <MetricCard label="Correct" value={String(correctCount)} tone="sky" />
            </div>
          </header>

          <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">Review Filters</h2>
                <p className="mt-1 text-sm text-slate-400">
                  เลือกสถานะ verification และจำนวน log ที่ต้องการตรวจสอบ
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-sky-400"
                >
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All Verification Status</option>
                </select>

                <select
                  value={resultFilter}
                  onChange={(event) => setResultFilter(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-sky-400"
                >
                  <option value="all">All Prediction Status</option>
                  <option value="success">Prediction Success</option>
                  <option value="low_confidence">Low Confidence</option>
                  <option value="correct">Verified Correct</option>
                  <option value="incorrect">Verified Incorrect</option>
                </select>

                <select
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-sky-400"
                >
                  <option value={25}>Latest 25</option>
                  <option value={50}>Latest 50</option>
                  <option value={100}>Latest 100</option>
                  <option value={200}>Latest 200</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40">
              <p className="text-slate-400">Loading review logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                ✅
              </div>
              <h3 className="text-xl font-bold">No review logs found</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                ไม่มีรายการที่ตรงกับ filter นี้ หรือ pending review ถูกตรวจหมดแล้ว
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredLogs.map((log) => (
                <ReviewCard
                  key={log.id}
                  log={log}
                  actualClass={actualClassMap[log.id] || ""}
                  note={noteMap[log.id] || ""}
                  updating={updatingLogId === log.id}
                  onActualClassChange={(value) =>
                    setActualClassMap((prev) => ({ ...prev, [log.id]: value }))
                  }
                  onNoteChange={(value) =>
                    setNoteMap((prev) => ({ ...prev, [log.id]: value }))
                  }
                  onApprove={() => submitReview(log, "approved")}
                  onReject={() => submitReview(log, "rejected")}
                />
              ))}
            </div>
          )}

          <footer className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-400 backdrop-blur">
            <p>
              Human Verification • Approve/Reject Prediction Logs • Verifier and Admin Access
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}

function ReviewCard({
  log,
  actualClass,
  note,
  updating,
  onActualClassChange,
  onNoteChange,
  onApprove,
  onReject,
}: {
  log: ReviewLog;
  actualClass: string;
  note: string;
  updating: boolean;
  onActualClassChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isLowConfidence = log.status === "low_confidence";

  return (
    <article className="rounded-3xl border border-slate-700 bg-slate-950/50 p-4">
      <div className="grid gap-5 lg:grid-cols-[280px_1fr_320px]">
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-3">
          {log.image_url ? (
            <img
              src={`${API_BASE_URL}${log.image_url}`}
              alt={log.filename}
              className="h-64 w-full object-contain"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-950 text-slate-500">
              No image
            </div>
          )}

          <p className="mt-3 break-all text-xs text-slate-400">{log.filename}</p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(log.created_at)}</p>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-black text-slate-300">
              LOG #{log.id}
            </span>

            <PredictionBadge status={log.status} />

            <VerificationBadge status={log.verified_status || "pending"} />

            {log.is_correct === 1 && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                CORRECT
              </span>
            )}

            {log.is_correct === 0 && (
              <span className="rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs font-black text-red-300">
                INCORRECT
              </span>
            )}
          </div>

          <div
            className={`mb-4 rounded-2xl border p-4 ${
              isLowConfidence
                ? "border-yellow-400/30 bg-yellow-400/10"
                : "border-emerald-400/20 bg-emerald-400/10"
            }`}
          >
            <p className="text-sm text-slate-300">Model Prediction</p>
            <p
              className={`mt-1 text-2xl font-black ${
                isLowConfidence ? "text-yellow-300" : "text-emerald-300"
              }`}
            >
              {isLowConfidence ? "Unknown" : log.display_name}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Confidence: <span className="font-bold">{log.confidence}%</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Uploaded by {log.username || "-"} • Processing {log.processing_time_seconds}s
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-bold">Top 3 Predictions</h3>

            <div className="space-y-2">
              {log.top3?.map((item, index) => (
                <div
                  key={`${log.id}-${item.name}-${index}`}
                  className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {index + 1}. {item.name}
                    </span>

                    <span className="text-sm font-black text-sky-300">
                      {item.confidence}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{
                        width: `${Math.min(item.confidence, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-700 bg-slate-900/70 p-4">
          <h3 className="text-lg font-black">Verifier Decision</h3>
          <p className="mt-1 text-sm text-slate-400">
            เลือก actual class แล้วกด Approve หรือ Reject
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Actual Class
              </label>
              <select
                value={actualClass}
                onChange={(event) => onActualClassChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-sky-400"
              >
                {actualClassOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Verification Note
              </label>
              <textarea
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                className="h-28 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400"
                placeholder="หมายเหตุ เช่น ภาพเบลอ ใบซ้อนกัน หรือโมเดลสับสนกับ class อื่น"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onApprove}
                disabled={updating}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Approve
              </button>

              <button
                onClick={onReject}
                disabled={updating}
                className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Reject
              </button>
            </div>

            {log.verified_at && (
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-xs leading-5 text-slate-400">
                <p>
                  Verified by{" "}
                  <span className="font-bold text-slate-200">
                    {log.verified_by_username || "-"}
                  </span>
                </p>
                <p>{formatDate(log.verified_at)}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "yellow" | "red" | "sky";
}) {
  const toneClass = {
    emerald: "text-emerald-300",
    yellow: "text-yellow-300",
    red: "text-red-300",
    sky: "text-sky-300",
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

function PredictionBadge({ status }: { status: string }) {
  const className =
    status === "success"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
      : status === "low_confidence"
      ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
      : "border-slate-600 bg-slate-800 text-slate-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {status.toUpperCase()}
    </span>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const className =
    status === "approved"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
      : status === "rejected"
      ? "border-red-400/40 bg-red-400/10 text-red-300"
      : "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {status.toUpperCase()}
    </span>
  );
}

function formatDate(value?: string | null) {
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
