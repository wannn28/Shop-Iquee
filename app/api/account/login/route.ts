import { apiJson, apiOptions } from "@/lib/http";

export function OPTIONS() {
  return apiOptions();
}

export async function POST(request: Request) {
  return accountStub(request);
}

async function accountStub(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiJson({ error: "Enter a valid email." }, 400);
  }
  if (password.length < 8) {
    return apiJson({ error: "Use at least 8 characters." }, 400);
  }
  return apiJson({ ok: true, mode: "stub", user: { email } });
}
