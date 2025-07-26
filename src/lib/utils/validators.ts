export function validateGameName(name: string): boolean {
  return Boolean(name && name.trim().length >= 2);
}

export function sanitizeSearchTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\-]/g, "") // Remove caracteres especiais exceto hífens
    .replace(/\s+/g, " "); // Remove espaços extras
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function normalizeGameTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\[\]()]/g, "") // Remove colchetes e parênteses
    .toLowerCase();
}
