-- Insert KFC stores
INSERT INTO stores (name, location) VALUES
    ('KFC Times Square', 'New York, NY'),
    ('KFC Downtown', 'Los Angeles, CA'),
    ('KFC Midtown', 'Chicago, IL'),
    ('KFC Westside', 'Houston, TX'),
    ('KFC Eastgate', 'Phoenix, AZ')
ON CONFLICT DO NOTHING;

-- Insert KFC products
INSERT INTO products (name, category) VALUES
    ('Original Recipe Chicken', 'Chicken'),
    ('Extra Crispy Chicken', 'Chicken'),
    ('Spicy Chicken Sandwich', 'Sandwiches'),
    ('Classic Chicken Sandwich', 'Sandwiches'),
    ('Chicken Tenders (3 pcs)', 'Tenders'),
    ('Chicken Tenders (5 pcs)', 'Tenders'),
    ('Popcorn Chicken', 'Chicken'),
    ('Coleslaw', 'Sides'),
    ('Mashed Potatoes', 'Sides'),
    ('Mac & Cheese', 'Sides'),
    ('Biscuit', 'Sides'),
    ('Pepsi (Medium)', 'Drinks'),
    ('Lemonade (Medium)', 'Drinks'),
    ('Famous Bowl', 'Bowls'),
    ('Pot Pie', 'Bowls')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    v_store_id INTEGER;
    v_product_id INTEGER;
    v_date DATE;
    v_hour INTEGER;
    v_quantity INTEGER;
    v_day_of_week INTEGER;
    v_base_quantity INTEGER;
BEGIN
    FOR v_store_id IN SELECT id FROM stores LOOP
        FOR v_product_id IN SELECT id FROM products LOOP
            FOR i IN 0..55 LOOP
                v_date := CURRENT_DATE - i;
                v_day_of_week := EXTRACT(DOW FROM v_date)::INTEGER;
                v_base_quantity := (v_store_id * 3 + v_product_id * 2 + 5);

                FOR v_hour IN 10..22 LOOP
                    v_quantity := v_base_quantity;

                    IF v_hour IN (12, 13) THEN
                        v_quantity := v_quantity * 3;
                    ELSIF v_hour IN (11, 14) THEN
                        v_quantity := v_quantity * 2;
                    ELSIF v_hour IN (18, 19) THEN
                        v_quantity := v_quantity * 4;
                    ELSIF v_hour IN (17, 20) THEN
                        v_quantity := v_quantity * 2;
                    END IF;

                    IF v_day_of_week IN (0, 6) THEN
                        v_quantity := v_quantity + v_base_quantity;
                    END IF;

                    v_quantity := v_quantity + (random() * v_quantity * 0.4 - v_quantity * 0.2)::INTEGER;

                    IF v_quantity < 0 THEN
                        v_quantity := 0;
                    END IF;

                    INSERT INTO sales_history (store_id, product_id, sale_date, sale_hour, quantity)
                    VALUES (v_store_id, v_product_id, v_date, v_hour, v_quantity)
                    ON CONFLICT DO NOTHING;
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
