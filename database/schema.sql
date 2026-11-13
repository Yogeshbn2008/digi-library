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

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  success TINYINT(1) NOT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attempts_user_time (username, attempted_at),
  INDEX idx_attempts_ip_time (ip, attempted_at)
);


CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NULL,
  admin_username VARCHAR(50) NOT NULL,
  action VARCHAR(40) NOT NULL,
  target VARCHAR(120) NULL,
  details VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_admin (admin_username, created_at)
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_no VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  room_no VARCHAR(10) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('pending','approved','rejected','blocked') NOT NULL DEFAULT 'pending',
  created_ip VARCHAR(45) NOT NULL DEFAULT 'unknown',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  decided_by VARCHAR(50) NULL,
  last_login_at DATETIME NULL,
  UNIQUE KEY uniq_student_reg (registration_no),
  INDEX idx_students_status (status, created_at),
  INDEX idx_students_ip_time (created_ip, created_at)
);

CREATE TABLE IF NOT EXISTS student_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_session_token (token_hash),
  INDEX idx_sessions_student (student_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);