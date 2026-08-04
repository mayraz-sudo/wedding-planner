/*
 * Repository — the only persistence API feature modules call.
 * Wraps a storage adapter with per-entity CRUD, UUID ids, and
 * createdAt/updatedAt timestamps (useful for future sync/conflict
 * resolution once this moves to a real backend).
 */
function createEntityRepository(adapter, collection){
  return {
    async list(){
      return adapter.getAll(collection);
    },
    async add(data){
      const records = await adapter.getAll(collection);
      const record = { id: uid(), createdAt: nowIso(), updatedAt: nowIso(), ...data };
      records.push(record);
      await adapter.saveAll(collection, records);
      return record;
    },
    async update(id, patch){
      const records = await adapter.getAll(collection);
      const idx = records.findIndex(r => r.id === id);
      if(idx === -1) return null;
      records[idx] = { ...records[idx], ...patch, updatedAt: nowIso() };
      await adapter.saveAll(collection, records);
      return records[idx];
    },
    async remove(id){
      const records = await adapter.getAll(collection);
      await adapter.saveAll(collection, records.filter(r => r.id !== id));
    },
    async replaceAll(records){
      await adapter.saveAll(collection, records);
    }
  };
}

const storageAdapter = new LocalStorageAdapter('wedding-mairaz');

const Repository = {
  guests: createEntityRepository(storageAdapter, 'guests'),
  vendors: createEntityRepository(storageAdapter, 'vendors'),
  tasks: createEntityRepository(storageAdapter, 'tasks'),
  attractions: createEntityRepository(storageAdapter, 'attractions'),
  gettingReady: createEntityRepository(storageAdapter, 'gettingReady')
};
