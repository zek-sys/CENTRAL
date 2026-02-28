/**
 * Fila de sincronização do Portal do Agente (Delta-Queue).
 * Quando updateDoc falha ou está offline, ações são guardadas no localStorage
 * e enviadas ao voltar o sinal.
 */

const STORAGE_KEY = "portal-agente-sync-queue";

export function getPortalSyncQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToPortalSyncQueue(item) {
  const queue = getPortalSyncQueue();
  const entry = {
    id: `portal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...item,
    createdAt: Date.now(),
  };
  queue.push(entry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("Portal sync queue: localStorage full", e);
  }
  return entry.id;
}

export function removeFromPortalSyncQueue(id) {
  const queue = getPortalSyncQueue().filter((e) => e.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

export function clearPortalSyncQueue() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getPortalSyncQueuePendingCount() {
  return getPortalSyncQueue().length;
}
