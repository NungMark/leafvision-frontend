"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { API_BASE_URL, clearAuth, getAuthHeaders, getToken } from "../lib/auth";

type ReportRow = {
  className: string;
  precision: string;
  recall: string;
  f1Score: string;
  support: string;
};

const reportRows: ReportRow[] = [
  { className: "Bamboo Grass", precision: "0.8333", recall: "1.0000", f1Score: "0.9091", support: "20" },
  { className: "Betel Vine", precision: "0.9524", recall: "1.0000", f1Score: "0.9756", support: "20" },
  { className: "Hairy Basil", precision: "0.7857", recall: "1.0000", f1Score: "0.8800", support: "11" },
  { className: "Holy Basil", precision: "0.8261", recall: "0.9500", f1Score: "0.8837", support: "20" },
  { className: "Kaffer Lime", precision: "0.4667", recall: "0.3500", f1Score: "0.4000", support: "20" },
  { className: "Kitchen Mint", precision: "1.0000", recall: "0.9000", f1Score: "0.9474", support: "20" },
  { className: "Laurel Clockvine", precision: "0.9500", recall: "0.9500", f1Score: "0.9500", support: "20" },
  { className: "Long Pepper", precision: "0.4348", recall: "0.5000", f1Score: "0.4651", support: "20" },
  { className: "Mitragyna Speciosa", precision: "1.0000", recall: "1.0000", f1Score: "1.0000", support: "21" },
  { className: "Siam Weed", precision: "1.0000", recall: "0.7000", f1Score: "0.8235", support: "30" },
  { className: "Siamese Neem", precision: "0.9500", recall: "0.9500", f1Score: "0.9500", support: "20" },
  { className: "Tiger Herbal", precision: "1.0000", recall: "0.9500", f1Score: "0.9744", support: "20" },
  { className: "Wildbetal Leafbush", precision: "0.8696", recall: "1.0000", f1Score: "0.9302", support: "20" },
];

const weakClasses = [
  {
    name: "Kaffer Lime",
    issue: "ถูกทำนายเป็น Long Pepper 12 จาก 20 รูป",
    detail: "Recall ต่ำ เพราะโมเดลแยกจาก Long Pepper ได้ยาก",
    f1: "0.4000",
  },
  {
    name: "Long Pepper",
    issue: "ถูกทำนายเป็น Kaffer Lime 8 จาก 20 รูป",
    detail: "มีลักษณะใบใกล้เคียงกับ Kaffer Lime",
    f1: "0.4651",
  },
  {
    name: "Siam Weed",
    issue: "ทายถูก 21 จาก 30 รูป",
    detail: "Recall = 0.70 ยังต่ำกว่าคลาสอื่น",
    f1: "0.8235",
  },
];

const classNames = [
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
];

const confusionMatrix = [
  [20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 7, 0, 0, 12, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 18, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 8, 0, 1, 10, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 21, 0, 0, 0, 0],
  [1, 1, 1, 4, 0, 0, 0, 0, 0, 21, 0, 0, 2],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 19, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20],
];

const splitComparisonRows = [
  {
    split: "70 / 20 / 10",
    train: "1,826",
    validation: "522",
    test: "261",
    accuracy: "87.36%",
    loss: "0.2100",
    macroF1: "0.8716",
    macroAuc: "0.9903",
  },
  {
    split: "60 / 20 / 20",
    train: "1,565",
    validation: "522",
    test: "522",
    accuracy: "83.52%",
    loss: "0.3475",
    macroF1: "0.8358",
    macroAuc: "0.9911",
  },
  {
    split: "50 / 20 / 30",
    train: "1,304",
    validation: "522",
    test: "783",
    accuracy: "86.72%",
    loss: "0.2717",
    macroF1: "0.8611",
    macroAuc: "0.9916",
  },
];

