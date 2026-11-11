-- ====================================================================
-- VikingsERP: Master Centralized Relational Database Schema
-- Single Source of Truth for Vikings Grill (Roxas, Oriental Mindoro)
-- Integrating:
--   1. Core Authentication & RBAC
--   2. Reservation & Queue Management (Reshallyn Mortel)
--   3. Digital Menu & Ordering (Reshallyn Mortel)
--   4. Point of Sale (POS) & Billing (Michelle Ailah Saet)
--   5. Kitchen Inventory & Procurement (Michelle Ailah Saet)
--   6. Human Resources & Payroll (Jewel Mabasa)
--   7. Accounting & Financial Transactions (Jewel Mabasa)
--   8. Customer Feedback & CRM (Cecille Ariane Dela Peña)
--   9. Business Performance & KPI Management (Jesserene Espinosa)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS vikings_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vikings_erp;

-- ====================================================================
-- SECTION 1: AUTHENTICATION, USERS & CENTRALIZED RBAC
-- ====================================================================

CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(30) DEFAULT NULL,
  password_hash VARCHAR(255) NULL,
  password VARCHAR(255) NULL,
  role ENUM(
    'customer',
    'reservation_staff',
    'kitchen_staff',
    'cashier',
    'inventory_staff',
    'hr_staff',
    'accounting_staff',
    'management',
    'Owner',
    'Manager',
    'Staff',
    'administrator'
  ) NOT NULL DEFAULT 'customer',
  role_id INT UNSIGNED NULL,
  employee_id VARCHAR(50) DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email (email),
  INDEX idx_user_role (role),
  INDEX idx_user_role_id (role_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_users_sync_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.password_hash IS NULL AND NEW.password IS NOT NULL THEN
    SET NEW.password_hash = NEW.password;
  ELSEIF NEW.password IS NULL AND NEW.password_hash IS NOT NULL THEN
    SET NEW.password = NEW.password_hash;
  END IF;
  IF NEW.role_id IS NULL AND NEW.role IS NOT NULL THEN
    SET NEW.role_id = CASE
      WHEN NEW.role IN ('administrator', 'Administrator') THEN 1
      WHEN NEW.role IN ('Manager', 'management') THEN 2
      WHEN NEW.role IN ('Owner') THEN 5
      WHEN NEW.role IN ('customer', 'Customer') THEN 4
      ELSE 3
    END;
  ELSEIF NEW.role IS NULL AND NEW.role_id IS NOT NULL THEN
    SET NEW.role = CASE
      WHEN NEW.role_id = 1 THEN 'administrator'
      WHEN NEW.role_id = 2 THEN 'Manager'
      WHEN NEW.role_id = 5 THEN 'Owner'
      WHEN NEW.role_id = 4 THEN 'customer'
      ELSE 'Staff'
    END;
  END IF;
END //
DELIMITER ;

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  phone VARCHAR(30) DEFAULT '',
  address TEXT DEFAULT NULL,
  loyalty_points INT UNSIGNED NOT NULL DEFAULT 0,
  preferences TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================================
-- SECTION 2: RESTAURANT TABLES, RESERVATIONS & QUEUE (Reshallyn Mortel)
-- ====================================================================

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  table_number VARCHAR(10) NOT NULL UNIQUE,
  capacity INT UNSIGNED NOT NULL DEFAULT 4,
  area ENUM('bar', 'billiards', 'ktv', 'main') NOT NULL DEFAULT 'main',
  status ENUM('available', 'occupied', 'reserved', 'maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INT UNSIGNED NOT NULL DEFAULT 1,
  table_preference ENUM('bar', 'billiards', 'ktv', 'main', 'any') NOT NULL DEFAULT 'any',
  table_id INT UNSIGNED DEFAULT NULL,
  status ENUM('pending', 'approved', 'queued', 'seated', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  INDEX idx_res_date (reservation_date),
  INDEX idx_res_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS queue_entries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT UNSIGNED NOT NULL UNIQUE,
  queue_number INT NOT NULL,
  position INT NOT NULL,
  status ENUM('waiting', 'called', 'seated', 'cancelled', 'no_show') NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seating (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT UNSIGNED NOT NULL,
  table_id INT UNSIGNED NOT NULL,
  seated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL DEFAULT NULL,
  status ENUM('seated', 'finished') NOT NULL DEFAULT 'seated',
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================================
-- SECTION 3: MENU, DIGITAL ORDERING & RECIPES
-- ====================================================================

CREATE TABLE IF NOT EXISTS menu_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(40) UNIQUE,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Main course',
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description TEXT DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_menu_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED DEFAULT NULL,
  reservation_id INT UNSIGNED DEFAULT NULL,
  order_type VARCHAR(40) NOT NULL DEFAULT 'Walk-in',
  table_number VARCHAR(20) DEFAULT NULL,
  status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
  INDEX idx_order_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================================
-- SECTION 4: POINT OF SALE (POS) & BILLING (Michelle Ailah Saet)
-- ====================================================================

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  receipt_no VARCHAR(50) NOT NULL UNIQUE,
  order_id BIGINT UNSIGNED DEFAULT NULL,
  order_type VARCHAR(40) NOT NULL DEFAULT 'Walk-in',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Completed', 'Voided', 'Refunded') NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_sales_date (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NULL,
  item_name VARCHAR(120) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  method ENUM('Cash', 'Card', 'GCash', 'Maya') NOT NULL DEFAULT 'Cash',
  amount DECIMAL(10,2) NOT NULL,
  amount_tendered DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================================
-- SECTION 5: INVENTORY, SUPPLIERS & PROCUREMENT (Michelle Ailah Saet)
-- ====================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  contact VARCHAR(80) NOT NULL DEFAULT '',
  email VARCHAR(160) NOT NULL DEFAULT '',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(40) UNIQUE,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  quantity_on_hand DECIMAL(12,3) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(12,3) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  item_type ENUM('Ingredient', 'Supply') NOT NULL DEFAULT 'Ingredient',
  supplier_id BIGINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX idx_inv_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  menu_item_id BIGINT UNSIGNED NOT NULL,
  inventory_item_id BIGINT UNSIGNED NOT NULL,
  quantity_required DECIMAL(12,3) NOT NULL,
  PRIMARY KEY (menu_item_id, inventory_item_id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  inventory_item_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('Addition', 'Deduction', 'Adjustment') NOT NULL,
  quantity_change DECIMAL(12,3) NOT NULL,
  reason VARCHAR(120) NOT NULL,
  reference_no VARCHAR(60) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  INDEX idx_movement_date (created_at),
  INDEX idx_movement_item (inventory_item_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  supplier_id BIGINT UNSIGNED NOT NULL,
  order_date DATE NOT NULL,
  status ENUM('Pending', 'Received', 'Cancelled') NOT NULL DEFAULT 'Pending',
  received_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id BIGINT UNSIGNED NOT NULL,
  inventory_item_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ====================================================================
-- SECTION 6: HUMAN RESOURCES & PAYROLL (Jewel Mabasa)
-- ====================================================================

CREATE TABLE IF NOT EXISTS employees (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(30) DEFAULT '',
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  hire_date DATE DEFAULT NULL,
  salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  address TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  time_in TIME DEFAULT NULL,
  time_out TIME DEFAULT NULL,
  status ENUM('present', 'absent', 'late', 'half-day') NOT NULL,
  hours_worked DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_date (employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS schedules (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  week VARCHAR(10) NOT NULL COMMENT 'ISO week, e.g. 2026-W41',
  monday VARCHAR(20) DEFAULT 'Off',
  tuesday VARCHAR(20) DEFAULT 'Off',
  wednesday VARCHAR(20) DEFAULT 'Off',
  thursday VARCHAR(20) DEFAULT 'Off',
  friday VARCHAR(20) DEFAULT 'Off',
  saturday VARCHAR(20) DEFAULT 'Off',
  sunday VARCHAR(20) DEFAULT 'Off',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_week (employee_id, week),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payroll (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_pay DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  deductions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_pay DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'approved', 'paid') NOT NULL DEFAULT 'pending',
  payment_date DATE DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================================
-- SECTION 7: ACCOUNTING & FINANCE (Jewel Mabasa)
-- ====================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT DEFAULT NULL,
  amount DECIMAL(14,2) NOT NULL,
  reference VARCHAR(80) DEFAULT NULL,
  created_by VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trans_date (date),
  INDEX idx_trans_type (type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_records (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  type VARCHAR(40) NOT NULL COMMENT 'Dine-in, Takeout, Walk-in',
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  orders_count INT UNSIGNED NOT NULL DEFAULT 0,
  avg_order_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pos_ref VARCHAR(80) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_records (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  payee VARCHAR(120) NOT NULL,
  method VARCHAR(40) NOT NULL DEFAULT 'Cash',
  amount DECIMAL(14,2) NOT NULL,
  category VARCHAR(80) NOT NULL,
  reference VARCHAR(80) DEFAULT NULL,
  status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================================
-- SECTION 8: CUSTOMER FEEDBACK & CRM (Cecille Ariane Dela Peña)
-- ====================================================================

CREATE TABLE IF NOT EXISTS feedback (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  customer_name VARCHAR(120) DEFAULT 'Guest Diner',
  service VARCHAR(100) NOT NULL DEFAULT 'Dining Service',
  rating TINYINT UNSIGNED NOT NULL COMMENT 'Rating scale 1 to 5',
  comment TEXT DEFAULT NULL,
  sentiment ENUM('positive', 'neutral', 'negative') DEFAULT 'positive',
  status ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_feedback_rating (rating),
  INDEX idx_feedback_date (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(80) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================================
-- SECTION 9: REPORTING & BUSINESS PERFORMANCE / KPI (Jesserene Espinosa)
-- ====================================================================

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  metric_key VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category ENUM('Sales', 'Inventory', 'HR', 'Customer', 'Finance') NOT NULL DEFAULT 'Sales',
  unit VARCHAR(30) NOT NULL DEFAULT 'PHP',
  comparison ENUM('at_least', 'at_most') NOT NULL DEFAULT 'at_least',
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kpi_targets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kpi_id INT UNSIGNED NOT NULL,
  target_value DECIMAL(14,2) NOT NULL,
  evaluation_period ENUM('daily', 'weekly', 'monthly', 'quarterly') NOT NULL DEFAULT 'monthly',
  effective_start DATE NOT NULL,
  effective_end DATE DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kpi_evaluations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kpi_id INT UNSIGNED NOT NULL,
  target_id INT UNSIGNED NOT NULL,
  actual_value DECIMAL(14,2) NOT NULL,
  achievement_rate DECIMAL(6,2) NOT NULL COMMENT 'Percentage e.g. 105.50%',
  status ENUM('achieved', 'at_risk', 'failed') NOT NULL DEFAULT 'achieved',
  evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES kpi_targets(id) ON DELETE CASCADE,
  INDEX idx_eval_date (evaluated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kpi_alerts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kpi_id INT UNSIGNED NOT NULL,
  alert_type ENUM('warning', 'critical') NOT NULL DEFAULT 'warning',
  message VARCHAR(255) NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE
) ENGINE=InnoDB;
