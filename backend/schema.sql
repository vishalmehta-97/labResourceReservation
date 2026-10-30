CREATE DATABASE IF NOT EXISTS lab_reservation_db;
USE lab_reservation_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'USER') DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(60) NOT NULL,
  lab_location VARCHAR(100) NOT NULL,
  status ENUM('AVAILABLE', 'MAINTENANCE', 'RETIRED') DEFAULT 'AVAILABLE',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- 3. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  equipment_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED') DEFAULT 'PENDING',
  returned_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
  INDEX idx_conflict_lookup (equipment_id, status, start_time, end_time)
) ENGINE=InnoDB;
