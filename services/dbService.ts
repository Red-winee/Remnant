import { RelationshipProfile, MediaItem } from '../types';

const DB_NAME = 'RemnantDB';
const DB_VERSION = 1;
const STORE_PROFILES = 'profiles';
const STORE_MEDIA = 'media';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROFILES)) {
        db.createObjectStore(STORE_PROFILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        const mediaStore = db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
        mediaStore.createIndex('relationshipId', 'relationshipId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Profiles
export async function getAllProfiles(): Promise<RelationshipProfile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PROFILES, 'readonly');
    const store = transaction.objectStore(STORE_PROFILES);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getProfile(id: string): Promise<RelationshipProfile | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROFILES, 'readonly');
      const store = transaction.objectStore(STORE_PROFILES);
      const request = store.get(id);
  
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

export async function saveProfile(profile: RelationshipProfile): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PROFILES, 'readwrite');
    const store = transaction.objectStore(STORE_PROFILES);
    const request = store.put(profile);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProfile(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROFILES, STORE_MEDIA], 'readwrite');
      const profileStore = transaction.objectStore(STORE_PROFILES);
      const mediaStore = transaction.objectStore(STORE_MEDIA);
      
      // Delete profile
      profileStore.delete(id);

      // Delete associated media
      const mediaIndex = mediaStore.index('relationshipId');
      const mediaRequest = mediaIndex.getAllKeys(id);
      
      mediaRequest.onsuccess = () => {
          const keys = mediaRequest.result;
          keys.forEach(key => mediaStore.delete(key));
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
}

// Media
export async function saveMedia(mediaItem: MediaItem): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_MEDIA, 'readwrite');
        const store = transaction.objectStore(STORE_MEDIA);
        const request = store.put(mediaItem);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getMediaForRelationship(relationshipId: string): Promise<MediaItem[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_MEDIA, 'readonly');
        const store = transaction.objectStore(STORE_MEDIA);
        const index = store.index('relationshipId');
        const request = index.getAll(relationshipId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function deleteMedia(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_MEDIA, 'readwrite');
        const store = transaction.objectStore(STORE_MEDIA);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
