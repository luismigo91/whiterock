"use client";
import { useEffect, useState } from "react";

export type FilterState = {
  q: string;
  priceMin?: string;
  priceMax?: string;
  areaMin?: string;
  roomsMin?: string;
  servicer: string[];
  propertyType: string[];
  province?: string;
  sort: "newest" | "priceAsc" | "priceDesc" | "areaDesc";
};

const SERVICERS = [
  { id: "aliseda", label: "Aliseda" },
  { id: "servihabitat", label: "Servihabitat" },
  { id: "haya", label: "Haya" },
  { id: "altamira", label: "Altamira" },
  { id: "solvia", label: "Solvia" },
  { id: "anticipa", label: "Anticipa" },
  { id: "diglo", label: "Diglo" },
];

const TYPES = ["piso", "casa", "atico", "local", "suelo_urbano", "garaje", "nave", "chalet"];

export default function Filters({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  function update(patch: Partial<FilterState>) {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
      <div>
        <input
          placeholder="Buscar por municipio, provincia…"
          value={local.q}
          onChange={(e) => update({ q: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Precio mín" type="number" value={local.priceMin ?? ""} onChange={(e) => update({ priceMin: e.target.value || undefined })} className="rounded-lg border px-3 py-2 text-sm" />
        <input placeholder="Precio máx" type="number" value={local.priceMax ?? ""} onChange={(e) => update({ priceMax: e.target.value || undefined })} className="rounded-lg border px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input placeholder="m² mín" type="number" value={local.areaMin ?? ""} onChange={(e) => update({ areaMin: e.target.value || undefined })} className="rounded-lg border px-3 py-2 text-sm" />
        <input placeholder="Hab. mín" type="number" value={local.roomsMin ?? ""} onChange={(e) => update({ roomsMin: e.target.value || undefined })} className="rounded-lg border px-3 py-2 text-sm" />
      </div>

      <div>
        <div className="text-xs font-semibold text-zinc-600 mb-2">Servicer</div>
        <div className="flex flex-wrap gap-1.5">
          {SERVICERS.map((s) => {
            const active = local.servicer.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => update({ servicer: active ? local.servicer.filter((x) => x !== s.id) : [...local.servicer, s.id] })}
                className={`px-2.5 py-1 rounded-full text-xs border font-medium ${active ? "bg-black text-white border-black" : "bg-white text-zinc-700"}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-zinc-600 mb-2">Tipo</div>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => {
            const active = local.propertyType.includes(t);
            return (
              <button
                key={t}
                onClick={() => update({ propertyType: active ? local.propertyType.filter((x) => x !== t) : [...local.propertyType, t] })}
                className={`px-2.5 py-1 rounded-full text-xs border capitalize ${active ? "bg-zinc-900 text-white border-zinc-900" : "bg-white"}`}
              >
                {t.replace("_", " ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <select value={local.sort} onChange={(e) => update({ sort: e.target.value as never })} className="flex-1 rounded-lg border px-3 py-2 text-sm">
          <option value="newest">Más recientes</option>
          <option value="priceAsc">Precio ↑</option>
          <option value="priceDesc">Precio ↓</option>
          <option value="areaDesc">Superficie ↓</option>
        </select>
        <button
          onClick={() => { const reset: FilterState = { q: "", servicer: [], propertyType: [], sort: "newest" }; setLocal(reset); onChange(reset); }}
          className="px-3 py-2 rounded-lg border text-sm"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
