-- MIDNIGHT FEAST RESTAURANT DATABASE SCHEMA
-- Migration: 20260923000001_midnight_feast_schema.sql
-- Enforces all 37 Business Rules with Postgres Constraints, Triggers, RLS, and Stored Procedures

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE restaurant_status AS ENUM ('open', 'closed', 'temporarily_closed', 'accepting_preorders');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending', 
        'confirmed', 
        'preparing', 
        'ready', 
        'out_for_delivery', 
        'completed', 
        'cancelled_by_customer', 
        'cancelled_by_restaurant', 
        'payment_failed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending', 
        'paid', 
        'failed', 
        'refunded', 
        'partially_refunded'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('delivery', 'pickup', 'dine_in');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE item_availability AS ENUM ('available', 'temporarily_unavailable', 'hidden');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE (Rule 2, 3, 26, 27, 28)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RESTAURANT SETTINGS TABLE (Rule 1, 6, 8, 9, 11, 14, 18, 19, 23, 29)
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    restaurant_name TEXT NOT NULL DEFAULT 'Midnight Feast',
    logo_url TEXT,
    address TEXT NOT NULL DEFAULT '42 Starlight Boulevard, Gourmet District',
    phone TEXT NOT NULL DEFAULT '+91 98765 43210',
    email TEXT NOT NULL DEFAULT 'concierge@midnightfeast.com',
    operating_status restaurant_status NOT NULL DEFAULT 'open',
    open_time TIME NOT NULL DEFAULT '18:00:00',
    close_time TIME NOT NULL DEFAULT '02:00:00',
    allow_late_ordering BOOLEAN NOT NULL DEFAULT false,
    allow_advance_ordering BOOLEAN NOT NULL DEFAULT true,
    tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (tax_percentage >= 0),
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 40.00 CHECK (delivery_fee >= 0),
    free_delivery_threshold NUMERIC(10,2) NOT NULL DEFAULT 499.00 CHECK (free_delivery_threshold >= 0),
    min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 199.00 CHECK (min_order_amount >= 0),
    max_delivery_radius_km NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (max_delivery_radius_km > 0),
    estimated_delivery_time_mins INT NOT NULL DEFAULT 35 CHECK (estimated_delivery_time_mins > 0),
    enable_delivery BOOLEAN NOT NULL DEFAULT true,
    enable_pickup BOOLEAN NOT NULL DEFAULT true,
    enable_dinein BOOLEAN NOT NULL DEFAULT true,
    total_tables INT NOT NULL DEFAULT 24 CHECK (total_tables > 0),
    seating_capacity INT NOT NULL DEFAULT 96 CHECK (seating_capacity > 0),
    max_guests_per_reservation INT NOT NULL DEFAULT 12 CHECK (max_guests_per_reservation > 0),
    reservation_duration_minutes INT NOT NULL DEFAULT 90 CHECK (reservation_duration_minutes > 0),
    reservation_cancel_window_hours INT NOT NULL DEFAULT 2 CHECK (reservation_cancel_window_hours >= 0),
    enabled_payment_methods JSONB NOT NULL DEFAULT '["razorpay_online", "upi", "card", "cash_on_delivery", "pay_at_restaurant"]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initialize settings if empty
INSERT INTO public.restaurant_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. MENU ITEMS TABLE (Rule 4, 5, 25)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    image_url TEXT NOT NULL,
    is_vegetarian BOOLEAN NOT NULL DEFAULT false,
    availability item_availability NOT NULL DEFAULT 'available',
    prep_time_minutes INT NOT NULL DEFAULT 20 CHECK (prep_time_minutes > 0),
    stock_quantity INT CHECK (stock_quantity >= 0),
    is_inventory_tracked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. USER SAVED ADDRESSES TABLE (Rule 2, 10, 26)
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    landmark TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. COUPONS TABLE (Rule 22)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type discount_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC(10,2) CHECK (max_discount_amount > 0),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiry_date TIMESTAMPTZ NOT NULL,
    usage_limit INT CHECK (usage_limit > 0),
    per_user_limit INT DEFAULT 1 CHECK (per_user_limit > 0),
    times_used INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ORDERS TABLE (Rule 5, 8, 9, 11, 12, 13, 14, 15, 32, 33)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    order_type order_type NOT NULL,
    order_status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    idempotency_key TEXT UNIQUE,
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    applied_coupon_code TEXT,
    tax_amount NUMERIC(10,2) NOT NULL CHECK (tax_amount >= 0),
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    delivery_address JSONB,
    table_number INT,
    customer_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. ORDER ITEMS TABLE (Rule 4, 5)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    item_name TEXT NOT NULL,
    item_price NUMERIC(10,2) NOT NULL CHECK (item_price > 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price > 0)
);

