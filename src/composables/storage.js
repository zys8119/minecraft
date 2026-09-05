const STORAGE_KEY = 'minecraft_world_data'

// ---------- 存储适配器：按优先级降级 ----------
export class StorageAdapter {
  constructor() {
    this.storage = null
    this.type = null
    this._initStorage()
  }

  _initStorage() {
    // 1. 尝试 WebSQL
    if (window.openDatabase) {
      try {
        this.db = window.openDatabase('minecraft_db', '1.0', 'Minecraft World Data', 5 * 1024 * 1024)
        if (this.db) {
          this.type = 'websql'
          this._initWebSQL()
          return
        }
      } catch (e) {
        console.warn('WebSQL initialization failed:', e)
      }
    }

    // 2. 尝试 IndexedDB
    if (window.indexedDB) {
      try {
        this.type = 'indexeddb'
        this.dbName = 'minecraft_db'
        this.storeName = 'world_data'
        this._initIndexedDB()
        return
      } catch (e) {
        console.warn('IndexedDB initialization failed:', e)
      }
    }

    // 3. 尝试 localStorage
    if (window.localStorage) {
      try {
        this.type = 'localstorage'
        this.storage = window.localStorage
        return
      } catch (e) {
        console.warn('localStorage initialization failed:', e)
      }
    }

    // 4. 降级到 sessionStorage
    if (window.sessionStorage) {
      try {
        this.type = 'sessionstorage'
        this.storage = window.sessionStorage
        return
      } catch (e) {
        console.warn('sessionStorage initialization failed:', e)
      }
    }

    this.type = 'memory'
    this.memoryStorage = new Map()
    console.warn('No persistent storage available, using memory storage')
  }

  _initWebSQL() {
    this.db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS world_data (id INTEGER PRIMARY KEY, key TEXT UNIQUE, value TEXT)',
        [],
        () => {},
        (tx, err) => {
          console.warn('WebSQL create table error:', err)
          return false
        }
      )
    })
  }

  _initIndexedDB() {
    if (this._indexedDBReady) return
    const request = window.indexedDB.open(this.dbName, 1)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: 'key' })
      }
    }
    request.onsuccess = (event) => {
      this._indexedDBReady = true
      this._indexedDB = event.target.result
    }
    request.onerror = (event) => {
      console.warn('IndexedDB open error:', event.target.error)
    }
  }

  _getIndexedDB() {
    return new Promise((resolve, reject) => {
      if (this._indexedDB) {
        resolve(this._indexedDB)
        return
      }
      const request = window.indexedDB.open(this.dbName, 1)
      request.onsuccess = (event) => {
        this._indexedDB = event.target.result
        resolve(this._indexedDB)
      }
      request.onerror = (event) => reject(event.target.error)
    })
  }

  async save(key, data) {
    const value = JSON.stringify(data)

    switch (this.type) {
      case 'websql':
        return new Promise((resolve, reject) => {
          this.db.transaction((tx) => {
            tx.executeSql(
              'INSERT OR REPLACE INTO world_data (key, value) VALUES (?, ?)',
              [key, value],
              () => resolve(),
              (tx, err) => {
                reject(err)
                return false
              }
            )
          })
        })

      case 'indexeddb':
        try {
          const db = await this._getIndexedDB()
          return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readwrite')
            const store = tx.objectStore(this.storeName)
            const request = store.put({ key, value })
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        } catch (e) {
          throw e
        }

      case 'localstorage':
      case 'sessionstorage':
        try {
          this.storage.setItem(key, value)
          return Promise.resolve()
        } catch (e) {
          return Promise.reject(e)
        }

      case 'memory':
        this.memoryStorage.set(key, value)
        return Promise.resolve()

      default:
        return Promise.reject(new Error('Unsupported storage type'))
    }
  }

  async load(key) {
    switch (this.type) {
      case 'websql':
        return new Promise((resolve, reject) => {
          this.db.transaction((tx) => {
            tx.executeSql(
              'SELECT value FROM world_data WHERE key = ?',
              [key],
              (tx, results) => {
                if (results.rows.length > 0) {
                  try {
                    resolve(JSON.parse(results.rows.item(0).value))
                  } catch (e) {
                    resolve(null)
                  }
                } else {
                  resolve(null)
                }
              },
              (tx, err) => {
                reject(err)
                return false
              }
            )
          })
        })

      case 'indexeddb':
        try {
          const db = await this._getIndexedDB()
          return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readonly')
            const store = tx.objectStore(this.storeName)
            const request = store.get(key)
            request.onsuccess = () => {
              if (request.result) {
                try {
                  resolve(JSON.parse(request.result.value))
                } catch (e) {
                  resolve(null)
                }
              } else {
                resolve(null)
              }
            }
            request.onerror = () => reject(request.error)
          })
        } catch (e) {
          return Promise.resolve(null)
        }

      case 'localstorage':
      case 'sessionstorage':
        try {
          const data = this.storage.getItem(key)
          return data ? JSON.parse(data) : null
        } catch (e) {
          return null
        }

      case 'memory':
        const data = this.memoryStorage.get(key)
        return data ? JSON.parse(data) : null

      default:
        return null
    }
  }

  async clear(key) {
    switch (this.type) {
      case 'websql':
        return new Promise((resolve, reject) => {
          this.db.transaction((tx) => {
            tx.executeSql(
              'DELETE FROM world_data WHERE key = ?',
              [key],
              () => resolve(),
              (tx, err) => {
                reject(err)
                return false
              }
            )
          })
        })

      case 'indexeddb':
        try {
          const db = await this._getIndexedDB()
          return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readwrite')
            const store = tx.objectStore(this.storeName)
            const request = store.delete(key)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        } catch (e) {
          return Promise.resolve()
        }

      case 'localstorage':
      case 'sessionstorage':
        this.storage.removeItem(key)
        return Promise.resolve()

      case 'memory':
        this.memoryStorage.delete(key)
        return Promise.resolve()

      default:
        return Promise.resolve()
    }
  }

  getType() {
    return this.type
  }
}

export const STORAGE_KEY = 'minecraft_world_data'
