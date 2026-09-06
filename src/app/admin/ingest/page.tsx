import { prisma, isDbAvailable } from "@/lib/prisma";

export default async function AdminIngestPage() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").filter(Boolean);
  // Simple check: if ADMIN_EMAILS set, require? For demo, allow all
  let jobs: Array<{ servicer: string; status: string; ingested: number; failed: number; finishedAt: string | null; created: number; updated: number }> = [];
  if (await isDbAvailable()) {
    try {
      const rows = await prisma.ingestJob.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
      jobs = rows.map((r) => ({
        servicer: r.servicer,
        status: r.status,
        ingested: r.ingested,
        failed: r.failed,
        finishedAt: r.finishedAt?.toISOString() ?? null,
        created: r.created,
        updated: r.updated,
      }));
    } catch {}
  }
  if (jobs.length === 0) {
    const { MOCK_PROPERTIES } = await import("@/lib/mockData");
    const counts: Record<string, number> = {};
    for (const p of MOCK_PROPERTIES) counts[p.servicer] = (counts[p.servicer] ?? 0) + 1;
    jobs = Object.entries(counts).map(([s, n]) => ({ servicer: s, status: "success", ingested: n, failed: 0, finishedAt: new Date().toISOString(), created: 0, updated: n }));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Admin — Ingest por servicer</h1>
      <p className="text-sm text-zinc-500">Solo visible para {adminEmails.length ? adminEmails.join(", ") : "demo"} (ADMIN_EMAILS)</p>
      <table className="w-full mt-6 bg-white border rounded-xl overflow-hidden text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="text-left p-3">Servicer</th>
            <th className="text-left p-3">Status</th>
            <th className="p-3">Ingested</th>
            <th className="p-3">Failed</th>
            <th className="p-3">Last</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.servicer} className="border-t">
              <td className="p-3 font-medium">{j.servicer}</td>
              <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${j.status === "success" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{j.status}</span></td>
              <td className="p-3 text-center">{j.ingested}</td>
              <td className="p-3 text-center">{j.failed}</td>
              <td className="p-3 text-xs text-zinc-500">{j.finishedAt ? new Date(j.finishedAt).toLocaleString("es-ES") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action="/api/cron/ingest" method="post" className="mt-6">
        <button formAction="/api/cron/ingest" className="px-4 py-2 bg-black text-white rounded-xl text-sm">Re-ejecutar ingesta (POST /api/cron/ingest)</button>
      </form>
    </div>
  );
}
