import { headers } from "next/headers";

export async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown";
  return ip.trim().slice(0, 45);
}