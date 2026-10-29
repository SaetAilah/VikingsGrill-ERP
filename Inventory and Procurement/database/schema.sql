CREATE DATABASE IF NOT EXISTS vikings_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vikings_erp;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  role ENUM('Owner','Manager','Staff','Management','Accounting','Administrator') NOT NULL DEFAULT 'Staff',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users MODIFY role ENUM('Owner','Manager','Staff','Management','Accounting','Administrator') NOT NULL DEFAULT 'Staff';
UPDATE users SET role = CASE role
  WHEN 'Administrator' THEN 'Owner'
  WHEN 'Management' THEN 'Manager'
  WHEN 'Accounting' THEN 'Staff'
  ELSE role
END
WHERE role IN ('Administrator','Management','Accounting');
SET @existing_owner_id = (SELECT id FROM users WHERE role = 'Owner' ORDER BY id LIMIT 1);
UPDATE users SET role = 'Manager' WHERE role = 'Owner' AND id <> @existing_owner_id;
SET @existing_owner_id = COALESCE(@existing_owner_id, (SELECT id FROM users ORDER BY id LIMIT 1));
UPDATE users SET role = 'Owner' WHERE id = @existing_owner_id AND @existing_owner_id IS NOT NULL;
ALTER TABLE users MODIFY role ENUM('Owner','Manager','Staff') NOT NULL DEFAULT 'Staff';
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (expires_at)
);
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  contact VARCHAR(80) NOT NULL DEFAULT '',
  email VARCHAR(160) NOT NULL DEFAULT '',
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(40) UNIQUE,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  quantity_on_hand DECIMAL(12,3) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(12,3) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  item_type ENUM('Ingredient','Supply') NOT NULL DEFAULT 'Ingredient',
  supplier_id BIGINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  inventory_item_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('Addition','Deduction','Adjustment') NOT NULL,
  quantity_change DECIMAL(12,3) NOT NULL,
  reason VARCHAR(120) NOT NULL,
  reference_no VARCHAR(60) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  INDEX (created_at),
  INDEX (inventory_item_id, created_at)
);
CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  supplier_id BIGINT UNSIGNED NOT NULL,
  order_date DATE NOT NULL,
  status ENUM('Pending','Received','Cancelled') NOT NULL DEFAULT 'Pending',
  received_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  inventory_item_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);
