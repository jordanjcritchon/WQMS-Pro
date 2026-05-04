// IndexedDB store for VT report photos (base64 strings can be large)
const DB_NAME  = "wqms_photos";
const DB_VER   = 1;
const STORE    = "photos"; // key: reportId, value: {url, description}[]

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

export async function savePhotos(reportId: string, photos: { url: string; description: string }[]) {
  const db = await openDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(photos, reportId);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}

export async function loadPhotos(reportId: string): Promise<{ url: string; description: string }[]> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(reportId);
    req.onsuccess = () => res(req.result ?? []);
    req.onerror   = () => rej(req.error);
  });
}

export async function deletePhotos(reportId: string) {
  const db = await openDB();
  return new Promise<void>((res, rej) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(reportId);
    req.onsuccess = () => res();
    req.onerror   = () => rej(req.error);
  });
}
