"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";
import { API_BASE_URL, clearAuth, getAuthHeaders } from "../lib/auth";

type PlantItem = {
  class_name: string;
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

type PlantsResponse = {
  total: number;
  plants: PlantItem[];
};

export default function PlantDatabasePage() {
  const router = useRouter();

  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [familyFilter, setFamilyFilter] = useState("all");

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  const fetchPlants = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/plants`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch plant database");
      }

      const data: PlantsResponse = await response.json();
      setPlants(data.plants || []);
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถโหลด Plant Database ได้ กรุณาตรวจสอบ backend หรือ login ใหม่");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPlants();
    }, 0);
    
    return () => window.clearTimeout(timer);
  }, []);

  const familyOptions = useMemo(() => {
    const families = plants
      .map((plant) => plant.family)
      .filter((item): item is string => Boolean(item));

    return Array.from(new Set(families)).sort();
  }, [plants]);

  const filteredPlants = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return plants.filter((plant) => {
      const matchesFamily =
        familyFilter === "all" || plant.family === familyFilter;

      const searchableText = [
        plant.class_name,
        plant.thai_name,
        plant.common_name,
        plant.scientific_name,
        plant.kingdom,
        plant.family,
        plant.genus,
        plant.species,
        plant.taxonomy_status,
        plant.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesFamily && matchesSearch;
    });
  }, [plants, searchText, familyFilter]);

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
                  Plant Taxonomy Database
                </p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
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
                href="/plants"
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Plant Database
              </Link>

              <Link
                href="/verifier/review"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
              >
                Verifier Review
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
                  Taxonomy Reference
                </div>

                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  Plant{" "}
                  <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                    Database
                  </span>
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  ฐานข้อมูลพืชที่ใช้ในระบบ LeafVision AI แสดงชื่อไทย ชื่อสามัญ
                  ชื่อวิทยาศาสตร์ family genus และ species สำหรับใช้อ้างอิงผลการทำนาย
                  และช่วยให้ verifier ตรวจสอบผลลัพธ์ได้ง่ายขึ้น
                </p>
              </div>

              <button
                onClick={fetchPlants}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-700"
              >
                {loading ? "Refreshing..." : "Refresh Database"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <MetricCard label="Total Plants" value={String(plants.length)} tone="white" />
              <MetricCard
                label="Families"
                value={String(familyOptions.length)}
                tone="emerald"
              />
              <MetricCard
                label="Filtered"
                value={String(filteredPlants.length)}
                tone="sky"
              />
              <MetricCard label="Source" value="Taxonomy Map" tone="yellow" />
            </div>
          </header>

          <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">Search & Filter</h2>
                <p className="mt-1 text-sm text-slate-400">
                  ค้นหาจากชื่อไทย ชื่อสามัญ ชื่อวิทยาศาสตร์ family genus หรือ species
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search plant..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 md:w-80"
                />

                <select
                  value={familyFilter}
                  onChange={(event) => setFamilyFilter(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-400"
                >
                  <option value="all">All Families</option>
                  {familyOptions.map((family) => (
                    <option key={family} value={family}>
                      {family}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40">
              <p className="text-slate-400">Loading plant database...</p>
            </div>
          ) : filteredPlants.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                🌱
              </div>
              <h3 className="text-xl font-bold">No plants found</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                ไม่พบข้อมูลพืชที่ตรงกับคำค้นหาหรือ filter นี้
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPlants.map((plant) => (
                <PlantCard key={plant.class_name} plant={plant} />
              ))}
            </div>
          )}

          <footer className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-400 backdrop-blur">
            <p>
              Plant Database • Taxonomy Mapping • Thai Name • Scientific Name •
              Family • Genus • Species
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}

function PlantCard({ plant }: { plant: PlantItem }) {
  return (
    <article className="rounded-3xl border border-slate-700 bg-slate-950/50 p-5 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Class Label</p>
          <h2 className="mt-1 text-2xl font-black text-white">
            {plant.class_name}
          </h2>
          <p className="mt-1 text-xl font-black text-emerald-300">
            {plant.thai_name || "-"}
          </p>
        </div>

        {plant.taxonomy_status && (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
            {plant.taxonomy_status}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
        <TaxonomyRow label="Common Name" value={plant.common_name || "-"} />
        <TaxonomyRow
          label="Scientific Name"
          value={plant.scientific_name || "-"}
          italic
        />
        <TaxonomyRow label="Kingdom" value={plant.kingdom || "-"} />
        <TaxonomyRow label="Family" value={plant.family || "-"} />
        <TaxonomyRow label="Genus" value={plant.genus || "-"} italic />
        <TaxonomyRow label="Species" value={plant.species || "-"} italic />
      </div>

      {plant.note && (
        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
          <p className="text-xs font-bold text-slate-400">Note</p>
          <p className="mt-1 text-sm leading-6 text-slate-200">{plant.note}</p>
        </div>
      )}
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
  tone: "white" | "emerald" | "yellow" | "sky";
}) {
  const toneClass = {
    white: "text-white",
    emerald: "text-emerald-300",
    yellow: "text-yellow-300",
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

function TaxonomyRow({
  label,
  value,
  italic = false,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-800 py-2 last:border-b-0">
      <span className="text-sm text-slate-400">{label}</span>

      {italic ? (
        <span className="text-right text-sm font-semibold italic text-slate-200">
          {value}
        </span>
      ) : (
        <span className="text-right text-sm font-semibold text-slate-200">
          {value}
        </span>
      )}
    </div>
  );
}
