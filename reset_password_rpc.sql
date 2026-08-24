-- ====================================================================
-- FUNCIÓN RPC: admin_reset_password
-- Ejecutar en el SQL Editor de Supabase
-- ====================================================================
-- Esta función permite a los administradores / coordinadores restablecer
-- la contraseña de cualquier usuario de personal (técnicos, asistentes, supervisores)
-- en caso de olvido o pérdida de acceso.
-- Requiere SECURITY DEFINER y la extensión pgcrypto (nativa en Supabase).
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_reset_password(
    p_user_id UUID,
    p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_caller_role TEXT;
    v_target_role TEXT;
    v_target_email TEXT;
BEGIN
    -- 1. Verificar que el invocador sea superadmin, coordinador o administrador
    --    o el mismo usuario actualizando su propia cuenta
    SELECT role INTO v_caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF auth.uid() != p_user_id AND (v_caller_role IS NULL OR v_caller_role NOT IN ('superadmin', 'coordinador', 'administrador')) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permiso denegado: solo administradores pueden restablecer contraseñas.');
    END IF;

    -- 2. Validar que el usuario objetivo exista
    SELECT role, email INTO v_target_role, v_target_email
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_target_email IS NULL THEN
        -- Buscar directamente en auth.users si no estuviera en profiles
        SELECT email INTO v_target_email
        FROM auth.users
        WHERE id = p_user_id;
        
        IF v_target_email IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado en el sistema.');
        END IF;
    END IF;

    -- 3. Validar longitud mínima
    IF length(p_new_password) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'La contraseña debe tener un mínimo de 6 caracteres.');
    END IF;

    -- 4. Actualizar la contraseña en auth.users
    UPDATE auth.users
    SET 
        encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Contraseña actualizada exitosamente.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Permisos de ejecución
REVOKE ALL ON FUNCTION public.admin_reset_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(UUID, TEXT) TO authenticated;
