"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";
import { API_BASE_URL, clearAuth, getAuthHeaders, getToken } from "../lib/auth";

type TaxonomyInfo = {
  thai_name?: string;
  common_name?: string;
  scientific_name?: string;
  kingdom?: string;
  family?: string;
  genus?: string;
  species?: string;
  taxonomy_status?: string;
  note?: string;
};

type TopPrediction = {
  name: string;
  confidence: number;
  taxonomy?: TaxonomyInfo;
};

type PredictionLog = {
  id: number;
  filename: string;
  content_type: string;
  file_size: number;
  image_url?: string;
  status: "success" | "low_confidence" | "error" | string;
  prediction: string;
  display_name: string;
  confidence: number;
  taxonomy?: TaxonomyInfo;
  top3: TopPrediction[];
  model_accuracy: number;
  confidence_threshold: number;
  processing_time_seconds: number;
  created_at: string;
  user_id?: number;
  username?: string;
  verified_status?: "pending" | "approved" | "rejected" | string;
  actual_class?: string | null;
  is_correct?: number | null;
  verification_note?: string | null;
  verified_by?: number | null;
  verified_by_username?: string | null;
  verified_at?: string | null;
};

type LogsResponse = {
  total: number;
  logs: PredictionLog[];
};

type LogsSummary = {
  total_predictions: number;
  status_counts: Record<string, number>;
  prediction_counts: Record<string, number>;
  average_confidence: number;
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<PredictionLog[]>([]);
  const [summary, setSummary] = useState<LogsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = getToken();

      if (!token) {
        setIsAdmin(false);
        setIsVerifier(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          setIsAdmin(false);
          setIsVerifier(false);
          return;
        }

        const data = await response.json();
        const role = data?.user?.role;

        setIsAdmin(role === "admin");
        setIsVerifier(role === "verifier");
      } catch (error) {
        console.error(error);
        setIsAdmin(false);
        setIsVerifier(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  const fetchLogs = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [logsResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/logs?limit=${limit}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/logs/summary`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (!logsResponse.ok) {
        throw new Error("Failed to fetch logs");
      }

      if (!summaryResponse.ok) {
        throw new Error("Failed to fetch summary");
      }

      const logsData: LogsResponse = await logsResponse.json();
      const summaryData: LogsSummary = await summaryResponse.json();

      setLogs(logsData.logs);
      setSummary(summaryData);
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถโหลด Prediction Logs ได้ กรุณาตรวจสอบว่า backend เปิดอยู่ หรือกรุณา login ใหม่");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start the async request after the effect callback to avoid a synchronous state update.
    void Promise.resolve().then(() => fetchLogs());
  }, [limit]);

  const filteredLogs =
    statusFilter === "all"
      ? logs
      : logs.filter((log) => log.status === statusFilter);

  const successCount = summary?.status_counts?.success || 0;
  const lowConfidenceCount = summary?.status_counts?.low_confidence || 0;

  const pendingReviewCount = logs.filter(
    (log) => !log.verified_status || log.verified_status === "pending"
  ).length;
  const approvedReviewCount = logs.filter(
    (log) => log.verified_status === "approved"
  ).length;
  const rejectedReviewCount = logs.filter(
    (log) => log.verified_status === "rejected"
  ).length;
  const verifiedCorrectCount = logs.filter((log) => log.is_correct === 1).length;
  const verifiedIncorrectCount = logs.filter((log) => log.is_correct === 0).length;

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
                Taxonomy-aware Plant Classification
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
              Model Performance
            </Link>

            <Link
              href="/history"
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"
            >
              History Logs
            </Link>

            <Link
              href="/plants"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
            >
              Plant Database
            </Link>

            {(isAdmin || isVerifier) && (
              <Link
                href="/verifier/review"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
              >
                Verifier Review
              </Link>
            )}

            {isAdmin && (
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
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Taxonomy-aware Prediction Logs
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                Prediction{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                  History
                </span>
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                หน้านี้ใช้สำหรับตรวจสอบประวัติการทำนายผลย้อนหลัง
                เพื่อดูว่า user อัปโหลดไฟล์อะไร ระบบตอบอะไร confidence เท่าไหร่
                และใช้เวลาประมวลผลกี่วินาที
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
              >
                {loading ? "Refreshing..." : "Refresh Logs"}
              </button>

              <a
                href={`${API_BASE_URL}/logs`}
                target="_blank"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
              >
                Open JSON
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              label="Total Predictions"
              value={String(summary?.total_predictions || 0)}
              tone="white"
            />
            <MetricCard
              label="Success"
              value={String(successCount)}
              tone="emerald"
            />
            <MetricCard
              label="Low Confidence"
              value={String(lowConfidenceCount)}
              tone="yellow"
            />
            <MetricCard
              label="Pending Review"
              value={String(pendingReviewCount)}
              tone="yellow"
            />
            <MetricCard
              label="Approved"
              value={String(approvedReviewCount)}
              tone="emerald"
            />
            <MetricCard
              label="Rejected"
              value={String(rejectedReviewCount)}
              tone="red"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Verified Correct"
              value={String(verifiedCorrectCount)}
              tone="emerald"
            />
            <MetricCard
              label="Verified Incorrect"
              value={String(verifiedIncorrectCount)}
              tone="red"
            />
            <MetricCard
              label="Avg Confidence"
              value={`${summary?.average_confidence || 0}%`}
              tone="sky"
            />
          </div>
        </header>

        <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Log Filters</h2>
              <p className="mt-1 text-sm text-slate-400">
                เลือกจำนวน log ที่ต้องการดู และกรองตามสถานะ prediction
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-400"
              >
                <option value={25}>Latest 25</option>
                <option value={50}>Latest 50</option>
                <option value={100}>Latest 100</option>
                <option value={200}>Latest 200</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-400"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="low_confidence">Low Confidence</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Prediction Logs</h2>
              <p className="mt-1 text-sm text-slate-400">
                Showing {filteredLogs.length} logs from latest {logs.length} records
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40">
              <p className="text-slate-400">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                🧾
              </div>
              <h3 className="text-xl font-bold">No logs found</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                ยังไม่มีประวัติการทำนาย หรือไม่มี log ที่ตรงกับ filter นี้
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-400 backdrop-blur">
          <p>
            Prediction Logs • Taxonomy Tracking • Verification Tracking • SQLite Backend Storage • Confidence Threshold{" "}
            <span className="font-bold text-yellow-300">60%</span> • Model
            v12 Internal <span className="font-bold text-emerald-300">98.92%</span> • External <span className="font-bold text-yellow-300">48.72%</span>
            <span className="block mt-2 text-xs text-slate-500">ประวัติเดิมอาจสร้างโดยโมเดลรุ่นก่อนหน้า ค่าที่แสดงในแต่ละ Log คือค่าที่บันทึกตอนทำนาย</span>
          </p>
        </footer>
      </section>
      </main>
    </AuthGuard>
  );
}

function LogCard({ log }: { log: PredictionLog }) {
  const statusStyle = getStatusStyle(log.status);
  const isLowConfidence = log.status === "low_confidence";

  return (
    <article className="rounded-3xl border border-slate-700 bg-slate-950/50 p-4">
      {log.image_url && (
        <div className="mb-4 overflow-hidden rounded-3xl border border-slate-700 bg-slate-900">
          <img
            src={`${API_BASE_URL}${log.image_url}`}
            alt={log.filename}
            className="h-72 w-full object-contain"
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-black text-white">
                  #{log.id} {log.filename}
                </p>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyle}`}
                >
                  {log.status.toUpperCase()}
                </span>

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

              <p className="mt-1 text-xs text-slate-400">
                {formatDate(log.created_at)} • {formatFileSize(log.file_size)} •{" "}
                {log.content_type}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">Processing Time</p>
              <p className="font-black text-sky-300">
                {log.processing_time_seconds}s
              </p>
            </div>
          </div>

          <div
            className={`mb-4 rounded-2xl border p-4 ${
              isLowConfidence
                ? "border-yellow-400/30 bg-yellow-400/10"
                : "border-emerald-400/20 bg-emerald-400/10"
            }`}
          >
            <p className="text-sm text-slate-300">Prediction</p>

            <p
              className={`mt-1 text-2xl font-black ${
                isLowConfidence ? "text-yellow-300" : "text-emerald-300"
              }`}
            >
              {isLowConfidence ? "Unknown" : log.display_name}
            </p>

            <p className="mt-2 text-sm text-slate-300">
              Confidence:{" "}
              <span className="font-bold">{log.confidence}%</span>
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Threshold: {log.confidence_threshold}% • Model Accuracy:{" "}
              {log.model_accuracy}%
            </p>
          </div>

          {log.taxonomy && Object.keys(log.taxonomy).length > 0 && (
            <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-300">Taxonomy Information</p>
                  <p className="mt-1 text-xl font-black text-emerald-300">
                    {log.taxonomy.thai_name || log.taxonomy.common_name || "-"}
                  </p>
                </div>

                {log.taxonomy.taxonomy_status && (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                    {log.taxonomy.taxonomy_status}
                  </span>
                )}
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <InfoRow label="Thai Name" value={log.taxonomy.thai_name || "-"} />
                <InfoRow label="Common Name" value={log.taxonomy.common_name || "-"} />
                <InfoRow
                  label="Scientific Name"
                  value={log.taxonomy.scientific_name || "-"}
                />
                <InfoRow label="Kingdom" value={log.taxonomy.kingdom || "-"} />
                <InfoRow label="Family" value={log.taxonomy.family || "-"} />
                <InfoRow label="Genus" value={log.taxonomy.genus || "-"} />
                <InfoRow label="Species" value={log.taxonomy.species || "-"} />
              </div>

              {log.taxonomy.note && (
                <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs font-bold text-slate-400">Taxonomy Note</p>
                  <p className="mt-1 text-sm leading-6 text-slate-200">
                    {log.taxonomy.note}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mb-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-slate-300">Verification Result</p>
                <p className="mt-1 text-xl font-black text-sky-300">
                  {(log.verified_status || "pending").toUpperCase()}
                </p>
              </div>

              {log.is_correct === 1 && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                  MODEL CORRECT
                </span>
              )}

              {log.is_correct === 0 && (
                <span className="rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs font-black text-red-300">
                  MODEL INCORRECT
                </span>
              )}
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <InfoRow label="Actual Class" value={log.actual_class || "-"} />
              <InfoRow
                label="Verified By"
                value={log.verified_by_username || "-"}
              />
              <InfoRow label="Verified At" value={formatDate(log.verified_at || "")} />
              <InfoRow
                label="Is Correct"
                value={
                  log.is_correct === 1
                    ? "Correct"
                    : log.is_correct === 0
                    ? "Incorrect"
                    : "-"
                }
              />
            </div>

            {log.verification_note && (
              <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs font-bold text-slate-400">Verifier Note</p>
                <p className="mt-1 text-sm leading-6 text-slate-200">
                  {log.verification_note}
                </p>
              </div>
            )}
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

                    <span
                      className={`text-sm font-black ${
                        isLowConfidence && index === 0
                          ? "text-yellow-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {item.confidence}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        isLowConfidence && index === 0
                          ? "bg-yellow-400"
                          : "bg-emerald-400"
                      }`}
                      style={{
                        width: `${Math.min(item.confidence, 100)}%`,
                      }}
                    />
                  </div>

                  {item.taxonomy && (
                    <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-xs leading-5 text-slate-400">
                      <p>
                        <span className="text-slate-500">Thai:</span>{" "}
                        {item.taxonomy.thai_name || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Scientific:</span>{" "}
                        <i>{item.taxonomy.scientific_name || "-"}</i>
                      </p>

                      <p>
                        <span className="text-slate-500">Family:</span>{" "}
                        {item.taxonomy.family || "-"}{" "}
                        <span className="text-slate-600">|</span>{" "}
                        <span className="text-slate-500">Genus:</span>{" "}
                        <i>{item.taxonomy.genus || "-"}</i>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-700 bg-slate-900/70 p-4">
          <h3 className="font-bold">Log Metadata</h3>

          <div className="mt-4 space-y-3 text-sm">
            <InfoRow label="Log ID" value={`#${log.id}`} />
            <InfoRow label="Status" value={log.status} />
            <InfoRow label="Prediction" value={log.prediction} />
            <InfoRow label="Confidence" value={`${log.confidence}%`} />

            {log.taxonomy && Object.keys(log.taxonomy).length > 0 && (
              <>
                <InfoRow label="Thai Name" value={log.taxonomy.thai_name || "-"} />
                <InfoRow
                  label="Scientific"
                  value={log.taxonomy.scientific_name || "-"}
                />
                <InfoRow label="Family" value={log.taxonomy.family || "-"} />
                <InfoRow label="Genus" value={log.taxonomy.genus || "-"} />
              </>
            )}

            <InfoRow label="File Size" value={formatFileSize(log.file_size)} />
            <InfoRow label="Created At" value={formatDate(log.created_at)} />
            <InfoRow
              label="Verification"
              value={(log.verified_status || "pending").toUpperCase()}
            />
            <InfoRow label="Actual Class" value={log.actual_class || "-"} />
            <InfoRow
              label="Correct?"
              value={
                log.is_correct === 1
                  ? "Correct"
                  : log.is_correct === 0
                  ? "Incorrect"
                  : "-"
              }
            />
            <InfoRow
              label="Verified By"
              value={log.verified_by_username || "-"}
            />
            <InfoRow
              label="Verified At"
              value={formatDate(log.verified_at || "")}
            />
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
  tone: "white" | "emerald" | "yellow" | "sky" | "red";
}) {
  const toneClass = {
    white: "text-white",
    emerald: "text-emerald-300",
    yellow: "text-yellow-300",
    sky: "text-sky-300",
    red: "text-red-300",
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function getStatusStyle(status: string) {
  if (status === "success") {
    return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "low_confidence") {
    return "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "error") {
    return "border-red-400/40 bg-red-400/10 text-red-300";
  }

  return "border-slate-600 bg-slate-800 text-slate-300";
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}

function formatDate(value: string) {
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