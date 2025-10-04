import Database from 'better-sqlite3';
import path from 'path';
import { Person, User } from './models';

const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'data.db');
const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY,
    chat_id INTEGER,
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

export const addPerson = (chatId: number, personName: string) => {
  console.log('Add person', chatId, personName);
  const res = db.prepare('INSERT INTO persons (chat_id, name) VALUES (?, ?)').run(chatId, personName);
  console.log('Add person Res', res);
  return res.lastInsertRowid;
};

export const listPersons = (chatId: number): Person[] => {
  console.log('List persons', chatId);
  return db.prepare('SELECT * FROM persons WHERE chat_id = ?').all(chatId) as Person[];
};

export const addMeasurement = (personId: number, systolic: number, diastolic: number, pulse: number, mood: number, comment: string) => {
  return db.prepare('INSERT INTO measurements (person_id, created_at, systolic, diastolic, pulse, mood, comment) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(personId, new Date().toISOString(), systolic, diastolic, pulse, mood, comment || '');
};

export const getMeasurements = (personId: number, sinceISOString: string) => {
  return db.prepare('SELECT * FROM measurements WHERE person_id = ? AND created_at >= ? ORDER BY created_at DESC').all(personId, sinceISOString);
};