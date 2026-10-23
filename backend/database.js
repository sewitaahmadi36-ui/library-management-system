const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./library.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

db.run('PRAGMA foreign_keys = ON');

db.run(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('Error creating books table:', err.message);
  } else {
    console.log('Books table is ready.');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('Error creating members table:', err.message);
  } else {
    console.log('Members table is ready.');

    db.run(`
      CREATE TABLE IF NOT EXISTS borrowings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL UNIQUE,
        member_id INTEGER NOT NULL,
        borrowed_at TEXT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
      )
    `, (createError) => {
      if (createError) {
        console.error('Error creating borrowings table:', createError.message);
      } else {
        console.log('Borrowings table is ready.');
      }
    });
  }
});

module.exports = db;
