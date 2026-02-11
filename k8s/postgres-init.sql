CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  budget NUMERIC(12,2) NOT NULL DEFAULT 5000,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 1,
  cover_url TEXT,
  added_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  rented_at TIMESTAMP NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cover_url TEXT,
  source JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorite_books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  custom_book_id INTEGER REFERENCES custom_books(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (
    (book_id IS NOT NULL AND custom_book_id IS NULL)
    OR (book_id IS NULL AND custom_book_id IS NOT NULL)
  )
);

INSERT INTO books (title, author, category, price, stock, cover_url) VALUES
  ('The Left Hand of Darkness', 'Ursula K. Le Guin', 'Sci-Fi', 220, 7, 'https://covers.openlibrary.org/b/isbn/9780441478125-M.jpg'),
  ('Beloved', 'Toni Morrison', 'Literary', 180, 4, 'https://covers.openlibrary.org/b/isbn/9781400033416-M.jpg'),
  ('The Name of the Rose', 'Umberto Eco', 'Mystery', 210, 6, 'https://covers.openlibrary.org/b/isbn/9780156001311-M.jpg'),
  ('The Dispossessed', 'Ursula K. Le Guin', 'Sci-Fi', 200, 5, 'https://covers.openlibrary.org/b/isbn/9780060512750-M.jpg'),
  ('Invisible Cities', 'Italo Calvino', 'Literary', 160, 8, 'https://covers.openlibrary.org/b/isbn/9780156453806-M.jpg'),
  ('Kindred', 'Octavia E. Butler', 'Sci-Fi', 190, 3, 'https://covers.openlibrary.org/b/isbn/9780807083697-M.jpg'),
  ('The Master and Margarita', 'Mikhail Bulgakov', 'Classic', 230, 9, 'https://covers.openlibrary.org/b/isbn/9780679760801-M.jpg'),
  ('The Sun Also Rises', 'Ernest Hemingway', 'Classic', 150, 2, 'https://covers.openlibrary.org/b/isbn/9780743297332-M.jpg');
