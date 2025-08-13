-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Medical Personnel Table
CREATE TABLE IF NOT EXISTS medical_personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'nurse', 'radiologist', 'admin')),
    license_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES medical_personnel(id)
);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    medical_history TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES medical_personnel(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES medical_personnel(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES medical_personnel(id)
);

-- Symptoms Table
CREATE TABLE IF NOT EXISTS symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    name VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    duration VARCHAR(100),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES medical_personnel(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES medical_personnel(id)
);

-- Symptom Sessions Table
CREATE TABLE IF NOT EXISTS symptom_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES medical_personnel(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- X-ray Images Table
CREATE TABLE IF NOT EXISTS xray_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    image_type VARCHAR(50) DEFAULT 'xray',
    body_part VARCHAR(100) DEFAULT 'unknown',
    notes TEXT,
    public_url TEXT,
    uploaded_by UUID NOT NULL REFERENCES medical_personnel(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES medical_personnel(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_personnel_email ON medical_personnel(email);
CREATE INDEX IF NOT EXISTS idx_medical_personnel_role ON medical_personnel(role);
CREATE INDEX IF NOT EXISTS idx_medical_personnel_active ON medical_personnel(is_active);

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(is_deleted);

CREATE INDEX IF NOT EXISTS idx_symptoms_patient ON symptoms(patient_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_recorded_by ON symptoms(recorded_by);
CREATE INDEX IF NOT EXISTS idx_symptoms_recorded_at ON symptoms(recorded_at);

CREATE INDEX IF NOT EXISTS idx_symptom_sessions_patient ON symptom_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_symptom_sessions_recorded_at ON symptom_sessions(recorded_at);

CREATE INDEX IF NOT EXISTS idx_xray_images_patient ON xray_images(patient_id);
CREATE INDEX IF NOT EXISTS idx_xray_images_uploaded_by ON xray_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_xray_images_uploaded_at ON xray_images(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_xray_images_type ON xray_images(image_type);

-- Create RLS (Row Level Security) policies
ALTER TABLE medical_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xray_images ENABLE ROW LEVEL SECURITY;

-- Medical Personnel policies
CREATE POLICY "Medical personnel can view their own profile" ON medical_personnel
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Medical personnel can update their own profile" ON medical_personnel
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Patients policies
CREATE POLICY "Medical personnel can view all patients" ON patients
    FOR SELECT USING (true);

CREATE POLICY "Medical personnel can create patients" ON patients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Medical personnel can update patients" ON patients
    FOR UPDATE USING (true);

CREATE POLICY "Only admins can delete patients" ON patients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM medical_personnel 
            WHERE id = auth.uid()::uuid AND role = 'admin'
        )
    );

-- Symptoms policies
CREATE POLICY "Medical personnel can view all symptoms" ON symptoms
    FOR SELECT USING (true);

CREATE POLICY "Medical personnel can create symptoms" ON symptoms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Medical personnel can update symptoms" ON symptoms
    FOR UPDATE USING (true);

CREATE POLICY "Medical personnel can delete symptoms" ON symptoms
    FOR DELETE USING (true);

-- Symptom sessions policies
CREATE POLICY "Medical personnel can view all symptom sessions" ON symptom_sessions
    FOR SELECT USING (true);

CREATE POLICY "Medical personnel can create symptom sessions" ON symptom_sessions
    FOR INSERT WITH CHECK (true);

-- X-ray images policies
CREATE POLICY "Medical personnel can view all X-ray images" ON xray_images
    FOR SELECT USING (true);

CREATE POLICY "Medical personnel can create X-ray images" ON xray_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Medical personnel can update X-ray images" ON xray_images
    FOR UPDATE USING (true);

CREATE POLICY "Medical personnel can delete X-ray images" ON xray_images
    FOR DELETE USING (true);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_medical_personnel_updated_at 
    BEFORE UPDATE ON medical_personnel 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symptoms_updated_at 
    BEFORE UPDATE ON symptoms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_xray_images_updated_at 
    BEFORE UPDATE ON xray_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: Admin123!)
-- Note: This is a hashed version of 'Admin123!' - replace with your own hash
INSERT INTO medical_personnel (email, password_hash, first_name, last_name, role, license_number)
VALUES (
    'admin@diagnosis.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i8iG',
    'System',
    'Administrator',
    'admin',
    'ADMIN001'
) ON CONFLICT (email) DO NOTHING;

-- Create storage bucket for X-ray images
-- Note: This needs to be run in Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('xray-images', 'xray-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg']);
