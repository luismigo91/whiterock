import type { ServicerAdapter } from "./types";
import { alisedaAdapter } from "./aliseda";
import { servihabitatAdapter } from "./servihabitat";
import { hayaAdapter } from "./haya";
import { altamiraAdapter } from "./altamira";
import { solviaAdapter } from "./solvia";
import { genericAdapter } from "./generic";

export const adapters: Record<string, ServicerAdapter> = {
  aliseda: alisedaAdapter,
  servihabitat: servihabitatAdapter,
  haya: hayaAdapter,
  altamira: altamiraAdapter,
  solvia: solviaAdapter,
  anticipa: genericAdapter("anticipa", "Anticipa Real Estate"),
  diglo: genericAdapter("diglo", "Diglo (Ibercaja)"),
  hipoges: genericAdapter("hipoges", "Hipoges"),
};

export function getAdapter(servicer: string): ServicerAdapter | undefined {
  return adapters[servicer];
}

export function listAdapters(): ServicerAdapter[] {
  return Object.values(adapters);
}
