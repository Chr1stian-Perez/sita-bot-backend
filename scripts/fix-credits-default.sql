-- Actualizar el default de la columna credits a 50
ALTER TABLE user_credits 
  ALTER COLUMN credits SET DEFAULT 50;

-- Actualizar el usuario de prueba a 50 créditos
UPDATE user_credits 
SET credits = 50 
WHERE user_id = 'test-user-123';

-- Verificar los cambios
SELECT * FROM user_credits;
