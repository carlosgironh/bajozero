-- ====================================================================
-- FUNCIÓN RPC: delete_technician
-- Ejecutar en el SQL Editor de Supabase
-- ====================================================================
-- Esta función elimina un usuario de personal del sistema de forma permanente.
-- Al borrar el usuario de auth.users, el perfil en public.profiles se elimina
-- automáticamente gracias a la restricción ON DELETE CASCADE.
-- Requiere SECURITY DEFINER para poder invocar auth.admin_api (pgcrypto).
-- ====================================================================

CREATE OR REPLACE FUNCTION public.delete_technician(
    p_technician_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tech_role TEXT;
    v_caller_role TEXT;
BEGIN
    -- 1. Verificar que el invocador es superadmin o coordinador
    SELECT role INTO v_caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_caller_role NOT IN ('superadmin', 'coordinador', 'administrador') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permiso denegado: solo administradores pueden eliminar personal.');
    END IF;

    -- 2. Obtener el rol del tecnico a eliminar (para evitar eliminar admins)
    SELECT role INTO v_tech_role
    FROM public.profiles
    WHERE id = p_technician_id;

    IF v_tech_role IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado.');
    END IF;

    IF v_tech_role IN ('superadmin', 'coordinador', 'administrador') THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se puede eliminar a un administrador o coordinador desde esta funcion.');
    END IF;

    -- 3. Eliminar el usuario de auth.users
    --    El perfil en public.profiles se elimina automaticamente (ON DELETE CASCADE)
    DELETE FROM auth.users WHERE id = p_technician_id;

    RETURN jsonb_build_object('success', true);

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Revocar acceso publico y otorgar solo a usuarios autenticados
REVOKE ALL ON FUNCTION public.delete_technician(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_technician(UUID) TO authenticated;
