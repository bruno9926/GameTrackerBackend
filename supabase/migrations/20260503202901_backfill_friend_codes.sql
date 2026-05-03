-- 1. Creamos una función para generar el código aleatorio (equivalente a tu nanoid)
CREATE OR REPLACE FUNCTION generate_friend_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generar 10 caracteres aleatorios
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  -- Formatear con el guion en medio (XXXXX-XXXXX) como tenías en tu JS
  RETURN substr(result, 1, 5) || '-' || substr(result, 6, 5);
END;
$$ LANGUAGE plpgsql;

-- 2. Ejecutamos el Backfill con un loop en SQL
DO $$
DECLARE
  user_record RECORD;
  new_code TEXT;
  exists_code BOOLEAN;
BEGIN
  FOR user_record IN SELECT id FROM "user" WHERE "friendCode" IS NULL LOOP
    LOOP
      new_code := generate_friend_code();
      -- Verificar si el código ya existe
      SELECT EXISTS(SELECT 1 FROM "user" WHERE "friendCode" = new_code) INTO exists_code;
      EXIT WHEN NOT exists_code; -- Si no existe, salimos del loop de generación
    END LOOP;

    -- Actualizar al usuario
    UPDATE "user" SET "friendCode" = new_code WHERE id = user_record.id;
  END LOOP;
END $$;

-- 3. (Opcional) Borrar la función si no la volverás a usar
-- DROP FUNCTION generate_friend_code();