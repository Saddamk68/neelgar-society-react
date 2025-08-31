export type RequiredRules<TValues> = {
  always?: (keyof TValues | string)[];
  conditional?: Array<(values: TValues) => (keyof TValues | string)[]>;
};

// Build a reusable checker: (name, values) => boolean
export function makeIsRequired<TValues>(rules: RequiredRules<TValues>) {
  return (name: string, values: TValues) => {
    const set = new Set<string>();
    (rules.always ?? []).forEach(k => set.add(String(k)));
    (rules.conditional ?? []).forEach(fn => fn(values).forEach(k => set.add(String(k))));
    // allow dot-paths (e.g., children.0.name) to match by exact string
    if (set.has(name)) return true;
    // also treat “children.*.name” style keys as required for any index
    for (const k of set) {
      if (k.endsWith(".*") && name.startsWith(k.slice(0, -1))) return true;
    }
    return false;
  };
}
