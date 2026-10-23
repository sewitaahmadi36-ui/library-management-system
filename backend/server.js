const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Library Management System Backend is running!');
});

app.get('/api/books', (req, res) => {
  db.all('SELECT * FROM books', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Failed to get books' });
      return;
    }

    res.json(rows);
  });
});

app.get('/api/dashboard', (req, res) => {
  const getCount = (query) =>
    new Promise((resolve, reject) => {
      db.get(query, (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row);
      });
    });

  Promise.all([
    getCount('SELECT COUNT(*) AS totalBooks FROM books'),
    getCount('SELECT COUNT(*) AS totalMembers FROM members'),
    getCount('SELECT COUNT(*) AS borrowedBooks FROM borrowings')
  ])
    .then(([booksRow, membersRow, borrowingsRow]) => {
      const totalBooks = Number(booksRow.totalBooks || 0);
      const totalMembers = Number(membersRow.totalMembers || 0);
      const borrowedBooks = Number(borrowingsRow.borrowedBooks || 0);

      res.json({
        totalBooks,
        totalMembers,
        borrowedBooks,
        availableBooks: Math.max(totalBooks - borrowedBooks, 0)
      });
    })
    .catch((err) => {
      console.error('Error loading dashboard statistics:', err.message);
      res.status(500).json({ error: 'Failed to load dashboard statistics' });
    });
});

app.post('/api/books', (req, res) => {
  const { title, author } = req.body;

  if (
    typeof title !== 'string' ||
    typeof author !== 'string' ||
    !title.trim() ||
    !author.trim()
  ) {
    res.status(400).json({ error: 'Title and author are required' });
    return;
  }

  const sql = 'INSERT INTO books (title, author) VALUES (?, ?)';
  const book = { title: title.trim(), author: author.trim() };

  db.run(sql, [book.title, book.author], function (err) {
    if (err) {
      console.error('Error adding book:', err.message);
      res.status(500).json({ error: 'Failed to add book' });
      return;
    }

    res.status(201).json({ id: this.lastID, ...book });
  });
});

