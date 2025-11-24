# MinIO local (S3 compatible)

Arranca un MinIO local para subir archivos (p. ej. avatares) y crear un bucket público.

## Uso rápido
1) Copia envs: `cp .env.example .env` y ajusta credenciales/bucket.
2) Levanta servicios: `docker compose up -d` (desde esta carpeta).
3) Consola web: http://localhost:9001 (usa `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`).
4) API S3-compatible: http://localhost:9000.

El servicio `create-bucket` crea el bucket indicado (`MINIO_BUCKET`) y lo marca público (lectura anónima). Ajusta la política según tus necesidades de seguridad.

## Integración con la app
- Endpoint base para clientes S3: usa `MINIO_ENDPOINT` (`http://localhost:9000`) con `forcePathStyle=true` en SDKs AWS.
- Bucket por defecto: `avatars` (cámbialo en `.env`).
- Ejemplo de URL pública resultante: `http://localhost:9000/avatars/<key>`. En producción deberías servir detrás de un reverse proxy/HTTPS y usar políticas más restrictivas o URLs firmadas.
