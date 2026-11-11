-- ====================================================================
-- VikingsERP Master Seed Data
-- Database: vikings_erp
-- ====================================================================
USE vikings_erp;

-- 1. Suppliers
INSERT INTO suppliers (id, name, contact, email) VALUES
  (1, 'Mindoro Fresh Meats', '0917 555 0124', 'orders@mindorofresh.example'),
  (2, 'Roxas Grain Trading', '0918 345 6677', 'sales@roxasgrain.example'),
  (3, 'Bongabong Produce Co.', '0920 111 4088', 'produce@bongabong.example'),
  (4, 'Oriental Food Supply', '043 288 9500', 'hello@orientalfood.example') AS new
ON DUPLICATE KEY UPDATE name = new.name, contact = new.contact, email = new.email;

-- 2. Inventory Items
INSERT INTO inventory_items (id, sku, name, category, unit, quantity_on_hand, reorder_level, unit_cost, item_type, supplier_id) VALUES
  (1, 'ING-001', 'Pork belly', 'Meat & poultry', 'kg', 18.5, 10, 285.00, 'Ingredient', 1),
  (2, 'ING-002', 'Chicken leg quarters', 'Meat & poultry', 'kg', 7.2, 12, 195.00, 'Ingredient', 1),
  (3, 'ING-003', 'Jasmine rice', 'Dry goods', 'kg', 42.0, 20, 58.00, 'Ingredient', 2),
  (4, 'ING-004', 'Cooking oil', 'Dry goods', 'L', 6.0, 8, 112.00, 'Ingredient', 2),
  (5, 'ING-005', 'Kangkong', 'Produce', 'kg', 3.4, 5, 65.00, 'Ingredient', 3),
  (6, 'ING-006', 'Coconut milk', 'Canned & chilled', 'L', 11.0, 6, 94.00, 'Ingredient', 4),
  (7, 'SUP-001', 'Takeaway food containers', 'Packaging', 'pcs', 36.0, 50, 4.50, 'Supply', 4),
  (8, 'SUP-002', 'Kitchen gloves', 'Cleaning & safety', 'box', 14.0, 5, 72.00, 'Supply', 4) AS new
ON DUPLICATE KEY UPDATE name = new.name, category = new.category, unit = new.unit,
  quantity_on_hand = new.quantity_on_hand, reorder_level = new.reorder_level,
  unit_cost = new.unit_cost, item_type = new.item_type, supplier_id = new.supplier_id;

-- 3. Menu Items
INSERT INTO menu_items (id, sku, name, category, price, is_available) VALUES
  (1, 'GR-001', 'Grilled Pork Belly', 'Grill', 289.00, TRUE),
  (2, 'GR-002', 'Chicken Inasal', 'Grill', 249.00, TRUE),
  (3, 'MC-014', 'Beef Kare-Kare', 'Main course', 325.00, TRUE),
  (4, 'SD-003', 'Garlic Rice', 'Sides', 65.00, TRUE),
  (5, 'MC-009', 'Sinigang na Baboy', 'Main course', 299.00, TRUE),
  (6, 'DS-002', 'Halo-Halo', 'Dessert', 145.00, TRUE),
  (7, 'DR-005', 'Iced Tea Pitcher', 'Drinks', 120.00, TRUE),
  (8, 'GR-006', 'Lechon Kawali', 'Grill', 315.00, TRUE) AS new
ON DUPLICATE KEY UPDATE name = new.name, category = new.category, price = new.price, is_available = new.is_available;

-- 4. Recipe Ingredients
INSERT INTO recipe_ingredients (menu_item_id, inventory_item_id, quantity_required) VALUES
  (1, 1, 0.300), -- Grilled Pork Belly -> 300g Pork belly
  (2, 2, 0.350), -- Chicken Inasal -> 350g Chicken
  (4, 3, 0.200), -- Garlic Rice -> 200g Jasmine rice
  (4, 4, 0.010), -- Garlic Rice -> 10ml Oil
  (5, 1, 0.250), -- Sinigang -> 250g Pork belly
  (5, 5, 0.080), -- Sinigang -> 80g Kangkong
  (3, 6, 0.150), -- Kare-Kare -> 150ml Coconut milk
  (8, 1, 0.300)  -- Lechon Kawali -> 300g Pork belly
ON DUPLICATE KEY UPDATE quantity_required = VALUES(quantity_required);

-- 4.5. Central Roles Table (Customer Feedback & RBAC Compatibility)
INSERT INTO roles (id, role_name) VALUES
  (1, 'Administrator'),
  (2, 'Manager'),
  (3, 'Staff'),
  (4, 'Customer'),
  (5, 'Owner')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- 5. Users (Default system accounts)
