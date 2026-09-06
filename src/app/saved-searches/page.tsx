"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Saved = { id: string; name: string; filters: Record<string, unknown>; createdAt: string };
export default function SavedSearchesPage() {
  const [items, setItems] = useState<Saved[]>([]);
  const [alerts, setAlerts] = useState<Array<{ id: string; propertyId: string; type: string }>>([]);

  const load = () => {
    fetch("/api/saved-searches").then((r) => r.json()).then((j) => setItems(Array.isArray(j) ? j : []));
    fetch("/api/alerts").then((r) => r.json()).then((j) => setAlerts(Array.isArray(j) ? j : []));
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/" className="text-sm text-zinc-600 hover:underline">← Volver</Link>
      <h1 className="text-2xl font-bold mt-4">Mis búsquedas & alertas</h1>
      <p className="text-sm text-zinc-500">Recibe avisos cuando hay nuevas altas o bajadas &gt;5% en tus criterios.</p>

      <div className="mt-6">
        <h2 className="font-semibold">Alertas ({alerts.length})</h2>
        {alerts.length === 0 ? <div className="text-sm text-zinc-500 mt-2">Sin alertas. Guarda una búsqueda y ejecuta <code>POST /api/cron/ingest</code> tras una ingesta.</div> : alerts.map((a) => (
          <div key={a.id} className="mt-2 bg-white border rounded-xl p-3 flex justify-between">
            <div className="text-sm"><span className="font-medium">{a.type}</span> — <Link href={`/properties/${a.propertyId}`} className="text-blue-600 underline">{a.propertyId}</Link></div>
            <span className="text-xs text-zinc-500">{a.id.slice(0,8)}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-semibold">Búsquedas guardadas ({items.length})</h2>
        {items.length === 0 ? <div className="text-sm text-zinc-500 mt-2">Aún no has guardado búsquedas. Usa “🔔 Alertar de esta búsqueda” en el mapa.</div> : items.map((s) => (
          <div key={s.id} className="mt-3 bg-white border rounded-xl p-4">
            <div className="font-medium">{s.name}</div>
            <pre className="text-xs bg-zinc-50 p-2 rounded mt-2 overflow-auto">{JSON.stringify(s.filters, null, 2)}</pre>
            <div className="flex gap-2 mt-3">
              <Link href={`/?${new URLSearchParams(s.filters as Record<string,string>).toString()}`} className="text-sm text-blue-600 underline">Ver resultados</Link>
              <button onClick={() => del(s.id)} className="text-sm text-red-600">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
