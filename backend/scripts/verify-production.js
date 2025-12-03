#!/usr/bin/env node

/**
 * Script de verificación para entorno de producción
 *
 * Este script verifica que todas las configuraciones necesarias
 * estén presentes antes de hacer deploy en producción.
 *
 * Uso:
 *   node scripts/verify-production.js
 *   npm run verify:production
 */

const fs = require('fs');
const path = require('path');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logHeader(message) {
  log(`\n${colors.bold}${message}${colors.reset}`, 'blue');
}

// Cargar variables de entorno
require('dotenv').config();

let hasErrors = false;
let hasWarnings = false;
const errors = [];
const warnings = [];

// Verificaciones
logHeader('🔍 Verificando configuración de producción...');

// 1. Verificar que NODE_ENV sea production
logHeader('\n1. Verificando NODE_ENV');
if (process.env.NODE_ENV === 'production') {
  logSuccess('NODE_ENV está configurado como "production"');
} else {
  const msg = `NODE_ENV debe ser "production" (actual: ${process.env.NODE_ENV || 'no definido'})`;
  logError(msg);
  errors.push(msg);
  hasErrors = true;
}

// 2. Verificar que DB_SYNC esté en false
logHeader('\n2. Verificando DB_SYNC');
if (process.env.DB_SYNC === 'false' || !process.env.DB_SYNC) {
  logSuccess('DB_SYNC está en false (modo migraciones)');
} else {
  const msg = 'DB_SYNC debe ser "false" en producción para usar migraciones';
  logError(msg);
  errors.push(msg);
  hasErrors = true;
}

// 3. Verificar credenciales de base de datos
logHeader('\n3. Verificando configuración de base de datos');
const dbRequiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
dbRequiredVars.forEach((varName) => {
  if (process.env[varName]) {
    logSuccess(`${varName} está definido`);
  } else {
    const msg = `${varName} no está definido`;
    logError(msg);
    errors.push(msg);
    hasErrors = true;
  }
});

// 4. Verificar claves JWT
logHeader('\n4. Verificando seguridad JWT');
const jwtVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
jwtVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    const msg = `${varName} no está definido`;
    logError(msg);
    errors.push(msg);
    hasErrors = true;
  } else if (value.length < 32) {
    const msg = `${varName} debe tener al menos 32 caracteres (actual: ${value.length})`;
    logWarning(msg);
    warnings.push(msg);
    hasWarnings = true;
  } else if (value.includes('temporal') || value.includes('secreta')) {
    const msg = `${varName} parece ser un valor de ejemplo. Use una clave única y segura`;
    logError(msg);
    errors.push(msg);
    hasErrors = true;
  } else {
    logSuccess(`${varName} está configurado correctamente`);
  }
});

// 5. Verificar configuración de email
logHeader('\n5. Verificando configuración de email');
const mailProvider = process.env.MAIL_PROVIDER;
if (!mailProvider) {
  const msg = 'MAIL_PROVIDER no está definido';
  logWarning(msg);
  warnings.push(msg);
  hasWarnings = true;
} else if (mailProvider === 'smtp') {
  const smtpVars = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS'];
  smtpVars.forEach((varName) => {
    if (process.env[varName]) {
      logSuccess(`${varName} está definido`);
    } else {
      const msg = `${varName} no está definido (requerido para MAIL_PROVIDER=smtp)`;
      logError(msg);
      errors.push(msg);
      hasErrors = true;
    }
  });
} else if (mailProvider === 'resend') {
  if (process.env.RESEND_API_KEY) {
    logSuccess('RESEND_API_KEY está definido');
  } else {
    const msg = 'RESEND_API_KEY no está definido (requerido para MAIL_PROVIDER=resend)';
    logError(msg);
    errors.push(msg);
    hasErrors = true;
  }
}

// 6. Verificar configuración de almacenamiento
logHeader('\n6. Verificando configuración de MinIO/S3');
const minioVars = ['MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_ENDPOINT', 'MINIO_BUCKET'];
minioVars.forEach((varName) => {
  if (process.env[varName]) {
    logSuccess(`${varName} está definido`);
  } else {
    const msg = `${varName} no está definido`;
    logWarning(msg);
    warnings.push(msg);
    hasWarnings = true;
  }
});

// 7. Verificar configuración de PayPal
logHeader('\n7. Verificando configuración de PayPal');
if (process.env.PAYPAL_API_URL && process.env.PAYPAL_API_URL.includes('sandbox')) {
  const msg = 'PAYPAL_API_URL apunta a sandbox. En producción debe usar https://api-m.paypal.com';
  logWarning(msg);
  warnings.push(msg);
  hasWarnings = true;
} else {
  logSuccess('PAYPAL_API_URL está configurado para producción');
}

