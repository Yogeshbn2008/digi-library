CREATE DATABASE IF NOT EXISTS digilibrary;
USE digilibrary;

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_code VARCHAR(30) NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NULL,
  genre VARCHAR(100) NOT NULL,
  isbn VARCHAR(20),
  price DECIMAL(8,2) NULL,
  donated TINYINT(1) NOT NULL DEFAULT 0,
  remarks VARCHAR(255) NULL,
  status ENUM('available','borrowed','lost','unverified') NOT NULL DEFAULT 'available',
  due_date DATE NULL,
  UNIQUE KEY uniq_book_code (book_code)
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

CREATE INDEX idx_loans_book_open ON digilibrary.loans (book_id, return_date);
CREATE INDEX idx_loans_issue_date ON digilibrary.loans (issue_date);