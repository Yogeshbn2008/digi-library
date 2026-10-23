CREATE DATABASE IF NOT EXISTS digilibrary;
USE digilibrary;

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  isbn VARCHAR(20),
  status ENUM('available','borrowed') NOT NULL DEFAULT 'available',
  due_date DATE NULL,
  UNIQUE KEY uniq_title_author (title, author)
);

CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  borrower_name VARCHAR(100) NOT NULL,
  registration_no VARCHAR(30) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,
  issued_by INT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS digilibrary.admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  active_session_id VARCHAR(64) NULL
);