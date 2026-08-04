/*
 * Storage adapter contract — the seam for a future backend swap.
 * Any adapter must implement: getAll(collection), saveAll(collection, records),
 * has(collection). Feature code never touches localStorage directly, only
 * Repository (see repository.js), so replacing this with a SupabaseAdapter /
 * FirebaseAdapter later means writing one new class with the same three
 * methods — nothing else in the app changes.
 */
class LocalStorageAdapter{
  constructor(prefix){
    this.prefix = prefix;
  }
  _key(collection){
    return `${this.prefix}-${collection}`;
  }
  async has(collection){
    return localStorage.getItem(this._key(collection)) !== null;
  }
  async getAll(collection){
    try{
      const raw = localStorage.getItem(this._key(collection));
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.error(`load ${collection} failed`, e);
      return [];
    }
  }
  async saveAll(collection, records){
    localStorage.setItem(this._key(collection), JSON.stringify(records));
  }
  // For scalar app-level settings that aren't a collection of records (e.g. budget target).
  async getSetting(key, fallback){
    try{
      const raw = localStorage.getItem(`${this.prefix}-setting-${key}`);
      return raw !== null ? JSON.parse(raw) : fallback;
    }catch(e){
      console.error(`load setting ${key} failed`, e);
      return fallback;
    }
  }
  async setSetting(key, value){
    localStorage.setItem(`${this.prefix}-setting-${key}`, JSON.stringify(value));
  }
}
