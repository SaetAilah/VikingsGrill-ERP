USE vikings_erp;

INSERT INTO suppliers (name, contact, email) VALUES
  ('Mindoro Fresh Meats', '0917 555 0124', 'orders@mindorofresh.example'),
  ('Roxas Grain Trading', '0918 345 6677', 'sales@roxasgrain.example'),
  ('Bongabong Produce Co.', '0920 111 4088', 'produce@bongabong.example'),
  ('Oriental Food Supply', '043 288 9500', 'hello@orientalfood.example') AS new
ON DUPLICATE KEY UPDATE contact = new.contact, email = new.email;

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
