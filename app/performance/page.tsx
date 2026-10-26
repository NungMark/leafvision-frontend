"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { API_BASE_URL, clearAuth, getAuthHeaders, getToken } from "../lib/auth";
import { v12Metrics as v12 } from "../lib/v12Metrics";

function Stat({ title, value, sub, tint = "emerald" }: {title: string; value: string; sub: string; tint?: "emerald" | "amber" | "sky"}) {
  const color = tint === "amber" ? "text-amber-300" : tint === "sky" ? "text-sky-300" : "text-emerald-300";
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
    <div className="text-sm font-semibold text-slate-400">{title}</div>
    <div className={`mt-2 text-3xl font-black ${color}`}>{value}</div>
    <div className="mt-2 text-xs leading-5 text-slate-400">{sub}</div>
  </div>;
}

function ModelPerformanceContent() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [apiVersion, setApiVersion] = useState<"checking" | "v12" | "mismatch" | "offline">("checking");
  const [apiModelLabel, setApiModelLabel] = useState("");
  useEffect(() => {
    if (!getToken()) return;
    fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setRole(data?.user?.role || ""))
      .catch(() => setRole(""));
  }, []);

  // Distinguish the Colab evaluation results from the model actually deployed on Render.
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/health`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const ok = data?.model_loaded === true && data?.model_version === "v12" && data?.number_of_classes === 12;
        setApiVersion(ok ? "v12" : "mismatch");
        setApiModelLabel(`API: ${String(data?.model_version || "unknown")}, ${String(data?.number_of_classes ?? "?")} classes`);
      })
      .catch(() => { if (active) setApiVersion("offline"); });
    return () => { active = false; };
  }, []);

  const total = v12.trainImages + v12.validationImages + v12.testImages;
  const gap = (v12.internalAccuracy - v12.externalAccuracy).toFixed(2);

  return <main className="min-h-screen bg-[#020617] text-white">
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="font-black text-xl">🌿 LeafVision <span className="text-emerald-300">AI</span></Link>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold sm:text-sm">
          <Link href="/" className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:text-white">Analyzer</Link>
          <Link href="/performance" className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-300">Model Performance</Link>
          <Link href="/history" className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:text-white">History</Link>
          <Link href="/plants" className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:text-white">Plant Database</Link>
          {(role === "admin" || role === "verifier") && <Link href="/verifier/review" className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:text-white">Verifier Review</Link>}
          {role === "admin" && <Link href="/admin/users" className="rounded-full border border-slate-700 px-3 py-2 text-slate-300 hover:text-white">Admin Users</Link>}
          <button onClick={() => { clearAuth(); router.replace("/login"); }} className="rounded-full border border-red-400/30 px-3 py-2 text-red-300">Logout</button>
        </div>
      </div>
    </nav>

    <div className="mx-auto max-w-7xl space-y-7 px-5 py-8 md:px-8">
      <header className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-slate-900/80 p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">MobileNetV2 • Model v12 • {v12.classCount} Plant Classes</p>
        <h1 className="mt-3 text-3xl font-black md:text-5xl">ผลการประเมินโมเดล <span className="text-emerald-300">v12</span></h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">แสดงผลทดสอบภายในและชุดภาพภายนอกแยกกัน เพื่อให้เห็นประสิทธิภาพของโมเดลและข้อจำกัดในการจำแนกภาพใหม่อย่างตรงไปตรงมา ผลตัวเลขในหน้านี้เป็นผลจากการทดลองใน Google Colab ไม่ได้คำนวณจาก Prediction Logs ของเว็บ</p>
        <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${apiVersion === "v12" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
          {apiVersion === "checking" && "กำลังตรวจเวอร์ชันโมเดลที่ Backend ใช้งาน..."}
          {apiVersion === "v12" && `Backend เชื่อมต่อโมเดล v12 ถูกต้อง (${apiModelLabel})`}
          {apiVersion === "mismatch" && `คำเตือน: Backend ยังไม่ตรงกับ v12 (${apiModelLabel}) — กราฟด้านล่างเป็นผลทดลอง Colab v12 ไม่ใช่โมเดลของ API ปัจจุบัน`}
          {apiVersion === "offline" && "ยังติดต่อ Backend เพื่อตรวจรุ่นโมเดลไม่ได้ — กราฟด้านล่างเป็นผลทดลอง Colab v12"}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Internal Test Accuracy" value={`${v12.internalAccuracy.toFixed(2)}%`} sub={`${v12.testCorrect} / ${v12.testImages} ภาพ (ชุดทดสอบภายใน)`}/>
        <Stat title="External Test Accuracy" value={`${v12.externalAccuracy.toFixed(2)}%`} sub={`${v12.externalTestCorrect} / ${v12.externalTestImages} ภาพ (ภาพจากแหล่งภายนอก)`} tint="amber"/>
        <Stat title="Internal Macro F1" value={`${v12.internalMacroF1.toFixed(2)}%`} sub="F1-score เฉลี่ย 12 คลาส" tint="sky"/>
        <Stat title="Internal Test Loss" value={v12.testLoss.toFixed(4)} sub="ทดสอบโมเดล v12 หลัง Fine-tuning"/>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-black">เปรียบเทียบ Internal vs External</h2>
          {[{label:"Internal Test",value:v12.internalAccuracy,color:"bg-emerald-500"},{label:"External Test",value:v12.externalAccuracy,color:"bg-amber-500"}].map((x) => <div key={x.label} className="mt-5">
            <div className="mb-2 flex justify-between text-sm"><span>{x.label}</span><strong>{x.value.toFixed(2)}%</strong></div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${x.color}`} style={{width:`${x.value}%`}}/></div>
          </div>)}
          <p className="mt-5 text-sm leading-6 text-amber-100">ผลต่าง <strong>{gap} จุดเปอร์เซ็นต์</strong> สะท้อนว่าความแม่นยำกับภาพภายนอกยังต่ำกว่าชุดทดสอบภายในมาก</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">External Top-1 Accuracy ไม่รวมชุดพืชนอกคลาส Long Pepper 10 ภาพ และไม่ใช่ Display Accuracy หลังใช้เกณฑ์ Unknown 60% ซึ่งมีค่า {v12.externalDisplayAccuracy.toFixed(2)}%</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-black">Dataset v12 — แบ่ง 60 / 20 / 20</h2>
          <p className="mt-2 text-sm text-slate-400">พืช {v12.classCount} คลาส รวม {total.toLocaleString()} ภาพ แบ่งโดยพิจารณากลุ่มภาพที่เกี่ยวข้องกันเพื่อลด Data Leakage</p>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
            {[{label:"Train",n:v12.trainImages},{label:"Validation",n:v12.validationImages},{label:"Test",n:v12.testImages}].map((x) => <div key={x.label} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-center">
              <p className="text-xs text-slate-400">{x.label}</p><p className="mt-1 text-xl font-black text-emerald-300 sm:text-2xl">{x.n.toLocaleString()}</p><p className="text-xs text-slate-500">{(100*x.n/total).toFixed(1)}%</p>
            </div>)}
          </div>
          <p className="mt-5 text-sm text-slate-300">การตรวจภาพด้วย dHash และการจัดกลุ่มช่วยลดความเสี่ยงภาพคล้ายกันข้ามชุดข้อมูล แต่ไม่ได้รับประกันว่าตรวจพบทุกความสัมพันธ์ของภาพ</p>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h2 className="text-xl font-black">Confusion Matrix — ชุดทดสอบภายใน</h2>
        <p className="mt-2 text-sm text-slate-400">ทำนายถูก {v12.testCorrect} ภาพจาก {v12.testImages} ภาพ ผิดเพียง 5 ภาพ ตารางด้านล่างเป็นผลของ 12 คลาส v12 จริง</p>
        <div className="mt-5 overflow-hidden rounded-xl bg-white p-2 sm:p-5">
          <Image src="/reports/confusion_matrix_v12.png" width={1320} height={1184} alt="Confusion matrix ของ LeafVision AI MobileNetV2 v12 จำนวน 12 คลาส" className="h-auto w-full object-contain" unoptimized />
        </div>
        <a className="mt-3 inline-block text-sm font-semibold text-emerald-300 underline" href="/reports/confusion_matrix_v12.png" target="_blank" rel="noreferrer">เปิดภาพ Confusion Matrix ขนาดเต็ม</a>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {[{src:"/reports/phase2_accuracy.png",title:"กราฟ Training และ Validation Accuracy"},{src:"/reports/phase2_loss.png",title:"กราฟ Training และ Validation Loss"}].map((x) => <article key={x.src} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="mb-4 text-lg font-black">{x.title} — Fine-tuning v12</h2>
          <Image src={x.src} width={1100} height={720} alt={x.title} className="h-auto w-full rounded-xl bg-white object-contain" unoptimized/>
        </article>)}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Classification Report — Internal Test v12</h2>
          <a href="/reports/classification_report_v12.csv" className="text-sm font-semibold text-emerald-300 underline" download>ดาวน์โหลด CSV จริง</a>
        </div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[660px] text-left text-sm">
          <thead><tr className="border-b border-white/20 text-slate-400"><th className="px-2 py-3">Plant Class</th><th className="px-2 py-3 text-right">Precision</th><th className="px-2 py-3 text-right">Recall</th><th className="px-2 py-3 text-right">F1</th><th className="px-2 py-3 text-right">Support</th></tr></thead>
          <tbody>{v12.reportRows.map((x) => <tr key={x.name} className="border-b border-white/10"><td className="px-2 py-3 font-semibold">{x.name}</td><td className="px-2 py-3 text-right">{x.precision.toFixed(2)}%</td><td className="px-2 py-3 text-right">{x.recall.toFixed(2)}%</td><td className="px-2 py-3 text-right font-semibold text-emerald-300">{x.f1.toFixed(2)}%</td><td className="px-2 py-3 text-right">{x.support}</td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="rounded-3xl border border-amber-500/20 bg-slate-900/70 p-6">
        <h2 className="text-xl font-black">External Error Analysis — คลาสที่ควรปรับปรุง</h2>
        <p className="mt-2 text-sm text-slate-400">ข้อมูล External Test มาจาก 117 ภาพที่มีป้ายกำกับหลังตัด Exact Duplicates; แต่ละคลาสมีตัวอย่างเพียง 9–10 ภาพ</p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {v12.externalRows.filter((x) => ["Bamboo Grass","Holy Basil","Siam Weed","Tiger Herbal"].includes(x.name)).map((x) => <div key={x.name} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="font-bold">{x.name}</p><p className="mt-2 text-2xl font-black text-amber-300">{x.accuracy.toFixed(2)}%</p><p className="text-xs text-slate-400">ถูก {x.correct}/{x.total} ภาพ</p>
          </div>)}
        </div>
        <p className="mt-5 text-sm leading-6 text-amber-100">ทั้ง 4 คลาสมีข้อผิดพลาดรวม 30 ภาพ คิดเป็นครึ่งหนึ่งของภาพที่ทำนายผิดใน External Test ทั้งหมด (60 ภาพ) โดยมีแนวโน้มทำนายคลาสอื่นเป็น Siam Weed มากเกินไป</p>
        <p className="mt-2 text-sm text-slate-400">สาเหตุที่เป็นไปได้คือความแตกต่างระหว่างภาพฝึกกับภาพภายนอก ความหลากหลายของต้นฉบับ และคุณภาพป้ายกำกับ ซึ่งยังต้องตรวจสอบก่อนสรุปสาเหตุที่แน่ชัด</p>
        <a href="/reports/external_per_class_v12_vs_v3.csv" download className="mt-3 inline-block text-sm font-semibold text-emerald-300 underline">ดาวน์โหลดผล External รายคลาส</a>
      </section>
      <footer className="py-4 text-center text-sm text-slate-400">LeafVision AI v12 • 12 Classes • Internal {v12.internalAccuracy.toFixed(2)}% • External {v12.externalAccuracy.toFixed(2)}% • ผลประเมินจาก Google Colab</footer>
    </div>
  </main>;
}

export default function PerformancePage() { return <AuthGuard><ModelPerformanceContent /></AuthGuard>; }
