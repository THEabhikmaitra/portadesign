export function getAuthorAvatarUrl(name?: string | null): string {
  const n = String(name || "").toLowerCase();
  if (n.includes("priya") || n.includes("nair")) {
    return "/authors/priya-nair.svg";
  }
  return "/authors/arjun-mehta.svg";
}
