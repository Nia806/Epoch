/**
 * Local store for custom archetype names.
 * Custom archetypes are saved by name only (no logo/icon).
 */

const STORAGE_KEY = "recipe-health-custom-archetypes";

function loadCustomArchetypes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function saveCustomArchetypes(names: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch (e) {
    console.error("Failed to save custom archetypes to localStorage", e);
  }
}

const PRESET_IDS = new Set(["fitness", "dietary"]);

export function getCustomArchetypes(): string[] {
  return loadCustomArchetypes();
}

export function addCustomArchetype(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const list = loadCustomArchetypes();
  const lower = trimmed.toLowerCase();
  if (list.some((n) => n.toLowerCase() === lower)) return;
  list.push(trimmed);
  saveCustomArchetypes(list);
}

export function removeCustomArchetype(name: string): void {
  const list = loadCustomArchetypes().filter(
    (n) => n.toLowerCase() !== name.trim().toLowerCase()
  );
  saveCustomArchetypes(list);
}

export function isPresetArchetype(idOrName: string): boolean {
  return PRESET_IDS.has(idOrName);
}
