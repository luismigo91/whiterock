import { handlers } from "@/lib/auth";
export const GET = handlers.GET as unknown as () => Promise<Response>;
export const POST = handlers.POST as unknown as () => Promise<Response>;
