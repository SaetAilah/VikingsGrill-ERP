-- VikingsERP Unified Database Seed Data
USE vikings_erp;

-- 1. Suppliers
INSERT INTO suppliers (name, contact, email) VALUES
  ('Mindoro Fresh Meats', '0917 555 0124', 'orders@mindorofresh.example'),
  ('Roxas Grain Trading', '0918 345 6677', 'sales@roxasgrain.example'),
  ('Bongabong Produce Co.', '0920 111 4088', 'produce@bongabong.example'),
  ('Oriental Food Supply', '043 288 9500', 'hello@orientalfood.example') AS new
ON DUPLICATE KEY UPDATE contact = new.contact, email = new.email;

-- 2. Inventory Items
INSERT INTO inventory_items (sku, name, category, unit, quantity_on_hand, reorder_level, unit_cost, item_type, supplier_id) VALUES
  ('ING-001', 'Pork belly', 'Meat & poultry', 'kg', 18.5, 10, 285, 'Ingredient', (SELECT id FROM suppliers WHERE name = 'Mindoro Fresh Meats')),
  ('ING-002', 'Chicken leg quarters', 'Meat & poultry', 'kg', 7.2, 12, 195, 'Ingredient', (SELECT id FROM suppliers WHERE name = 'Mindoro Fresh Meats')),
  ('ING-003', 'Jasmine rice', 'Dry goods', 'kg', 42, 20, 58, 'Ingredient', (SELECT id FROM suppliers WHERE name = 'Roxas Grain Trading')),
  ('ING-004', 'Cooking oil', 'Dry goods', 'L', 6, 8, 112, 'Ingredient', (SELECT id FROM suppliers WHERE name = 'Roxas Grain Trading')),
  ('ING-005', 'Kangkong', 'Produce', 'kg', 3.4, 5, 65, 'Ingredient', (SELECT id FROM suppliers WHERE name = 'Bongabong Produce Co.')),
  ('ING-006', 'Coconut milk', 'Canned & chilled', 'L', 11, 6, 94, 'Ingredient', (SELECT id FROM suppliers WHERE name = 'Oriental Food Supply')),
  ('SUP-001', 'Takeaway food containers', 'Packaging', 'pcs', 36, 50, 4.5, 'Supply', (SELECT id FROM suppliers WHERE name = 'Oriental Food Supply')),
  ('SUP-002', 'Kitchen gloves', 'Cleaning & safety', 'box', 14, 5, 72, 'Supply', (SELECT id FROM suppliers WHERE name = 'Oriental Food Supply')) AS new
ON DUPLICATE KEY UPDATE name = new.name, category = new.category, unit = new.unit,
  quantity_on_hand = new.quantity_on_hand, reorder_level = new.reorder_level,
  unit_cost = new.unit_cost, item_type = new.item_type, supplier_id = new.supplier_id;

-- 3. Menu Items
INSERT INTO menu_items (sku, name, category, price, is_available) VALUES
  ('GR-001', 'Grilled Pork Belly', 'Grill', 289, TRUE),
  ('GR-002', 'Chicken Inasal', 'Grill', 249, TRUE),
  ('MC-014', 'Beef Kare-Kare', 'Main course', 325, TRUE),
  ('SD-003', 'Garlic Rice', 'Sides', 65, TRUE),
  ('MC-009', 'Sinigang na Baboy', 'Main course', 299, TRUE),
  ('DS-002', 'Halo-Halo', 'Dessert', 145, TRUE),
  ('DR-005', 'Iced Tea Pitcher', 'Drinks', 120, TRUE),
  ('GR-006', 'Lechon Kawali', 'Grill', 315, TRUE) AS new
ON DUPLICATE KEY UPDATE name = new.name, category = new.category, price = new.price, is_available = new.is_available;

-- 4. Recipe Ingredients
INSERT INTO recipe_ingredients (menu_item_id, inventory_item_id, quantity_required)
SELECT m.id, i.id, recipe.quantity_required
FROM (
  SELECT 'GR-001' AS menu_sku, 'ING-001' AS item_sku, 0.300 AS quantity_required
  UNION ALL SELECT 'GR-002', 'ING-002', 0.350
  UNION ALL SELECT 'SD-003', 'ING-003', 0.200
  UNION ALL SELECT 'SD-003', 'ING-004', 0.010
  UNION ALL SELECT 'MC-009', 'ING-001', 0.250
  UNION ALL SELECT 'MC-009', 'ING-005', 0.080
  UNION ALL SELECT 'MC-014', 'ING-006', 0.150
  UNION ALL SELECT 'GR-006', 'ING-001', 0.300
) AS recipe
JOIN menu_items m ON m.sku = recipe.menu_sku
JOIN inventory_items i ON i.sku = recipe.item_sku
ON DUPLICATE KEY UPDATE quantity_required = recipe.quantity_required;

