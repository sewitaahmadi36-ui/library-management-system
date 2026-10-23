import { useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api';

async function apiRequest(path, options = {}, fallbackMessage = 'The request failed.') {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error('Cannot connect to the backend. Please make sure it is running.');
  }

  let data;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      throw new Error('The backend returned an invalid response. Please try again.');
    }
  } else if (!response.ok) {
    throw new Error(`The server returned an error (${response.status}). Please check the backend.`);
  } else {
    throw new Error('The backend returned an unexpected response. Please try again.');
  }

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

function App() {
  const [books, setBooks] = useState([]);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');

  const [currentPage, setCurrentPage] = useState('dashboard')

  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    borrowedBooks: 0,
    availableBooks: 0
  });
  const [dashboardError, setDashboardError] = useState('');

  async function loadDashboardStats() {
    try {
      const data = await apiRequest('/dashboard', {}, 'Failed to load dashboard statistics');
      setDashboardStats(data);
      setDashboardError('');
    } catch (error) {
      console.error('Error loading dashboard statistics:', error);
      setDashboardError(error.message);
    }
  }

  useEffect(() => {
    apiRequest('/books', {}, 'Could not load books.')
      .then((data) => {
        setBooks(data);
      })
      .catch((error) => {
        console.error('Error loading books:', error);
        alert(error.message || 'Could not load books.');
      });

    apiRequest('/members', {}, 'Could not load members.')
      .then((data) => {
        setMembers(data);
      })
      .catch((error) => {
        console.error('Error loading members:', error);
        alert('Could not load members. Please check that the backend is running.');
      });

    apiRequest('/borrowings', {}, 'Could not load borrowed books.')
      .then((data) => {
        setBorrowedBooks(data);
      })
      .catch((error) => {
        console.error('Error loading borrowings:', error);
        alert('Could not load borrowed books. Please check that the backend is running.');
      });

    Promise.resolve().then(loadDashboardStats);
  }, []);

  async function addBook() {
    if (title.trim() === '' || author.trim() === '') {
      alert('Please enter the book title and author.');
      return;
    }

    const bookData = {
      title: title.trim(),
      author: author.trim()
    };
    const isEditing = editingId !== null;

    try {
      const result = await apiRequest(
        isEditing ? `/books/${editingId}` : '/books',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        },
        'Failed to save book.'
      );

      if (isEditing) {
        setBooks((previousBooks) =>
          previousBooks.map((book) => (book.id === result.id ? result : book))
        );
        setEditingId(null);
      } else {
          setBooks((previousBooks) => [...previousBooks, result]);
      }

      setTitle('');
      setAuthor('');
      await loadDashboardStats();
    } catch (error) {
      console.error('Error saving book:', error);
      alert(error.message || 'Could not save book. Please try again.');
    }
  }

function editBook(book) {
  setTitle(book.title);
  setAuthor(book.author);
  setEditingId(book.id);
}

  async function deleteBook(id) {
    try {
      await apiRequest(`/books/${id}`, { method: 'DELETE' }, 'Failed to delete book.');

      setBooks((previousBooks) =>
        previousBooks.filter((book) => book.id !== id)
      );
      await loadDashboardStats();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert(error.message || 'Could not delete book. Please try again.');
    }
  }
  async function addMember() {
  if (
    memberName.trim() === '' ||
    memberEmail.trim() === '' ||
    memberPhone.trim() === ''
  ) {
    alert('Please fill in all member information.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail.trim())) {
    alert('Please enter a valid email address.');
    return;
  }

  const memberData = {
      name: memberName.trim(),
      email: memberEmail.trim(),
      phone: memberPhone.trim()
  };
  const isEditing = editingMemberId !== null;

  try {
    const result = await apiRequest(
      isEditing ? `/members/${editingMemberId}` : '/members',
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      },
      'Failed to save member.'
    );

    if (isEditing) {
      setMembers((previousMembers) =>
        previousMembers.map((member) =>
          member.id === result.id ? result : member
        )
      );
      setEditingMemberId(null);
    } else {
      setMembers((previousMembers) => [...previousMembers, result]);
    }

    setMemberName('');
    setMemberEmail('');
    setMemberPhone('');
    await loadDashboardStats();
  } catch (error) {
    console.error('Error saving member:', error);
    alert(error.message || 'Could not save member. Please try again.');
  }
}

