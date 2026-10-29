USE vikings_erp;

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
