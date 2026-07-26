"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "./components/AuthGuard";
import { API_BASE_URL, clearAuth, getAuthHeaders, getToken } from "./lib/auth";

type TopPrediction = {
  name: string;
  confidence: number;
};

type PredictionResult = {
  status: "success" | "low_confidence";
  prediction: string;
  display_name: string;
  confidence: number;
  message: string;
  top3: TopPrediction[];
  model_accuracy: number;
  confidence_threshold: number;
  processing_time_seconds: number;
};

type QueueStatus =
  | "pending"
  | "processing"
  | "success"
  | "low_confidence"
  | "error";

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: QueueStatus;
  result?: PredictionResult;
  error?: string;
};

export default function Home() {
  const router = useRouter();

  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const newItems: QueueItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
    }));

    setQueueItems((prev) => [...prev, ...newItems]);
    event.target.value = "";
  };

  const updateQueueItem = (id: string, updates: Partial<QueueItem>) => {
    setQueueItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const predictSingleItem = async (item: QueueItem) => {
    updateQueueItem(item.id, {
      status: "processing",
      error: undefined,
      result: undefined,
    });

    const formData = new FormData();
    formData.append("file", item.file);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        clearAuth();
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data: PredictionResult = await response.json();

      updateQueueItem(item.id, {
        status: data.status,
        result: data,
      });
    } catch (error) {
      console.error(error);

      updateQueueItem(item.id, {
        status: "error",
        error: "เกิดข้อผิดพลาดในการวิเคราะห์ภาพ",
      });
    }
  };

  const processQueue = async () => {
    const pendingItems = queueItems.filter((item) => item.status === "pending");

    if (pendingItems.length === 0) return;

    setProcessing(true);

    for (const item of pendingItems) {
      await predictSingleItem(item);
    }

    setProcessing(false);
  };

  const resetQueue = () => {
    queueItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setQueueItems([]);
  };

  const removeItem = (id: string) => {
    setQueueItems((prev) => {
      const target = prev.find((item) => item.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  const retryItem = async (item: QueueItem) => {
    setProcessing(true);
    await predictSingleItem(item);
    setProcessing(false);
  };

  const total = queueItems.length;
  const pendingCount = queueItems.filter((item) => item.status === "pending").length;
  const processingCount = queueItems.filter(
    (item) => item.status === "processing"
  ).length;
  const successCount = queueItems.filter((item) => item.status === "success").length;
  const lowConfidenceCount = queueItems.filter(
    (item) => item.status === "low_confidence"
  ).length;
  const errorCount = queueItems.filter((item) => item.status === "error").length;

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
                  Plant Image Classification
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"
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
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                History Logs
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Multi Upload + Prediction Queue + Protected API
                </div>

                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  LeafVision{" "}
                  <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                    AI
                  </span>
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  อัปโหลดภาพใบไม้หลายรูป ระบบจะจัดคิว วิเคราะห์ทีละภาพ
                  และบันทึก prediction logs โดยต้องผ่าน JWT authentication ก่อนใช้งาน
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/performance"
                    className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:from-emerald-400 hover:to-lime-400"
                  >
                    View Model Performance →
                  </Link>

                  <Link
                    href="/history"
                    className="inline-flex items-center rounded-full border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
                  >
                    View History Dashboard
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <StatCard label="Total" value={String(total)} tone="white" />
                <StatCard label="Success" value={String(successCount)} tone="emerald" />
                <StatCard label="Unknown" value={String(lowConfidenceCount)} tone="yellow" />
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-xl font-bold">Upload Leaf Images</h2>

                <p className="mt-1 text-sm text-slate-400">
                  เลือกได้หลายรูปพร้อมกัน หรือกด Browse Images ซ้ำเพื่อเพิ่มรูปเข้า queue
                </p>

                <label className="group mt-5 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-600 bg-slate-950/60 p-8 text-center transition hover:border-emerald-400/70 hover:bg-emerald-400/5">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl transition group-hover:scale-105">
                    🌿
                  </div>

                  <p className="text-lg font-bold">Choose multiple leaf images</p>

                  <p className="mt-1 text-sm text-slate-400">
                    กด Ctrl + คลิก เพื่อเลือกหลายรูป หรือเลือกเพิ่มทีละรอบได้
                  </p>

                  <div className="mt-4 rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition group-hover:bg-emerald-400">
                    Browse Images
                  </div>
                </label>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={processQueue}
                    disabled={processing || pendingCount === 0}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none"
                  >
                    {processing ? "Processing Queue..." : "Start Queue"}
                  </button>

                  <button
                    onClick={resetQueue}
                    disabled={processing || total === 0}
                    className="rounded-2xl border border-slate-700 px-5 py-4 font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed"
                  >
                    Clear Queue
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-xl font-bold">Queue Summary</h2>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <SummaryCard label="Pending" value={pendingCount} />
                  <SummaryCard label="Processing" value={processingCount} />
                  <SummaryCard label="Success" value={successCount} />
                  <SummaryCard label="Low Confidence" value={lowConfidenceCount} />
                  <SummaryCard label="Error" value={errorCount} />
                  <SummaryCard label="Total" value={total} />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-xl font-bold">Capture Guidelines</h2>

                <div className="mt-5 space-y-3">
                  {[
                    "ถ่ายให้ใบอยู่กลางภาพและเห็นเส้นใบชัด",
                    "ให้ใบกินพื้นที่ส่วนใหญ่ของภาพ",
                    "หลีกเลี่ยงภาพเบลอ แสงน้อย หรือย้อนแสง",
                    "ลดฉากหลังรบกวนและไม่ควรมีพืชหลายชนิดในภาพ",
                  ].map((tip) => (
                    <div
                      key={tip}
                      className="flex gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 p-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-300">
                        ✓
                      </span>
                      <p className="text-sm text-slate-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Prediction Queue</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    ระบบจะ predict ทีละรูป และบันทึก log ทุกครั้งที่ backend
                  </p>
                </div>
              </div>

              {queueItems.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                    🔬
                  </div>
                  <h3 className="text-xl font-bold">Queue is empty</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    อัปโหลดภาพหลายรูปเพื่อเริ่ม queue prediction
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queueItems.map((item) => (
                    <QueueResultCard
                      key={item.id}
                      item={item}
                      disabled={processing}
                      onRetry={() => retryItem(item)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <footer className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-400 backdrop-blur">
            <p>
              MobileNetV2 Fine-tuned • Test Accuracy{" "}
              <span className="font-bold text-emerald-300">85.5%</span> • 13
              Plant Classes • Confidence Threshold{" "}
              <span className="font-bold text-yellow-300">60%</span> • JWT
              Protected
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}

function QueueResultCard({
  item,
  disabled,
  onRetry,
  onRemove,
}: {
  item: QueueItem;
  disabled: boolean;
  onRetry: () => void;
  onRemove: () => void;
}) {
  const statusStyle = getStatusStyle(item.status);

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950/50 p-4">
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
          <img
            src={item.previewUrl}
            alt={item.file.name}
            className="h-40 w-full object-contain"
          />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white">{item.file.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {(item.file.size / 1024).toFixed(2)} KB
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyle}`}
              >
                {item.status.toUpperCase()}
              </span>

              <button
                onClick={onRemove}
                disabled={disabled || item.status === "processing"}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>

          {item.status === "processing" && (
            <p className="text-sm text-sky-300">กำลังวิเคราะห์ภาพ...</p>
          )}

          {item.status === "pending" && (
            <p className="text-sm text-slate-400">รอเข้าคิว predict</p>
          )}

          {item.status === "error" && (
            <div>
              <p className="text-sm text-red-300">{item.error}</p>
              <button
                onClick={onRetry}
                disabled={disabled}
                className="mt-3 rounded-full border border-red-400/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed"
              >
                Retry
              </button>
            </div>
          )}

          {item.result && (
            <div>
              <div
                className={`mb-4 rounded-2xl border p-4 ${
                  item.result.status === "low_confidence"
                    ? "border-yellow-400/30 bg-yellow-400/10"
                    : "border-emerald-400/20 bg-emerald-400/10"
                }`}
              >
                <p className="text-sm text-slate-300">Prediction</p>
                <p
                  className={`mt-1 text-2xl font-black ${
                    item.result.status === "low_confidence"
                      ? "text-yellow-300"
                      : "text-emerald-300"
                  }`}
                >
                  {item.result.status === "low_confidence"
                    ? "Unknown"
                    : item.result.display_name}
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  Confidence:{" "}
                  <span className="font-bold">
                    {item.result.confidence}%
                  </span>
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {item.result.message}
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-bold">Top 3 Predictions</h4>

                <div className="space-y-2">
                  {item.result.top3.map((pred, index) => (
                    <div
                      key={`${pred.name}-${index}`}
                      className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {index + 1}. {pred.name}
                        </span>
                        <span
                          className={`text-sm font-black ${
                            item.result?.status === "low_confidence" &&
                            index === 0
                              ? "text-yellow-300"
                              : "text-emerald-300"
                          }`}
                        >
                          {pred.confidence}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            item.result?.status === "low_confidence" &&
                            index === 0
                              ? "bg-yellow-400"
                              : "bg-emerald-400"
                          }`}
                          style={{
                            width: `${Math.min(pred.confidence, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Processing time: {item.result.processing_time_seconds}s
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status: QueueStatus) {
  if (status === "success") {
    return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "low_confidence") {
    return "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "processing") {
    return "border-sky-400/40 bg-sky-400/10 text-sky-300";
  }

  if (status === "error") {
    return "border-red-400/40 bg-red-400/10 text-red-300";
  }

  return "border-slate-600 bg-slate-800 text-slate-300";
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "white" | "emerald" | "yellow";
}) {
  const toneClass = {
    white: "text-white",
    emerald: "text-emerald-300",
    yellow: "text-yellow-300",
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
