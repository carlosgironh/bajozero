-- ====================================================================
-- ESTRUCTURA DE BASE DE DATOS BAJO ZERO
-- ====================================================================

-- 1. TABLA DE PERFILES (Unificando Admins, Secretarias y Técnicos)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'tecnico' CHECK (role IN ('tecnico', 'secretaria', 'administrador')),
    is_active BOOLEAN DEFAULT true,
    specialty TEXT, -- Opcional para técnicos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Visibilidad de perfiles" 
ON public.profiles FOR SELECT TO authenticated 
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrador', 'secretaria')));

CREATE POLICY "Solo administradores pueden insertar perfiles" 
ON public.profiles FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador'));

CREATE POLICY "Administradores pueden actualizar perfiles" 
ON public.profiles FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador'));


-- 2. TABLA DE CLIENTES
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name TEXT NOT NULL,
    company_name TEXT,
    ruc TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    ruc TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver clientes" 
ON public.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura publica de clientes para QR" 
ON public.clients FOR SELECT TO anon USING (true);

CREATE POLICY "Admin/Secre pueden insertar clientes" 
ON public.clients FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrador', 'secretaria')));

CREATE POLICY "Admin/Secre pueden actualizar clientes" 
ON public.clients FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrador', 'secretaria')));


-- 3. TABLA DE INSPECCIONES
CREATE TABLE public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_number TEXT UNIQUE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'asignada', 'completada')),
    scheduled_date DATE,
    completion_date TEXT,
    completion_time TEXT,
    technical_data JSONB DEFAULT '[]'::jsonb, -- AQUI SE GUARDAN LOS MÚLTIPLES MODELOS
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Políticas para Inspecciones
-- Admin/Secretaria ven todo. Técnico ve solo las asignadas a él.
CREATE POLICY "Visibilidad de inspecciones según rol" 
ON public.inspections FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrador', 'secretaria'))
    OR inspector_id = auth.uid()
);

CREATE POLICY "Admin/Secretaria pueden crear inspecciones" 
ON public.inspections FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrador', 'secretaria')));

CREATE POLICY "Actualización de inspecciones según rol" 
ON public.inspections FOR UPDATE TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrador', 'secretaria'))
    OR inspector_id = auth.uid()
);

-- ====================================================================
-- TABLAS ADICIONALES (Cotizador / Control)
-- ====================================================================

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write for products" ON public.products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador'));


CREATE TABLE public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total NUMERIC(10, 2),
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their quotes or admins" ON public.quotes FOR ALL TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador'));


CREATE TABLE public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage quote items" ON public.quote_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.quotes WHERE id = quote_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'administrador'))));

-- ====================================================================
-- TRIGGERS Y FUNCIONES
-- ====================================================================

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'tecnico');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IMPORTANTE: Debes ejecutar esto en el SQL Editor para habilitar el trigger
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================================
-- SYSTEM SETTINGS
-- ====================================================================
CREATE TABLE public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    inactivity_timeout_minutes INTEGER NOT NULL DEFAULT 15,
    CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for system_settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write for system_settings" ON public.system_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'));
CREATE POLICY "Admin insert for system_settings" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'));

-- ====================================================================
-- FUNCIONES RPC DE ADMINISTRACIÓN (TÉCNICOS / PERSONAL)
-- ====================================================================

-- 1. Eliminar Personal / Técnico
CREATE OR REPLACE FUNCTION public.delete_technician(p_technician_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_tech_role TEXT;
    v_caller_role TEXT;
BEGIN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role NOT IN ('superadmin', 'coordinador', 'administrador') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permiso denegado.');
    END IF;
    SELECT role INTO v_tech_role FROM public.profiles WHERE id = p_technician_id;
    IF v_tech_role IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado.');
    END IF;
    IF v_tech_role IN ('superadmin', 'coordinador', 'administrador') THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se puede eliminar a un administrador.');
    END IF;
    DELETE FROM auth.users WHERE id = p_technician_id;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;
REVOKE ALL ON FUNCTION public.delete_technician(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_technician(UUID) TO authenticated;

-- 2. Restablecer / Cambiar Contraseña de Personal
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE FUNCTION public.admin_reset_password(p_user_id UUID, p_new_password TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions AS $$
DECLARE
    v_caller_role TEXT;
    v_target_email TEXT;
BEGIN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF auth.uid() != p_user_id AND (v_caller_role IS NULL OR v_caller_role NOT IN ('superadmin', 'coordinador', 'administrador')) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permiso denegado: solo administradores pueden cambiar contraseñas.');
    END IF;
    IF length(p_new_password) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'La contraseña debe tener un mínimo de 6 caracteres.');
    END IF;
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = NOW()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;
REVOKE ALL ON FUNCTION public.admin_reset_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(UUID, TEXT) TO authenticated;
