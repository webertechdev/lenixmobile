-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read access" ON users;
DROP POLICY IF EXISTS "Allow authenticated read access" ON customers;
DROP POLICY IF EXISTS "Allow authenticated read access" ON technicians;
DROP POLICY IF EXISTS "Allow authenticated read access" ON repairs;
DROP POLICY IF EXISTS "Allow authenticated read access" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated read access" ON repair_parts;
DROP POLICY IF EXISTS "Allow authenticated read access" ON status_history;
DROP POLICY IF EXISTS "Allow authenticated read access" ON audit_log;

-- Users Policies
-- Authenticated users can view all users (needed for admin checks)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (auth.role() = 'authenticated');
-- Authenticated users can insert their own profile (needed for sync-user on first login)
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = supabase_id);
-- Admins can update all users (for promote-me)
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE supabase_id = auth.uid()::text AND role = 'admin'));

-- Customers Policies
CREATE POLICY "Authenticated users can view customers" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage customers" ON customers FOR ALL USING (auth.role() = 'authenticated');

-- Technicians Policies
CREATE POLICY "Authenticated users can view technicians" ON technicians FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage technicians" ON technicians FOR ALL USING (auth.role() = 'authenticated');

-- Repairs Policies
CREATE POLICY "Authenticated users can view repairs" ON repairs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage repairs" ON repairs FOR ALL USING (auth.role() = 'authenticated');

-- Inventory Policies
CREATE POLICY "Authenticated users can view inventory" ON inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage inventory" ON inventory FOR ALL USING (auth.role() = 'authenticated');

-- Repair Parts Policies
CREATE POLICY "Authenticated users can view repair parts" ON repair_parts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage repair parts" ON repair_parts FOR ALL USING (auth.role() = 'authenticated');

-- Status History Policies
CREATE POLICY "Authenticated users can view status history" ON status_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage status history" ON status_history FOR ALL USING (auth.role() = 'authenticated');

-- Audit Log Policies
-- All authenticated users can view audit logs (admin visibility)
CREATE POLICY "Authenticated users can view audit logs" ON audit_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert audit logs" ON audit_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Storage Setup
-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('repair-images', 'repair-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-photos', 'customer-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory-images', 'inventory-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id IN ('repair-images', 'customer-photos', 'inventory-images'));
CREATE POLICY "Authenticated Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('repair-images', 'customer-photos', 'inventory-images') AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Update/Delete Access" ON storage.objects FOR UPDATE USING (bucket_id IN ('repair-images', 'customer-photos', 'inventory-images') AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Delete Access" ON storage.objects FOR DELETE USING (bucket_id IN ('repair-images', 'customer-photos', 'inventory-images') AND auth.role() = 'authenticated');