app.put('/api/books/:id', (req, res) => {
  const { title, author } = req.body || {};

  if (
    typeof title !== 'string' ||
    typeof author !== 'string' ||
    !title.trim() ||
    !author.trim()
  ) {
    res.status(400).json({ error: 'Title and author are required' });
    return;
  }

  const book = { title: title.trim(), author: author.trim() };

  db.run(
    'UPDATE books SET title = ?, author = ? WHERE id = ?',
    [book.title, book.author, req.params.id],
    function (err) {
      if (err) {
        console.error('Error updating book:', err.message);
        res.status(500).json({ error: 'Failed to update book' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }

      res.json({ id: Number(req.params.id), ...book });
    }
  );
});

app.delete('/api/books/:id', (req, res) => {
  db.run(
    'DELETE FROM books WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('FOREIGN KEY')) {
          res.status(409).json({
            error: 'Cannot delete a book while it is borrowed. Return it first.'
          });
          return;
        }

        console.error('Error deleting book:', err.message);
        res.status(500).json({ error: 'Failed to delete book' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }

      res.json({ message: 'Book deleted successfully' });
    }
  );
});

app.get('/api/members', (req, res) => {
  db.all('SELECT * FROM members ORDER BY id', [], (err, rows) => {
    if (err) {
      console.error('Error getting members:', err.message);
      res.status(500).json({ error: 'Failed to get members' });
      return;
    }

    res.json(rows);
  });
});

app.post('/api/members', (req, res) => {
  const { name, email, phone } = req.body || {};

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof phone !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !phone.trim()
  ) {
    res.status(400).json({ error: 'Name, email, and phone are required' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please enter a valid email address' });
    return;
  }

  const member = {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim()
  };

  db.run(
    'INSERT INTO members (name, email, phone) VALUES (?, ?, ?)',
    [member.name, member.email, member.phone],
    function (err) {
      if (err) {
        console.error('Error adding member:', err.message);
        res.status(500).json({ error: 'Failed to add member' });
        return;
      }

      res.status(201).json({ id: this.lastID, ...member });
    }
  );
});

app.put('/api/members/:id', (req, res) => {
  const { name, email, phone } = req.body || {};

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof phone !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !phone.trim()
  ) {
    res.status(400).json({ error: 'Name, email, and phone are required' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please enter a valid email address' });
    return;
  }

  const member = {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim()
  };

  db.run(
    'UPDATE members SET name = ?, email = ?, phone = ? WHERE id = ?',
    [member.name, member.email, member.phone, req.params.id],
    function (err) {
      if (err) {
        console.error('Error updating member:', err.message);
        res.status(500).json({ error: 'Failed to update member' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }

      res.json({ id: Number(req.params.id), ...member });
    }
  );
});

app.delete('/api/members/:id', (req, res) => {
  db.run(
    'DELETE FROM members WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('FOREIGN KEY')) {
          res.status(409).json({
            error: 'Cannot delete a member with a borrowed book. Return it first.'
          });
          return;
        }

        console.error('Error deleting member:', err.message);
        res.status(500).json({ error: 'Failed to delete member' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }

      res.json({ message: 'Member deleted successfully' });
    }
  );
});

app.get('/api/borrowings', (req, res) => {
  db.all(
    `SELECT id, book_id AS bookId, member_id AS memberId, borrowed_at AS borrowDate
     FROM borrowings
     ORDER BY id`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error getting borrowings:', err.message);
        res.status(500).json({ error: 'Failed to get borrowings' });
        return;
      }

      res.json(rows);
    }
  );
});

app.post('/api/borrowings', (req, res) => {
  const { bookId, memberId } = req.body || {};
  const parsedBookId = Number(bookId);
  const parsedMemberId = Number(memberId);

  if (
    !Number.isSafeInteger(parsedBookId) ||
    parsedBookId <= 0 ||
    !Number.isSafeInteger(parsedMemberId) ||
    parsedMemberId <= 0
  ) {
    res.status(400).json({ error: 'A valid book and member are required' });
    return;
  }

  db.get(
    `SELECT books.id AS bookId, members.id AS memberId
     FROM books CROSS JOIN members
     WHERE books.id = ? AND members.id = ?`,
    [parsedBookId, parsedMemberId],
    (lookupError, row) => {
      if (lookupError) {
        console.error('Error checking borrowing details:', lookupError.message);
        res.status(500).json({ error: 'Failed to check book and member' });
        return;
      }

      if (!row) {
        res.status(404).json({ error: 'Book or member not found' });
        return;
      }

      const borrowedAt = new Date().toISOString();
      db.run(
        'INSERT INTO borrowings (book_id, member_id, borrowed_at) VALUES (?, ?, ?)',
        [parsedBookId, parsedMemberId, borrowedAt],
        function (err) {
          if (err) {
            if (
              err.code === 'SQLITE_CONSTRAINT' &&
              err.message.includes('borrowings.book_id')
            ) {
              res.status(409).json({ error: 'This book is already borrowed' });
              return;
            }

            if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('FOREIGN KEY')) {
              res.status(404).json({ error: 'Book or member not found' });
              return;
            }

            console.error('Error borrowing book:', err.message);
            res.status(500).json({ error: 'Failed to borrow book' });
            return;
          }

          res.status(201).json({
            id: this.lastID,
            bookId: parsedBookId,
            memberId: parsedMemberId,
            borrowDate: borrowedAt
          });
        }
      );
    }
  );
});

app.delete('/api/borrowings/:id', (req, res) => {
  db.run(
    'DELETE FROM borrowings WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) {
        console.error('Error returning book:', err.message);
        res.status(500).json({ error: 'Failed to return book' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Borrowing not found' });
        return;
      }

      res.json({ message: 'Book returned successfully' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});