-- Password for all accounts is 'password123'
INSERT INTO users (id, name, email, phone, password_hash, password, role, role_id, employee_id, is_active) VALUES
  (1, 'Michelle Saet (Owner)', 'owner@vikingsgrill.example', '09170000001', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', 'Owner', 5, 'EMP-001', TRUE),
  (2, 'Operations Manager', 'manager@vikingsgrill.example', '09170000002', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', 'Manager', 2, 'EMP-002', TRUE),
  (3, 'Lead Cashier', 'cashier@vikingsgrill.example', '09170000003', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', 'cashier', 3, 'EMP-003', TRUE),
  (4, 'Kitchen Lead', 'kitchen@vikingsgrill.example', '09170000004', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', 'kitchen_staff', 3, 'EMP-004', TRUE),
  (5, 'HR Specialist', 'hr@vikingsgrill.example', '09170000005', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', 'hr_staff', 3, 'EMP-005', TRUE),
  (6, 'Accountant', 'accounting@vikingsgrill.example', '09170000006', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', 'accounting_staff', 3, 'EMP-006', TRUE),
  (7, 'Juan Dela Cruz', 'juan@example.ph', '09181234567', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', 'customer', 4, NULL, TRUE),
  (8, 'Maria Clara', 'maria@example.ph', '09199876543', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiI78o4z/8Yf5n8O04lF2qH.E9mU7tC', 'customer', 4, NULL, TRUE) AS new
ON DUPLICATE KEY UPDATE name = new.name, phone = new.phone, password = new.password, password_hash = new.password_hash, role = new.role, role_id = new.role_id;

-- 6. Customer Profiles
INSERT INTO customer_profiles (user_id, phone, address, loyalty_points, preferences) VALUES
  (7, '09181234567', 'Roxas, Oriental Mindoro', 150, 'Prefers outdoor/grill area, extra garlic rice'),
  (8, '09199876543', 'Bongabong, Oriental Mindoro', 240, 'Non-spicy, prefers KTV rooms on weekends')
ON DUPLICATE KEY UPDATE phone = VALUES(phone), loyalty_points = VALUES(loyalty_points);

-- 7. Restaurant Tables (Reshallyn's Module)
INSERT INTO restaurant_tables (id, table_number, capacity, area, status) VALUES
  (1, 'T-01', 4, 'main', 'available'),
  (2, 'T-02', 4, 'main', 'occupied'),
  (3, 'T-03', 2, 'main', 'available'),
  (4, 'T-04', 6, 'main', 'reserved'),
  (5, 'B-01', 2, 'bar', 'available'),
  (6, 'B-02', 2, 'bar', 'available'),
  (7, 'BIL-01', 8, 'billiards', 'available'),
  (8, 'BIL-02', 8, 'billiards', 'occupied'),
  (9, 'KTV-01', 10, 'ktv', 'reserved'),
  (10, 'KTV-02', 12, 'ktv', 'available') AS new
ON DUPLICATE KEY UPDATE capacity = new.capacity, area = new.area, status = new.status;

-- 8. Sample Reservations
INSERT INTO reservations (id, customer_id, reservation_date, reservation_time, guests, table_preference, table_id, status, notes) VALUES
  (1, 7, CURDATE(), '18:30:00', 4, 'main', 4, 'approved', 'Birthday celebration dinner'),
  (2, 8, CURDATE(), '20:00:00', 10, 'ktv', 9, 'approved', 'Family reunion KTV package') AS new
ON DUPLICATE KEY UPDATE status = new.status, notes = new.notes;

-- 9. Employees (Jewel's Module)
INSERT INTO employees (id, first_name, last_name, email, phone, position, department, status, hire_date, salary, address) VALUES
  (1, 'Michelle', 'Saet', 'owner@vikingsgrill.example', '09170000001', 'Managing Owner', 'Executive', 'active', '2024-01-01', 65000.00, 'Roxas, Oriental Mindoro'),
  (2, 'Carlos', 'Reyes', 'carlos@vikingsgrill.example', '09170000002', 'Head Chef', 'Kitchen', 'active', '2024-02-15', 32000.00, 'Bongabong, Oriental Mindoro'),
  (3, 'Ana', 'Mendoza', 'ana@vikingsgrill.example', '09170000003', 'Lead Cashier', 'Front of House', 'active', '2024-03-01', 22000.00, 'Roxas, Oriental Mindoro'),
  (4, 'Mark', 'Bautista', 'mark@vikingsgrill.example', '09170000004', 'Grill Master', 'Kitchen', 'active', '2024-03-15', 24000.00, 'Mansalay, Oriental Mindoro'),
  (5, 'Sarah', 'Lim', 'sarah@vikingsgrill.example', '09170000005', 'Finance Officer', 'Finance & Accounting', 'active', '2024-04-01', 30000.00, 'Roxas, Oriental Mindoro') AS new
ON DUPLICATE KEY UPDATE position = new.position, department = new.department, salary = new.salary;

-- 10. Sample Attendance
INSERT INTO attendance (employee_id, date, time_in, time_out, status, hours_worked) VALUES
  (1, CURDATE(), '08:00:00', '17:00:00', 'present', 8.00),
  (2, CURDATE(), '09:00:00', '18:00:00', 'present', 8.00),
  (3, CURDATE(), '08:45:00', '17:45:00', 'present', 8.00),
  (4, CURDATE(), '09:15:00', '18:15:00', 'late', 7.50),
  (5, CURDATE(), '08:00:00', '17:00:00', 'present', 8.00)
ON DUPLICATE KEY UPDATE status = VALUES(status), hours_worked = VALUES(hours_worked);

-- 11. Accounting Transactions (Jewel's Module)
INSERT INTO transactions (id, date, type, category, description, amount, reference, created_by) VALUES
  (1, CURDATE(), 'income', 'Daily POS Sales', 'Consolidated daily dining revenue', 48500.00, 'POS-202611-001', 'EMP-003'),
  (2, CURDATE(), 'income', 'KTV Booking', 'KTV Room 1 advance deposit', 3500.00, 'RES-202611-002', 'EMP-003'),
  (3, CURDATE(), 'expense', 'Kitchen Inventory', 'Restock pork belly and produce', 12450.00, 'PO-202611-01', 'EMP-002'),
  (4, CURDATE(), 'expense', 'Utilities', 'Electricity bill November 2026', 18200.00, 'UTL-202611', 'EMP-005') AS new
ON DUPLICATE KEY UPDATE amount = new.amount, description = new.description;

-- 12. Customer Feedback (Ariane's Module)
INSERT INTO feedback (id, user_id, customer_name, service, rating, comment, sentiment, status) VALUES
  (1, 7, 'Juan Dela Cruz', 'Dining Service', 5, 'Best grilled pork belly in Roxas! Fast service and cozy atmosphere.', 'positive', 'reviewed'),
  (2, 8, 'Maria Clara', 'KTV Room', 5, 'Super fun KTV room experience, great sound system and clean facilities.', 'positive', 'reviewed'),
  (3, NULL, 'Walk-in Diner', 'Grill & Drinks', 4, 'Food is consistently delicious. Wait time was a bit long during peak dinner rush.', 'positive', 'reviewed'),
  (4, NULL, 'Touring Visitor', 'Reservation Service', 5, 'Seamless online table reservation. We were seated promptly upon arrival.', 'positive', 'reviewed') AS new
ON DUPLICATE KEY UPDATE rating = new.rating, comment = new.comment, sentiment = new.sentiment;

-- 13. KPI Definitions & Targets (Jesserene's Module)
INSERT INTO kpi_definitions (id, metric_key, name, category, unit, comparison, description) VALUES
  (1, 'MONTHLY_SALES', 'Monthly Gross Sales Revenue', 'Sales', 'PHP', 'at_least', 'Total sales recorded through POS and billing terminals'),
  (2, 'FOOD_COST_RATIO', 'Food Cost Percentage', 'Inventory', '%', 'at_most', 'Ratio of ingredient costs to gross food sales'),
  (3, 'TABLE_TURNOVER', 'Table Turnover Rate', 'Sales', 'turns/day', 'at_least', 'Average times each dining table is reoccupied per day'),
  (4, 'CSAT_SCORE', 'Customer Satisfaction Score', 'Customer', '/5.0', 'at_least', 'Average customer feedback rating from QR reviews'),
  (5, 'NET_PROFIT_MARGIN', 'Net Profit Margin', 'Finance', '%', 'at_least', 'Net profit after payroll, supplies, and utilities') AS new
ON DUPLICATE KEY UPDATE name = new.name, unit = new.unit, comparison = new.comparison;

INSERT INTO kpi_targets (id, kpi_id, target_value, evaluation_period, effective_start) VALUES
  (1, 1, 500000.00, 'monthly', '2026-11-01'),
  (2, 2, 32.00, 'monthly', '2026-11-01'),
  (3, 3, 3.50, 'daily', '2026-11-01'),
  (4, 4, 4.50, 'monthly', '2026-11-01'),
  (5, 5, 25.00, 'monthly', '2026-11-01') AS new
ON DUPLICATE KEY UPDATE target_value = new.target_value;

INSERT INTO kpi_evaluations (id, kpi_id, target_id, actual_value, achievement_rate, status) VALUES
  (1, 1, 1, 524000.00, 104.80, 'achieved'),
  (2, 2, 2, 29.80, 107.38, 'achieved'),
  (3, 3, 3, 3.80, 108.57, 'achieved'),
  (4, 4, 4, 4.75, 105.56, 'achieved'),
  (5, 5, 5, 26.40, 105.60, 'achieved') AS new
ON DUPLICATE KEY UPDATE actual_value = new.actual_value, achievement_rate = new.achievement_rate, status = new.status;