function editMember(member) {
  setMemberName(member.name);
  setMemberEmail(member.email);
  setMemberPhone(member.phone);
  setEditingMemberId(member.id);
}

async function deleteMember(id) {
  try {
    await apiRequest(`/members/${id}`, { method: 'DELETE' }, 'Failed to delete member.');

    setMembers((previousMembers) =>
      previousMembers.filter((member) => member.id !== id)
    );
    await loadDashboardStats();
  } catch (error) {
    console.error('Error deleting member:', error);
    alert(error.message || 'Could not delete member. Please try again.');
  }
}
const filteredMembers = members.filter((member) => {
  return (
    member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.phone.includes(memberSearch)
  );
});
const filteredBooks = books.filter((book) => {
  return (
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );
});

async function borrowBook() {
  if (selectedBookId === '' || selectedMemberId === '') {
    alert('Please select a book and a member.');
    return;
  }

  try {
    const result = await apiRequest(
      '/borrowings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBookId,
          memberId: selectedMemberId
        })
      },
      'Failed to borrow book.'
    );

    setBorrowedBooks((previousBorrowings) => [...previousBorrowings, result]);
    setSelectedBookId('');
    setSelectedMemberId('');
    await loadDashboardStats();
  } catch (error) {
    console.error('Error borrowing book:', error);
    alert(error.message || 'Could not borrow book. Please try again.');
  }
}

