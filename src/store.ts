import localforage from 'localforage';

export interface Store {
  id: string;
  name: string;
  location: string;
  photos: string[]; // Base64 strings
  visitedAt?: string; // ISO string
}

localforage.config({
  name: 'RetailAuditApp',
  storeName: 'stores_data'
});

export const getStores = async (): Promise<Store[]> => {
  try {
    const data = await localforage.getItem<Store[]>("retail_stores");
    return data || [];
  } catch (err) {
    console.error("Error loading stores from IndexedDB", err);
    return [];
  }
};

export const saveStores = async (stores: Store[]): Promise<void> => {
  try {
    await localforage.setItem("retail_stores", stores);
  } catch (err) {
    console.error("Error saving stores to IndexedDB", err);
    throw err;
  }
};
