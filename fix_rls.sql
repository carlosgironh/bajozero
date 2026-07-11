-- ====================================================================
-- SOLUCIÓN AL ERROR 500: RECURSIÓN INFINITA EN RLS
-- ====================================================================

-- El error 500 ocurre porque la política original hace una consulta a `public.profiles`
-- mientras se está evaluando el acceso a `public.profiles`, creando un bucle infinito.
-- Para solucionarlo, creamos una función "SECURITY DEFINER" que puede leer el rol
-- del usuario sin disparar las políticas de RLS, y luego usamos esa función en las políticas.

-- 1. Crear función para obtener el rol del usuario actual de forma segura
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Eliminar las políticas antiguas que causan problemas
DROP POLICY IF EXISTS "Visibilidad de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Solo administradores pueden insertar perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Administradores pueden actualizar perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin/Secre pueden insertar clientes" ON public.clients;
DROP POLICY IF EXISTS "Admin/Secre pueden actualizar clientes" ON public.clients;
DROP POLICY IF EXISTS "Visibilidad de inspecciones según rol" ON public.inspections;
DROP POLICY IF EXISTS "Admin/Secretaria pueden crear inspecciones" ON public.inspections;
DROP POLICY IF EXISTS "Actualización de inspecciones según rol" ON public.inspections;

-- 3. Crear las nuevas políticas usando la función segura para evitar recursión

-- Políticas para Profiles
CREATE POLICY "Visibilidad de perfiles" 
ON public.profiles FOR SELECT TO authenticated 
USING (id = auth.uid() OR public.get_user_role() IN ('administrador', 'secretaria'));

CREATE POLICY "Solo administradores pueden insertar perfiles" 
ON public.profiles FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() = 'administrador');

CREATE POLICY "Administradores pueden actualizar perfiles" 
ON public.profiles FOR UPDATE TO authenticated 
USING (public.get_user_role() = 'administrador');

-- Políticas para Clientes
CREATE POLICY "Admin/Secre pueden insertar clientes" 
ON public.clients FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('administrador', 'secretaria'));

CREATE POLICY "Admin/Secre pueden actualizar clientes" 
ON public.clients FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('administrador', 'secretaria'));

-- Políticas para Inspecciones
CREATE POLICY "Visibilidad de inspecciones según rol" 
ON public.inspections FOR SELECT TO authenticated 
USING (
    public.get_user_role() IN ('administrador', 'secretaria')
    OR inspector_id = auth.uid()
);

CREATE POLICY "Admin/Secretaria pueden crear inspecciones" 
ON public.inspections FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('administrador', 'secretaria'));

CREATE POLICY "Actualización de inspecciones según rol" 
ON public.inspections FOR UPDATE TO authenticated 
USING (
    public.get_user_role() IN ('administrador', 'secretaria')
    OR inspector_id = auth.uid()
);
