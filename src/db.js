const Database = require('better-sqlite3');
const path = require('path');
const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'data.db');
const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    chat_id TEXT UNIQUE,
    name TEXT
  );
  CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT
  );
  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY,
    person_id INTEGER,
    created_at TEXT,
    systolic INTEGER,
    diastolic INTEGER,
    pulse INTEGER,
    mood INTEGER,
    comment TEXT
  );
`);

module.exports = {
  getUserByChatId(chatId) {
    return db.prepare('SELECT * FROM users WHERE chat_id = ?').get(chatId);
  },
  createUser(chatId, name) {
    return db.prepare('INSERT OR IGNORE INTO users (chat_id, name) VALUES (?, ?)').run(chatId, name);
  },
  addPerson(userChatId, personName) {
    const user = this.getUserByChatId(userChatId);
    if (!user) return null;
    const res = db.prepare('INSERT INTO persons (user_id, name) VALUES (?, ?)').run(user.id, personName);
    return res.lastInsertRowid;
  },
  listPersons(userChatId) {
    const user = this.getUserByChatId(userChatId);
    if (!user) return [];
    return db.prepare('SELECT * FROM persons WHERE user_id = ?').all(user.id);
  },
  addMeasurement(personId, systolic, diastolic, pulse, mood, comment) {
    return db.prepare(
      'INSERT INTO measurements (person_id, created_at, systolic, diastolic, pulse, mood, comment) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(personId, new Date().toISOString(), systolic, diastolic, pulse, mood, comment || '');
  },
  getMeasurements(personId, sinceISOString) {
    return db.prepare('SELECT * FROM measurements WHERE person_id = ? AND created_at >= ? ORDER BY created_at DESC')
      .all(personId, sinceISOString);
  },
};