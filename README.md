# SITA Bot Backend

Backend API para SITA Bot usando Express.js y AWS Services.

## Instalación en EC2

1. Conectarse a la instancia EC2 Backend (vía SSH jump desde Frontend)
2. Clonar el repositorio
3. Configurar variables de entorno (`.env`)
4. Ejecutar el script de despliegue:

\`\`\`bash
chmod +x deploy.sh
./deploy.sh
\`\`\`

## Variables de Entorno

Todas las variables están pre-configuradas en `.env` para producción.

## Endpoints

- `GET /health` - Health check
- `POST /api/chat` - Enviar mensaje y recibir respuesta
- `GET /api/chats` - Cargar historial de chats
- `POST /api/chats/save` - Guardar chat en S3
- `GET /api/credits` - Obtener créditos del usuario
- `POST /api/subscription/upgrade` - Mejorar plan de suscripción