export default function PerformancePage() {
  const router = useRouter();
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
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
              >
                Analyzer
              </Link>

              <Link
                href="/performance"
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"
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
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/"
                    className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                  >
                    ← Back to Analyzer
                  </Link>

                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Model Evaluation Report
                  </div>
                </div>

                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  Model{" "}
                  <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                    Performance
                  </span>
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-lg">
                  สรุปผลการประเมินโมเดล MobileNetV2 Fine-tuned
                  สำหรับจำแนกภาพใบไม้ 13 ชนิด พร้อม Accuracy, Split Comparison,
                  ROC/AUC, Confusion Matrix และ Classification Report
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Final Accuracy" value="86.72%" detail="50/20/30 split" tone="emerald" />
              <MetricCard label="Test Loss" value="0.2717" detail="Lower is better" tone="sky" />
              <MetricCard label="Macro AUC" value="0.9916" detail="One-vs-Rest ROC" tone="lime" />
              <MetricCard label="Test Images" value="783" detail="Large test set" tone="yellow" />
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-2xl font-black">Dataset Summary</h2>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Dataset ถูกแบ่งเป็น train, validation และ test เพื่อฝึกโมเดล
                  จูนโมเดล และประเมินด้วยภาพที่โมเดลไม่เคยเห็นมาก่อน
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <DatasetCard split="Train" images="1,304" purpose="ใช้ฝึกโมเดล" />
                  <DatasetCard split="Validation" images="522" purpose="ใช้จูนโมเดล" />
                  <DatasetCard split="Test" images="783" purpose="ใช้ประเมินจริง" />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-2xl font-black">Split Comparison</h2>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  เพื่อเพิ่มความน่าเชื่อถือของโมเดล มีการทดลองแบ่งข้อมูลหลายรูปแบบ
                  และพบว่าเมื่อเพิ่ม test set เป็น 30% โมเดลยังรักษา Accuracy ได้ดี
                </p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-left text-slate-400">
                        <th className="p-3">Split</th>
                        <th className="p-3 text-right">Train</th>
                        <th className="p-3 text-right">Val</th>
                        <th className="p-3 text-right">Test</th>
                        <th className="p-3 text-right">Accuracy</th>
                        <th className="p-3 text-right">Loss</th>
                        <th className="p-3 text-right">Macro F1</th>
                        <th className="p-3 text-right">Macro AUC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {splitComparisonRows.map((row) => (
                        <tr key={row.split} className="border-b border-slate-800">
                          <td className="p-3 font-bold text-white">{row.split}</td>
                          <td className="p-3 text-right text-slate-300">{row.train}</td>
                          <td className="p-3 text-right text-slate-300">{row.validation}</td>
                          <td className="p-3 text-right text-slate-300">{row.test}</td>
                          <td className="p-3 text-right font-black text-emerald-300">{row.accuracy}</td>
                          <td className="p-3 text-right text-slate-300">{row.loss}</td>
                          <td className="p-3 text-right text-slate-300">{row.macroF1}</td>
                          <td className="p-3 text-right font-bold text-sky-300">{row.macroAuc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-2xl font-black">Key Findings</h2>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  โมเดลทำงานได้ดีในหลายคลาส แต่ยังมีบางคลาสที่สับสนกัน
                  โดยเฉพาะคลาสที่ลักษณะใบใกล้เคียงกัน
                </p>

                <div className="mt-5 space-y-3">
                  {weakClasses.map((item) => (
                    <div key={item.name} className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-yellow-200">{item.name}</h3>
                          <p className="mt-1 text-sm font-semibold text-yellow-100/90">{item.issue}</p>
                          <p className="mt-1 text-sm text-yellow-100/70">{item.detail}</p>
                        </div>

                        <div className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                          F1 {item.f1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-2xl font-black text-emerald-200">Conclusion</h2>

                <p className="mt-3 text-sm leading-7 text-emerald-50/90">
                  โมเดลหลัง fine-tuning สามารถจำแนกพืช 13 ชนิดได้ดี โดย split
                  50/20/30 ได้ Test Accuracy 86.72% และ Macro AUC 0.9916
                  แสดงว่าโมเดลยังรักษาประสิทธิภาพได้แม้ใช้ test set ขนาดใหญ่ขึ้น
                  จุดที่ควรปรับปรุงต่อคือเพิ่มข้อมูลของ Kaffer Lime และ Long Pepper
                  รวมถึงพัฒนา segmentation หรือ class-specific threshold ในอนาคต
                </p>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-2xl font-black">Confusion Matrix</h2>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  ตารางนี้แสดงจำนวนภาพจริงเทียบกับผลที่โมเดลทำนาย
                  ค่าแนวทแยงคือจำนวนที่ทำนายถูก
                </p>

                <div className="mt-5 max-h-[560px] overflow-auto rounded-2xl border border-slate-700">
                  <table className="min-w-[1100px] border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="sticky left-0 top-0 z-20 bg-slate-950 p-2 text-left text-slate-400">
                          True \ Pred
                        </th>
                        {classNames.map((name) => (
                          <th key={name} className="sticky top-0 bg-slate-950 p-2 text-slate-400">
                            {shortName(name)}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {confusionMatrix.map((row, rowIndex) => (
                        <tr key={classNames[rowIndex]}>
                          <td className="sticky left-0 z-10 bg-slate-950 p-2 font-bold text-slate-300">
                            {shortName(classNames[rowIndex])}
                          </td>

                          {row.map((value, colIndex) => {
                            const isCorrect = rowIndex === colIndex;
                            const isProblem =
                              (classNames[rowIndex] === "Kaffer Lime" && classNames[colIndex] === "Long Pepper") ||
                              (classNames[rowIndex] === "Long Pepper" && classNames[colIndex] === "Kaffer Lime");

                            return (
                              <td
                                key={`${rowIndex}-${colIndex}`}
                                className={`border border-slate-800 p-2 text-center font-semibold ${
                                  isCorrect
                                    ? "bg-emerald-400/20 text-emerald-200"
                                    : isProblem
                                    ? "bg-yellow-400/20 text-yellow-200"
                                    : value > 0
                                    ? "bg-red-400/10 text-red-200"
                                    : "text-slate-600"
                                }`}
                              >
                                {value}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-2xl font-black">Classification Report</h2>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Precision, Recall และ F1-score ใช้วิเคราะห์โมเดลราย class
                </p>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-700">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-950/80 text-left text-slate-400">
                        <th className="p-3">Class</th>
                        <th className="p-3 text-right">Precision</th>
                        <th className="p-3 text-right">Recall</th>
                        <th className="p-3 text-right">F1-score</th>
                        <th className="p-3 text-right">Support</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reportRows.map((row) => (
                        <tr key={row.className} className="border-b border-slate-800">
                          <td className="p-3 font-bold text-white">{row.className}</td>
                          <td className="p-3 text-right text-slate-300">{row.precision}</td>
                          <td className="p-3 text-right text-slate-300">{row.recall}</td>
                          <td
                            className={`p-3 text-right font-black ${
                              Number(row.f1Score) < 0.5
                                ? "text-red-300"
                                : Number(row.f1Score) < 0.85
                                ? "text-yellow-300"
                                : "text-emerald-300"
                            }`}
                          >
                            {row.f1Score}
                          </td>
                          <td className="p-3 text-right text-slate-300">{row.support}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          <footer className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-400 backdrop-blur">
            <p>
              MobileNetV2 Fine-tuned • Split 50/20/30 • Test Accuracy{" "}
              <span className="font-bold text-emerald-300">86.72%</span> •
              Macro AUC <span className="font-bold text-sky-300">0.9916</span>
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
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "sky" | "lime" | "yellow";
}) {
  const toneClass = {
    emerald: "text-emerald-300",
    sky: "text-sky-300",
    lime: "text-lime-300",
    yellow: "text-yellow-300",
  }[tone];

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className={`mt-3 text-4xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function DatasetCard({
  split,
  images,
  purpose,
}: {
  split: string;
  images: string;
  purpose: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
      <p className="text-sm font-bold text-slate-300">{split}</p>
      <p className="mt-2 text-3xl font-black text-emerald-300">{images}</p>
      <p className="mt-1 text-xs text-slate-400">{purpose}</p>
    </div>
  );
}

function shortName(name: string) {
  return name
    .replace("Bamboo Grass", "Bamboo")
    .replace("Betel Vine", "Betel")
    .replace("Hairy Basil", "Hairy")
    .replace("Holy Basil", "Holy")
    .replace("Kaffer Lime", "Kaffer")
    .replace("Kitchen Mint", "Mint")
    .replace("Laurel Clockvine", "Laurel")
    .replace("Long Pepper", "Pepper")
    .replace("Mitragyna Speciosa", "Mitragyna")
    .replace("Siam Weed", "Weed")
    .replace("Siamese Neem", "Neem")
    .replace("Tiger Herbal", "Tiger")
    .replace("Wildbetal Leafbush", "Wildbetal");
}