-- 11. ORDER STATUS HISTORY TABLE (Rule 13, 30)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status order_status NOT NULL,
    changed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. RESERVATIONS TABLE (Rule 17, 18, 19)
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guest_count INT NOT NULL CHECK (guest_count > 0),
    table_number INT,
    special_requests TEXT,
    status reservation_status NOT NULL DEFAULT 'pending',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. REVIEWS TABLE (Rule 20)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status review_status NOT NULL DEFAULT 'pending_approval',
    moderated_by UUID REFERENCES public.profiles(id),
    moderated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_order_review UNIQUE(order_id, customer_id)
);

-- 14. FAVORITES TABLE (Rule 21)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_favorite UNIQUE(user_id, menu_item_id)
);

-- 15. AUDIT LOGS TABLE (Rule 30)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. NOTIFICATIONS TABLE (Rule 34)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR SECURITY & AUTHORIZATION (Rule 2, 3, 27, 28, 31)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('staff', 'admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

--------------------------------------------------------------------------------
-- ROLE ESCALATION PREVENTION (Rule 2: Customers cannot change their own role)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is updating their own profile and is not an admin, prevent changing role
    IF TG_OP = 'UPDATE' THEN
        IF NEW.role <> OLD.role THEN
            IF NOT public.is_admin() THEN
                RAISE EXCEPTION 'Access Denied: You cannot modify your own user role.';
            END IF;
        END IF;
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();

--------------------------------------------------------------------------------
-- OPERATING HOURS CHECK FUNCTION (Rule 1: 6:00 PM – 2:00 AM)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_restaurant_open_at(check_time TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
    settings RECORD;
    t TIME;
BEGIN
    SELECT operating_status, open_time, close_time, allow_late_ordering
    INTO settings FROM public.restaurant_settings WHERE id = 1;

    -- If explicitly closed or temporarily closed
    IF settings.operating_status IN ('closed', 'temporarily_closed') THEN
        RETURN FALSE;
    END IF;

    -- Extract local time
    t := check_time::TIME;

    -- If open spans midnight (e.g. 18:00 to 02:00)
    IF settings.open_time > settings.close_time THEN
        IF t >= settings.open_time OR t <= settings.close_time THEN
            RETURN TRUE;
        END IF;
    ELSE
        -- Normal daytime hours (e.g. 11:00 to 22:00)
        IF t >= settings.open_time AND t <= settings.close_time THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- If outside hours, check if late ordering is allowed
    RETURN settings.allow_late_ordering;
END;
$$ LANGUAGE plpgsql STABLE;

--------------------------------------------------------------------------------
-- TRUSTED SERVER-SIDE ORDER CALCULATION & CREATION RPC (Rules 1, 4, 5, 6, 7, 8, 9, 11, 14, 31, 32)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_order_type order_type,
    p_payment_method TEXT,
    p_items JSONB, -- Array of { "menu_item_id": UUID, "quantity": INT }
    p_coupon_code TEXT DEFAULT NULL,
    p_delivery_address JSONB DEFAULT NULL,
    p_table_number INT DEFAULT NULL,
    p_customer_notes TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_settings RECORD;
    v_item JSONB;
    v_menu_item RECORD;
    v_subtotal NUMERIC(10,2) := 0.00;
    v_discount NUMERIC(10,2) := 0.00;
    v_tax NUMERIC(10,2) := 0.00;
    v_delivery_fee NUMERIC(10,2) := 0.00;
    v_total NUMERIC(10,2) := 0.00;
    v_coupon RECORD;
    v_order_id UUID;
    v_order_number TEXT;
    v_existing_order_id UUID;
    v_item_qty INT;
    v_item_id UUID;
BEGIN
    -- 1. Must be authenticated
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to place an order (Rule 2)';
    END IF;

    -- 2. Idempotency Check (Rule 32)
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, order_number INTO v_existing_order_id, v_order_number
        FROM public.orders WHERE idempotency_key = p_idempotency_key;
        IF v_existing_order_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'status', 'success',
                'order_id', v_existing_order_id,
                'order_number', v_order_number,
                'message', 'Duplicate request handled idempotently'
            );
        END IF;
    END IF;

    -- 3. Load Restaurant Settings
    SELECT * INTO v_settings FROM public.restaurant_settings WHERE id = 1;

    -- 4. Restaurant Operating Check (Rule 1)
    IF NOT public.is_restaurant_open_at(now()) THEN
        IF NOT (v_settings.operating_status = 'accepting_preorders' OR v_settings.allow_advance_ordering) THEN
            RAISE EXCEPTION 'Midnight Feast is currently closed for orders. Operating hours are % to % (Rule 1)', 
                v_settings.open_time, v_settings.close_time;
        END IF;
    END IF;

    -- 5. Order Type Validation (Rule 11)
    IF p_order_type = 'delivery' AND NOT v_settings.enable_delivery THEN
        RAISE EXCEPTION 'Delivery orders are currently not accepted by the restaurant';
    ELSIF p_order_type = 'pickup' AND NOT v_settings.enable_pickup THEN
        RAISE EXCEPTION 'Pickup orders are currently not accepted by the restaurant';
    ELSIF p_order_type = 'dine_in' AND NOT v_settings.enable_dinein THEN
        RAISE EXCEPTION 'Dine-in orders are currently not accepted by the restaurant';
    END IF;

    IF p_order_type = 'delivery' AND (p_delivery_address IS NULL OR p_delivery_address = '{}'::jsonb) THEN
        RAISE EXCEPTION 'Valid delivery address required for delivery orders (Rule 10)';
    END IF;

    IF p_order_type = 'dine_in' AND p_table_number IS NULL THEN
        RAISE EXCEPTION 'Table number required for dine-in orders (Rule 11)';
    END IF;

    -- 6. Items Validation & Authoritative Price Recalculation (Rule 4, 5, 7)
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart cannot be empty';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id := (v_item->>'menu_item_id')::UUID;
        v_item_qty := (v_item->>'quantity')::INT;

        IF v_item_qty <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero (Rule 7)';
        END IF;
        IF v_item_qty > 20 THEN
            RAISE EXCEPTION 'Item quantity exceeds maximum allowed per item (Rule 7)';
        END IF;

        -- Fetch authoritative item from database
        SELECT * INTO v_menu_item FROM public.menu_items WHERE id = v_item_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Menu item not found: %', v_item_id;
        END IF;

        -- Availability check (Rule 4)
        IF v_menu_item.availability <> 'available' THEN
            RAISE EXCEPTION 'Item "%" is currently unavailable or hidden and cannot be ordered (Rule 4)', v_menu_item.name;
        END IF;

        -- Check inventory if tracked (Rule 25)
        IF v_menu_item.is_inventory_tracked THEN
            IF v_menu_item.stock_quantity < v_item_qty THEN
                RAISE EXCEPTION 'Insufficient stock for "%". Only % available (Rule 25)', 
                    v_menu_item.name, v_menu_item.stock_quantity;
            END IF;
        END IF;

        v_subtotal := v_subtotal + (v_menu_item.price * v_item_qty);
    END LOOP;

    -- 7. Minimum Order Check (Rule 8)
    IF v_subtotal < v_settings.min_order_amount THEN
        RAISE EXCEPTION 'Subtotal ₹% is below the restaurant minimum order amount of ₹% (Rule 8)', 
            v_subtotal, v_settings.min_order_amount;
    END IF;

    -- 8. Coupon / Discount Calculation (Rule 22)
    IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon FROM public.coupons 
        WHERE code = upper(trim(p_coupon_code)) AND is_active = true;

        IF FOUND THEN
            IF now() >= v_coupon.start_date AND now() <= v_coupon.expiry_date THEN
                IF v_subtotal >= v_coupon.min_order_amount THEN
                    IF v_coupon.usage_limit IS NULL OR v_coupon.times_used < v_coupon.usage_limit THEN
                        IF v_coupon.discount_type = 'percentage' THEN
                            v_discount := round((v_subtotal * v_coupon.discount_value / 100.0), 2);
                            IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
                                v_discount := v_coupon.max_discount_amount;
                            END IF;
                        ELSE
                            v_discount := v_coupon.discount_value;
                        END IF;
                        -- Discount cannot exceed subtotal
                        IF v_discount > v_subtotal THEN
                            v_discount := v_subtotal;
                        END IF;

                        -- Increment coupon usage
                        UPDATE public.coupons SET times_used = times_used + 1 WHERE id = v_coupon.id;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;

    -- 9. Tax Calculation (Rule 6: Configurable percentage, never hardcoded)
    v_tax := round(((v_subtotal - v_discount) * v_settings.tax_percentage / 100.0), 2);
    IF v_tax < 0 THEN v_tax := 0; END IF;

    -- 10. Delivery Fee Calculation (Rule 9: Configurable threshold)
    IF p_order_type = 'delivery' THEN
        IF v_subtotal >= v_settings.free_delivery_threshold THEN
            v_delivery_fee := 0.00;
        ELSE
            v_delivery_fee := v_settings.delivery_fee;
        END IF;
    ELSE
        v_delivery_fee := 0.00;
    END IF;

    -- 11. Authoritative Final Total (Rule 5)
    v_total := (v_subtotal - v_discount) + v_tax + v_delivery_fee;

    -- Generate readable order number
    v_order_number := 'MF-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5));

    -- 12. Insert Order
    INSERT INTO public.orders (
        order_number,
        customer_id,
        order_type,
        order_status,
        payment_status,
        payment_method,
        idempotency_key,
        subtotal,
        discount_amount,
        applied_coupon_code,
        tax_amount,
        delivery_fee,
        total_amount,
        delivery_address,
        table_number,
        customer_notes
    ) VALUES (
        v_order_number,
        v_user_id,
        p_order_type,
        'pending',
        CASE WHEN p_payment_method IN ('cash_on_delivery', 'pay_at_restaurant') THEN 'pending' ELSE 'pending' END,
        p_payment_method,
        p_idempotency_key,
        v_subtotal,
        v_discount,
        p_coupon_code,
        v_tax,
        v_delivery_fee,
        v_total,
        p_delivery_address,
        p_table_number,
        p_customer_notes
    ) RETURNING id INTO v_order_id;

    -- 13. Insert Order Items & Deduct Inventory if tracked (Rule 25)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id := (v_item->>'menu_item_id')::UUID;
        v_item_qty := (v_item->>'quantity')::INT;
        SELECT * INTO v_menu_item FROM public.menu_items WHERE id = v_item_id;

        INSERT INTO public.order_items (
            order_id,
            menu_item_id,
            item_name,
            item_price,
            quantity,
            total_price
        ) VALUES (
            v_order_id,
            v_item_id,
            v_menu_item.name,
            v_menu_item.price,
            v_item_qty,
            (v_menu_item.price * v_item_qty)
        );

        IF v_menu_item.is_inventory_tracked THEN
            UPDATE public.menu_items 
            SET stock_quantity = stock_quantity - v_item_qty 
            WHERE id = v_item_id;
        END IF;
    END LOOP;

    -- 14. Record Initial Status in History (Rule 13)
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by_user_id,
        notes
    ) VALUES (
        v_order_id,
        NULL,
        'pending',
        v_user_id,
        'Order created successfully'
    );

    -- 15. Create Customer Notification (Rule 34)
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        v_user_id,
        'Order Received: ' || v_order_number,
        'Your Midnight Feast order has been placed and is currently pending confirmation.',
        'order_status'
    );

    RETURN jsonb_build_object(
        'status', 'success',
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'tax', v_tax,
        'delivery_fee', v_delivery_fee,
        'total', v_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- CUSTOMER ORDER CANCELLATION RPC (Rule 13: strictly only when Pending)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.customer_cancel_order(
    p_order_id UUID,
    p_reason TEXT DEFAULT 'Cancelled by customer'
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_user_id UUID;
    v_item RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Security: Only order owner or staff can cancel
    IF v_order.customer_id <> v_user_id AND NOT public.is_staff() THEN
        RAISE EXCEPTION 'Access Denied: You can only cancel your own orders (Rule 2, 26)';
    END IF;

    -- Strict Rule 13: Customer cancellation is strictly allowed ONLY in 'pending' state
    IF v_order.order_status <> 'pending' THEN
        RAISE EXCEPTION 'Order cancellation disabled: Food preparation has already started (Current status: %) (Rule 13)', v_order.order_status;
    END IF;

    -- Update order status
    UPDATE public.orders 
    SET order_status = 'cancelled_by_customer',
        cancellation_reason = p_reason,
        updated_at = now()
    WHERE id = p_order_id;

    -- Restore inventory if tracked (Rule 25)
    FOR v_item IN SELECT menu_item_id, quantity FROM public.order_items WHERE order_id = p_order_id
    LOOP
        UPDATE public.menu_items 
        SET stock_quantity = stock_quantity + v_item.quantity 
        WHERE id = v_item.menu_item_id AND is_inventory_tracked = true;
    END LOOP;

    -- Status history
    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, changed_by_user_id, notes
    ) VALUES (
        p_order_id, 'pending', 'cancelled_by_customer', v_user_id, p_reason
    );

    -- Notification
    INSERT INTO public.notifications (
        user_id, title, message, type
    ) VALUES (
        v_order.customer_id,
        'Order Cancelled: ' || v_order.order_number,
        'Your order has been cancelled.',
        'order_status'
    );

    RETURN jsonb_build_object('status', 'success', 'order_id', p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- OPERATIONAL STATUS UPDATE RPC (Rule 13: Staff / Admin only)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_order_status_operational(
    p_order_id UUID,
    p_new_status order_status,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_user_id UUID;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Access Denied: Only staff or administrators can update operational order status (Rule 3, 13)';
    END IF;

    v_user_id := auth.uid();
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    UPDATE public.orders
    SET order_status = p_new_status,
        updated_at = now()
    WHERE id = p_order_id;

    -- Record status history
    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, changed_by_user_id, notes
    ) VALUES (
        p_order_id, v_order.order_status, p_new_status, v_user_id, p_notes
    );

    -- Customer notification (Rule 34)
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        v_order.customer_id,
        'Order Status Update: ' || v_order.order_number,
        'Your order is now: ' || upper(replace(p_new_status::text, '_', ' ')),
        'order_status'
    );

    RETURN jsonb_build_object('status', 'success', 'order_id', p_order_id, 'new_status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- RESERVATION VALIDATION TRIGGER (Rule 17, 18, 19)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS TRIGGER AS $$
DECLARE
    settings RECORD;
    existing_guests INT;
BEGIN
    SELECT * INTO settings FROM public.restaurant_settings WHERE id = 1;

    -- 1. Prevent past dates (Rule 18)
    IF NEW.reservation_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Reservations cannot be made for past dates (Rule 18)';
    END IF;

    -- 2. Guest count limit
    IF NEW.guest_count > settings.max_guests_per_reservation THEN
        RAISE EXCEPTION 'Reservation guest count (%) exceeds maximum permitted (% per reservation) (Rule 18)',
            NEW.guest_count, settings.max_guests_per_reservation;
    END IF;

    -- 3. Business hours check for reservation time
    IF settings.open_time > settings.close_time THEN
        IF NOT (NEW.reservation_time >= settings.open_time OR NEW.reservation_time <= settings.close_time) THEN
            RAISE EXCEPTION 'Reservations are only permitted during restaurant operating hours (% - %) (Rule 18)',
                settings.open_time, settings.close_time;
        END IF;
    ELSE
        IF NOT (NEW.reservation_time >= settings.open_time AND NEW.reservation_time <= settings.close_time) THEN
            RAISE EXCEPTION 'Reservations are only permitted during restaurant operating hours (% - %) (Rule 18)',
                settings.open_time, settings.close_time;
        END IF;
    END IF;

    -- 4. Check double booking capacity
    SELECT COALESCE(SUM(guest_count), 0) INTO existing_guests
    FROM public.reservations
    WHERE reservation_date = NEW.reservation_date
      AND reservation_time = NEW.reservation_time
      AND status IN ('pending', 'confirmed')
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF (existing_guests + NEW.guest_count) > settings.seating_capacity THEN
        RAISE EXCEPTION 'Restaurant seating capacity reached for this time slot (Rule 18)';
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_reservation ON public.reservations;
CREATE TRIGGER trigger_validate_reservation
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_reservation();

--------------------------------------------------------------------------------
-- AUDIT LOGGING TRIGGERS (Rule 30)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user UUID;
    v_action TEXT;
    v_res_id TEXT;
BEGIN
    v_user := auth.uid();
    v_action := TG_OP;

    IF TG_OP = 'DELETE' THEN
        v_res_id := OLD.id::text;
        INSERT INTO public.audit_logs (user_id, action, resource, resource_id, old_data, new_data)
        VALUES (v_user, v_action, TG_TABLE_NAME, v_res_id, to_jsonb(OLD), NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        v_res_id := NEW.id::text;
        INSERT INTO public.audit_logs (user_id, action, resource, resource_id, old_data, new_data)
        VALUES (v_user, v_action, TG_TABLE_NAME, v_res_id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        v_res_id := NEW.id::text;
        INSERT INTO public.audit_logs (user_id, action, resource, resource_id, old_data, new_data)
        VALUES (v_user, v_action, TG_TABLE_NAME, v_res_id, NULL, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_menu_items ON public.menu_items;
CREATE TRIGGER audit_menu_items
    AFTER INSERT OR UPDATE OR DELETE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

DROP TRIGGER IF EXISTS audit_restaurant_settings ON public.restaurant_settings;
CREATE TRIGGER audit_restaurant_settings
    AFTER UPDATE ON public.restaurant_settings
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES (Rule 2, 3, 26, 27, 28, 31)
--------------------------------------------------------------------------------

-- Enable RLS on every single table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Public profiles viewable by self and staff"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_staff());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile (role locked by trigger)"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

-- 2. Restaurant Settings (Rule 29: viewable by everyone, editable by admin)
CREATE POLICY "Settings viewable by everyone"
    ON public.restaurant_settings FOR SELECT
    USING (true);

CREATE POLICY "Settings editable only by Admin"
    ON public.restaurant_settings FOR UPDATE
    USING (public.is_admin());

-- 3. Categories (viewable by everyone, managed by admin)
CREATE POLICY "Categories viewable by everyone"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Categories managed by Admin"
    ON public.categories FOR ALL
    USING (public.is_admin());

-- 4. Menu Items (Rule 4: Hidden items cannot be seen by public)
CREATE POLICY "Menu items viewable by public if not hidden or if staff"
    ON public.menu_items FOR SELECT
    USING (availability <> 'hidden' OR public.is_staff());

CREATE POLICY "Menu availability manageable by staff and admin"
    ON public.menu_items FOR UPDATE
    USING (public.is_staff());

CREATE POLICY "Menu items full CRUD by Admin"
    ON public.menu_items FOR ALL
    USING (public.is_admin());

-- 5. User Addresses (Rule 26: Only user themselves)
CREATE POLICY "Users manage own addresses"
    ON public.user_addresses FOR ALL
    USING (auth.uid() = user_id);

-- 6. Coupons (Rule 22: Viewable by authenticated, manageable by Admin)
CREATE POLICY "Coupons viewable by authenticated"
    ON public.coupons FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Coupons managed by Admin"
    ON public.coupons FOR ALL
    USING (public.is_admin());

-- 7. Orders (Rule 2, 26, 33: Customers view only own orders; staff view all)
CREATE POLICY "Orders viewable by owner or staff"
    ON public.orders FOR SELECT
    USING (auth.uid() = customer_id OR public.is_staff());

CREATE POLICY "Orders updatable by staff only"
    ON public.orders FOR UPDATE
    USING (public.is_staff());

-- 8. Order Items (Rule 26)
CREATE POLICY "Order items viewable by order owner or staff"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
              AND (orders.customer_id = auth.uid() OR public.is_staff())
        )
    );

-- 9. Order Status History (Rule 13, 26)
CREATE POLICY "Order status history viewable by order owner or staff"
    ON public.order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_status_history.order_id
              AND (orders.customer_id = auth.uid() OR public.is_staff())
        )
    );

-- 10. Reservations (Rule 2, 17, 26)
CREATE POLICY "Reservations viewable by owner or staff"
    ON public.reservations FOR SELECT
    USING (auth.uid() = customer_id OR public.is_staff());

CREATE POLICY "Reservations insertable by authenticated users"
    ON public.reservations FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Reservations manageable by staff"
    ON public.reservations FOR UPDATE
    USING (auth.uid() = customer_id OR public.is_staff());

-- 11. Reviews (Rule 20: approved viewable by public, user views own, staff moderate)
CREATE POLICY "Reviews viewable if approved, or by author, or staff"
    ON public.reviews FOR SELECT
    USING (status = 'approved' OR auth.uid() = customer_id OR public.is_staff());

CREATE POLICY "Authenticated users can submit review for their completed orders"
    ON public.reviews FOR INSERT
    WITH CHECK (
        auth.uid() = customer_id 
        AND EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = reviews.order_id
              AND orders.customer_id = auth.uid()
              AND orders.order_status = 'completed'
        )
    );

CREATE POLICY "Staff can moderate reviews"
    ON public.reviews FOR UPDATE
    USING (public.is_staff());

-- 12. Favorites (Rule 21)
CREATE POLICY "Users manage own favorites"
    ON public.favorites FOR ALL
    USING (auth.uid() = user_id);

-- 13. Audit Logs (Rule 30: Admin only)
CREATE POLICY "Audit logs viewable only by Admin"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

-- 14. Notifications (Rule 34: Owner only)
CREATE POLICY "Users manage own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);
