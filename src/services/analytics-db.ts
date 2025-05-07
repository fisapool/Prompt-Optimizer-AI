import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'analytics.sqlite');
const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS feedback_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  ip TEXT,
  feedback_type TEXT,
  payload TEXT
)`);

export function storeFeedbackAnalytics({ ip, feedbackType, payload }: { ip: string; feedbackType: string; payload: any }) {
  const stmt = db.prepare('INSERT INTO feedback_analytics (timestamp, ip, feedback_type, payload) VALUES (?, ?, ?, ?)');
  stmt.run(Date.now(), ip, feedbackType, JSON.stringify(payload));
}

export function getAllFeedbackAnalytics() {
  return db.prepare('SELECT * FROM feedback_analytics ORDER BY timestamp DESC').all();
}