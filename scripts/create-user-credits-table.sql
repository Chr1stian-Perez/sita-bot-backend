-- Crear tabla de créditos por usuario
CREATE TABLE IF NOT EXISTS user_credits (
    user_id VARCHAR(255) PRIMARY KEY,
    credits INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_user_id ON user_credits(user_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuario de prueba
INSERT INTO user_credits (user_id, credits) 
VALUES ('test-user-123', 1000)
ON CONFLICT (user_id) DO NOTHING;

-- Verificar
SELECT * FROM user_credits;
