import { ingestServicer, ingestAll } from "../services/ingest";
const arg = process.argv[2];
(async () => {
  if (arg) {
    console.log(`Ingesting ${arg}...`);
    const r = await ingestServicer(arg);
    console.log(r);
  } else {
    console.log("Ingesting all...");
    const rs = await ingestAll();
    console.table(rs);
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
