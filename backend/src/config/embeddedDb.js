/**
 * Embedded In-Memory Mongoose Database Engine for RecoverAI
 * Provides instant 100% CRUD operations for Customer, Payment, RecoveryCase, RecoveryAction, and AuditLog
 * when standalone MongoDB services are not running locally.
 */

class EmbeddedDocument {
  constructor(collectionName, data) {
    this._collection = collectionName;
    this._id = data._id || `emb_${Math.random().toString(36).substring(2, 11)}`;
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }

  async save() {
    this.updatedAt = new Date();
    EmbeddedDB.upsert(this._collection, this);
    return this;
  }
}

class EmbeddedDB {
  static collections = {
    customers: [],
    payments: [],
    cases: [],
    actions: [],
    audits: [],
    webhooks: []
  };

  static clear(collectionName) {
    if (this.collections[collectionName]) {
      this.collections[collectionName] = [];
    }
  }

  static upsert(collectionName, item) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = [];
    }
    const list = this.collections[collectionName];
    const idx = list.findIndex(d => d._id === item._id || (item.email && d.email === item.email) || (item.caseId && d.caseId === item.caseId));
    
    if (idx >= 0) {
      list[idx] = Object.assign(list[idx], item);
      return list[idx];
    } else {
      const doc = new EmbeddedDocument(collectionName, item);
      list.push(doc);
      return doc;
    }
  }

  static findOne(collectionName, query) {
    const list = this.collections[collectionName] || [];
    const found = list.find(doc => {
      for (const key of Object.keys(query)) {
        if (query[key] instanceof RegExp) {
          if (!query[key].test(doc[key])) return false;
        } else if (doc[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return found ? new EmbeddedDocument(collectionName, found) : null;
  }

  static find(collectionName, query = {}) {
    const list = this.collections[collectionName] || [];
    const results = list.filter(doc => {
      for (const key of Object.keys(query)) {
        if (query[key] && typeof query[key] === 'object' && query[key].$in) {
          if (!query[key].$in.includes(doc[key])) return false;
        } else if (doc[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return results.map(d => new EmbeddedDocument(collectionName, d));
  }

  static deleteMany(collectionName, query = {}) {
    if (!this.collections[collectionName]) return { deletedCount: 0 };
    const initialLen = this.collections[collectionName].length;
    if (Object.keys(query).length === 0) {
      this.collections[collectionName] = [];
      return { deletedCount: initialLen };
    }
    
    this.collections[collectionName] = this.collections[collectionName].filter(doc => {
      if (query.email && doc.email === query.email) return false;
      if (query.customerId && doc.customerId === query.customerId) return false;
      if (query.caseId && query.caseId.$in && query.caseId.$in.includes(doc.caseId)) return false;
      return true;
    });
    return { deletedCount: initialLen - this.collections[collectionName].length };
  }
}

module.exports = { EmbeddedDB, EmbeddedDocument };
