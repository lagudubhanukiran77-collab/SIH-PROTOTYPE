-- SEED DATA FOR MIDNIGHT FEAST
-- Categories, Menu Items, Coupons, Settings

-- 1. Ensure Default Restaurant Settings
INSERT INTO public.restaurant_settings (
    id,
    restaurant_name,
    address,
    phone,
    email,
    operating_status,
    open_time,
    close_time,
    allow_late_ordering,
    allow_advance_ordering,
    tax_percentage,
    delivery_fee,
    free_delivery_threshold,
    min_order_amount,
    max_delivery_radius_km,
    estimated_delivery_time_mins,
    enable_delivery,
    enable_pickup,
    enable_dinein,
    total_tables,
    seating_capacity,
    max_guests_per_reservation,
    reservation_cancel_window_hours
) VALUES (
    1,
    'Midnight Feast',
    '42 Starlight Boulevard, Gourmet Quarter',
    '+91 98765 43210',
    'reservations@midnightfeast.com',
    'open',
    '18:00:00',
    '02:00:00',
    false,
    true,
    5.00,
    40.00,
    499.00,
    199.00,
    15.00,
    35,
    true,
    true,
    true,
    24,
    96,
    12,
    2
) ON CONFLICT (id) DO UPDATE SET 
    open_time = '18:00:00',
    close_time = '02:00:00',
    min_order_amount = 199.00,
    free_delivery_threshold = 499.00,
    delivery_fee = 40.00,
    tax_percentage = 5.00;

-- 2. Insert Categories
INSERT INTO public.categories (id, name, slug, display_order, is_active) VALUES
('11111111-1111-1111-1111-111111111101', 'Late-Night Signatures', 'signatures', 1, true),
('11111111-1111-1111-1111-111111111102', 'Wood-Fired Pizzas', 'pizzas', 2, true),
('11111111-1111-1111-1111-111111111103', 'Gourmet Small Plates', 'small-plates', 3, true),
('11111111-1111-1111-1111-111111111104', 'Artisanal Desserts', 'desserts', 4, true),
('11111111-1111-1111-1111-111111111105', 'Midnight Elixirs', 'beverages', 5, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Menu Items (Rule 4: Name, Description, Price, Image, Veg flag, Availability, Prep time)
INSERT INTO public.menu_items (
    id, category_id, name, description, price, image_url, is_vegetarian, availability, prep_time_minutes, stock_quantity, is_inventory_tracked
) VALUES
-- Signatures
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Truffle Wagyu Midnight Burger', 'Double smashed wagyu patty, black truffle aioli, smoked aged cheddar, brioche bun with activated charcoal.', 549.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', false, 'available', 20, 50, true),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Smoked Butter Chicken Slider Trio', 'Slow-cooked spiced tandoori pulled chicken in rich makhan gravy between mini butter-toasted milk buns.', 389.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', false, 'available', 25, 40, true),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Wild Mushroom & Burrata Brioche', 'Pan-seared foraged wild mushrooms, whole artisanal burrata, rosemary garlic emulsion, toasted sourdough.', 429.00, 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=800&q=80', true, 'available', 15, 30, true),

-- Pizzas
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Midnight Black Truffle Pizza', 'Activated charcoal sourdough crust, white truffle oil, buffalo mozzarella, wild porcini, roasted garlic.', 599.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', true, 'available', 22, 25, true),
('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102', 'Spicy Pepperoni & Hot Honey', 'San Marzano tomato base, slow-cured spicy pork pepperoni, fior di latte, artisanal hot chili honey drizzle.', 529.00, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80', false, 'available', 20, 35, true),
('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111102', 'Classic Margherita Di Bufala', 'Sweet Italian San Marzano tomatoes, fresh basil leaves, buffalo mozzarella, cold-pressed EVOO.', 449.00, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80', true, 'available', 18, 50, true),

-- Small plates
('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111103', 'Parmesan Truffle Midnight Fries', 'Hand-cut triple-cooked potatoes tossed with shaved Grana Padano, parsley, and white truffle oil.', 249.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', true, 'available', 12, 100, true),
('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111103', 'Crispy Golden Calamari Rings', 'Flash-fried coastal squid with garlic sea salt, smoked paprika, served with kaffir lime aioli.', 349.00, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', false, 'available', 15, 20, true),
('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111103', 'Fire-Roasted Paneer Tikka Skewers', 'Cottage cheese cubes marinated in smoked hung curd, carom seeds, and crushed Himalayan spices.', 299.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80', true, 'available', 18, 40, true),
('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111103', 'Tokyo Midnight Pork Gyoza', 'Pan-crisped handmade dumplings stuffed with Berkshire pork, scallions, ginger, served with chili rayu.', 329.00, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80', false, 'temporarily_unavailable', 16, 0, true),

-- Desserts
('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111104', '70% Valrhona Dark Molten Lava', 'Warm Belgian chocolate cake with a molten truffle center, accompanied by Madagascar vanilla bean gelato.', 299.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', true, 'available', 14, 25, true),
('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111104', '24K Saffron Pistachio Panna Cotta', 'Silky Kashmiri saffron cream layered with crushed Iranian pistachios and edible 24-karat gold leaf.', 349.00, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', true, 'available', 10, 15, true),

-- Beverages
('22222222-2222-2222-2222-222222222213', '11111111-1111-1111-1111-111111111105', 'Smoked Rosemary & Blackberry Fizz', 'Clarified blackberry reduction, smoked rosemary syrup, botanical tonic, sparkling mountain water.', 189.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', true, 'available', 8, 80, true),
('22222222-2222-2222-2222-222222222214', '11111111-1111-1111-1111-111111111105', 'Velvet Nitro Cold Brew', '18-hour cold steeped Ethiopian single-origin coffee infused with nitrogen for a creamy Guinness-like cascade.', 169.00, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', true, 'available', 5, 60, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Default Coupons (Rule 22)
INSERT INTO public.coupons (
    code, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, expiry_date, usage_limit, is_active
) VALUES
('MIDNIGHT50', 'percentage', 20.00, 399.00, 150.00, now() - INTERVAL '1 day', now() + INTERVAL '90 days', 500, true),
('FEAST100', 'fixed', 100.00, 599.00, NULL, now() - INTERVAL '1 day', now() + INTERVAL '90 days', 200, true),
('LATEOWL', 'percentage', 15.00, 299.00, 100.00, now() - INTERVAL '1 day', now() + INTERVAL '30 days', 1000, true)
ON CONFLICT (code) DO NOTHING;