async function returnBook(id) {
  try {
    await apiRequest(`/borrowings/${id}`, { method: 'DELETE' }, 'Failed to return book.');

    setBorrowedBooks((previousBorrowings) =>
      previousBorrowings.filter((borrow) => borrow.id !== id)
    );
    await loadDashboardStats();
  } catch (error) {
    console.error('Error returning book:', error);
    alert(error.message || 'Could not return book. Please try again.');
  }
}

  return (
    <div className="app">

      <header className="header">
        <h1>Library Management System</h1>
      </header>

      <div className="layout">

        <aside className="sidebar">
          <h2>Library</h2>

          <nav>
            <button
              className={currentPage === 'dashboard' ? 'active' : ''}
              aria-current={currentPage === 'dashboard' ? 'page' : undefined}
              onClick={() => setCurrentPage('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={currentPage === 'books' ? 'active' : ''}
              aria-current={currentPage === 'books' ? 'page' : undefined}
              onClick={() => setCurrentPage('books')}
            >
              Books
            </button>
            <button
              className={currentPage === 'members' ? 'active' : ''}
              aria-current={currentPage === 'members' ? 'page' : undefined}
              onClick={() => setCurrentPage('members')}
            >
              Members
            </button>
            <button
              className={currentPage === 'borrow' ? 'active' : ''}
              aria-current={currentPage === 'borrow' ? 'page' : undefined}
              onClick={() => setCurrentPage('borrow')}
            >
              Borrow / Return
            </button>
          </nav>
        </aside>

        <main className="main-content">
          {currentPage === 'dashboard' && (
            <div>
              <h2>Dashboard</h2>

              <p>Welcome to the Library Management System.</p>
              {dashboardError && <p role="alert">{dashboardError}</p>}

              <div className="cards">

                <div className="card">
                 <h3>Total Books</h3>
                 <p>{dashboardStats.totalBooks}</p>
                </div>

                <div className="card">
                 <h3>Total Members</h3>
                 <p>{dashboardStats.totalMembers}</p>
                </div>

                <div className="card">
                 <h3>Borrowed Books</h3>
                 <p>{dashboardStats.borrowedBooks}</p>
                </div>

                <div className="card">
                 <h3>Available Books</h3>
                 <p>{dashboardStats.availableBooks}</p>
                </div>

              </div>
           </div>
         )}
         {currentPage === 'books' && (
         <div>
            <h2>Books</h2>
            <div className="search-box">
             <input
              type="text"
              aria-label="Search books or authors"
              placeholder="Search books or authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="book-form">

              <label className="field">
                <span>Book title</span>
                <input
                  type="text"
                  placeholder="Enter book title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Author</span>
                <input
                  type="text"
                  placeholder="Enter author name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </label>

              <button className="button-primary" onClick={addBook}>
               {editingId !== null ? 'Update Book' : 'Add Book'}
              </button>

            </div>

            <div className="books-list">

              <h3>Book List</h3>

              {books.length === 0 ? (
                <p>No books added yet.</p>
              ) : (
                filteredBooks.map((book) => (
                  <div className="book-item" key={book.id}>

                  <div>
                    <strong>{book.title}</strong>
                    <p>Author: {book.author}</p>
                  </div>

                  <div>
                   <button className="button-secondary" onClick={() => editBook(book)}>
                    Edit
                   </button>

                   <button className="button-danger" onClick={() => deleteBook(book.id)}>
                    Delete
                   </button>
                  </div>

                </div>
              ))
            )}

          </div>
          </div>
        )}
          {currentPage ==='members' && (
            <div>
             <section className="members-section">

             <h2>Members</h2>

              <div className="member-form">

               <label className="field">
                <span>Member name</span>
                <input
                  type="text"
                  placeholder="Enter member name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                />
               </label>

               <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
               </label>

               <label className="field">
                <span>Phone</span>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                />
               </label>

               <button className="button-primary" onClick={addMember}>
                {editingMemberId !== null
                 ? 'Update Member'
                 : 'Add Member'}
               </button>

              </div>

              <div className="member-search">

                <input
                 type="text"
                 aria-label="Search members"
                 placeholder="Search members..."
                 value={memberSearch}
                 onChange={(e) => setMemberSearch(e.target.value)}
                />

                </div>

               <div className="members-list">

               <h3>Member List</h3>

               {filteredMembers.length === 0 ? (
                 <p>No members found.</p>
                 ) : (
                 filteredMembers.map((member) => (
            
                 <div className="member-item" key={member.id}>

                   <div>
                    <strong>{member.name}</strong>
                    <p>Email: {member.email}</p>
                    <p>Phone: {member.phone}</p>
                   </div>
                   <div>
                    <button className="button-secondary" onClick={() => editMember(member)}>
                      Edit
                     </button>
                     <button className="button-danger" onClick={() => deleteMember(member.id)}>
                      Delete
                     </button>
                   </div>
                  </div>
                 ))
                )}
            
                </div>
              </section>
            </div>
            )}
            {currentPage ==='borrow'  && (
              <div>
                <h2>Borrow / Return</h2>
                <p>Manage borrowed and returned books here.</p>
          
                 <div className="borrow-form">
                   <h3>Borrow a Book</h3>

                   <label className="field">
                     <span>Book</span>
                     <select
                       value={selectedBookId}
                       onChange={(e) => setSelectedBookId(e.target.value)}
                     >
                       <option value="">Select a book</option>

                       {books
                         .filter((book) =>
                           !borrowedBooks.some(
                             (borrow) => borrow.bookId.toString() === book.id.toString()
                           )
                         )
                         .map((book) => (
                           <option key={book.id} value={book.id}>
                             {book.title} - {book.author}
                           </option>
                         ))}
                     </select>
                   </label>

                   <label className="field">
                     <span>Member</span>
                     <select
                       value={selectedMemberId}
                       onChange={(e) => setSelectedMemberId(e.target.value)}
                     >
                       <option value="">Select a member</option>

                       {members.map((member) => (
                         <option key={member.id} value={member.id}>
                           {member.name}
                         </option>
                       ))}
                     </select>
                   </label>

                   <button className="button-primary" onClick={borrowBook}>
                     Borrow Book
                   </button>
                 </div>
               <h3 className="section-title">Borrowed Books</h3>

                {borrowedBooks.length === 0 ? (
                  <p>No books have been borrowed yet.</p>
                ) : (
                 borrowedBooks.map((borrow) => {
                  const book = books.find(
                   (book) => book.id.toString() === borrow.bookId.toString()
                  );

                  const member = members.find(
                   (member) => member.id.toString() === borrow.memberId.toString()
                  );

                  return (
                    <div className="borrow-item" key={borrow.id}>
                      <p>
                        <strong>Book:</strong> {book ? book.title : 'Unknown book'}
                      </p>

                      <p>
                       <strong>Member:</strong> {member ? member.name : 'Unknown member'}
                      </p>

                      <p>
                        <strong>Borrowed Date:</strong>{' '}
                        {new Date(borrow.borrowDate).toLocaleDateString()}
                      </p>
                      <button className="button-secondary button-return" onClick={() => returnBook(borrow.id)}>
                      Return Book
                      </button>
                    </div>
                  );
                 })
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    );
  }

  export default App;