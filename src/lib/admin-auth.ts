import { requireAdmin } from "@/lib/auth";

export function verifyAdmin(request: Request): boolean {
  try {
    requireAdmin(request);
    return true;
  } catch {
    return false;
  }
}

export function getAdminPath(): string {
  return process.env.ADMIN_PATH || "";
}