// 8. Verificar frontend URL
logHeader('\n8. Verificando FRONTEND_URL');
if (process.env.FRONTEND_URL) {
  if (process.env.FRONTEND_URL.startsWith('https://')) {
    logSuccess('FRONTEND_URL usa HTTPS');
  } else if (process.env.FRONTEND_URL.startsWith('http://localhost')) {
    const msg = 'FRONTEND_URL apunta a localhost. En producción debe usar el dominio real con HTTPS';
    logWarning(msg);
    warnings.push(msg);
    hasWarnings = true;
  } else {
    const msg = 'FRONTEND_URL debe usar HTTPS en producción';
    logWarning(msg);
    warnings.push(msg);
    hasWarnings = true;
  }
} else {
  const msg = 'FRONTEND_URL no está definido';
  logError(msg);
  errors.push(msg);
  hasErrors = true;
}

// 9. Verificar configuración de Redis
logHeader('\n9. Verificando configuración de Redis');
const redisVars = ['REDIS_HOST', 'REDIS_PORT'];
redisVars.forEach((varName) => {
  if (process.env[varName]) {
    logSuccess(`${varName} está definido`);
  } else {
    const msg = `${varName} no está definido`;
    logWarning(msg);
    warnings.push(msg);
    hasWarnings = true;
  }
});

if (!process.env.REDIS_PASSWORD) {
  const msg = 'REDIS_PASSWORD no está definido. Se recomienda usar password en producción';
  logWarning(msg);
  warnings.push(msg);
  hasWarnings = true;
} else {
  logSuccess('REDIS_PASSWORD está definido');
}

// 10. Verificar que existen migraciones
logHeader('\n10. Verificando migraciones');
const migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
try {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  const migrationFiles = files.filter(f => !f.includes('README'));

  if (migrationFiles.length > 0) {
    logSuccess(`Se encontraron ${migrationFiles.length} archivos de migración`);
    migrationFiles.forEach(file => {
      log(`  - ${file}`, 'reset');
    });
  } else {
    const msg = 'No se encontraron archivos de migración';
    logWarning(msg);
    warnings.push(msg);
    hasWarnings = true;
  }
} catch (error) {
  const msg = `Error al leer el directorio de migraciones: ${error.message}`;
  logError(msg);
  errors.push(msg);
  hasErrors = true;
}

// 11. Verificar cookies
logHeader('\n11. Verificando configuración de cookies');
if (process.env.COOKIE_SAMESITE === 'none') {
  const msg = 'COOKIE_SAMESITE está en "none". En producción se recomienda "strict" o "lax"';
  logWarning(msg);
  warnings.push(msg);
  hasWarnings = true;
} else {
  logSuccess(`COOKIE_SAMESITE está configurado como "${process.env.COOKIE_SAMESITE || 'default'}"`);
}

// Resumen final
logHeader('\n📊 RESUMEN DE VERIFICACIÓN');

if (hasErrors) {
  log(`\n${colors.bold}${colors.red}❌ ERRORES CRÍTICOS (${errors.length}):${colors.reset}`);
  errors.forEach((error, index) => {
    log(`  ${index + 1}. ${error}`, 'red');
  });
}

if (hasWarnings) {
  log(`\n${colors.bold}${colors.yellow}⚠️  ADVERTENCIAS (${warnings.length}):${colors.reset}`);
  warnings.forEach((warning, index) => {
    log(`  ${index + 1}. ${warning}`, 'yellow');
  });
}

if (!hasErrors && !hasWarnings) {
  log(`\n${colors.bold}${colors.green}✅ ¡Todas las verificaciones pasaron correctamente!${colors.reset}`);
  log(`${colors.green}El backend está listo para producción.${colors.reset}\n`);
  process.exit(0);
} else if (!hasErrors && hasWarnings) {
  log(`\n${colors.bold}${colors.yellow}⚠️  Hay advertencias que deberías revisar.${colors.reset}`);
  log(`${colors.yellow}El backend puede funcionar, pero se recomiendan mejoras.${colors.reset}\n`);
  process.exit(0);
} else {
  log(`\n${colors.bold}${colors.red}❌ HAY ERRORES CRÍTICOS QUE DEBEN CORREGIRSE${colors.reset}`);
  log(`${colors.red}Corrige los errores antes de hacer deploy en producción.${colors.reset}\n`);
  process.exit(1);
}
