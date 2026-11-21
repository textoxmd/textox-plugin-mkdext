// Lightweight selection-change broadcast. Lives in its own module so the
// syntax declaration (block.ts) can notify listeners without statically
// importing the heavy NodeView implementation.

const listeners = new Set<() => void>();

export function onSelectionChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function notifySelectionChange(): void {
  for (const cb of listeners) cb();
}
