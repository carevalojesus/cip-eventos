#!/bin/bash

# Script de prueba del sistema de consentimientos
# Uso: ./test-consent-system.sh

echo "========================================="
echo "Sistema de Consentimientos - Test Script"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${YELLOW}1. Verificando que el servidor esté corriendo...${NC}"
if curl -s "$BASE_URL" > /dev/null; then
    echo -e "${GREEN}✓ Servidor está corriendo${NC}"
else
    echo -e "${RED}✗ Servidor no está corriendo. Ejecuta: npm run start:dev${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}2. Obteniendo versiones de documentos...${NC}"
VERSIONS=$(curl -s "$BASE_URL/consent/versions")
echo "$VERSIONS" | jq '.'
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Endpoint /consent/versions funciona${NC}"
else
    echo -e "${RED}✗ Error al obtener versiones${NC}"
fi

echo ""
echo -e "${YELLOW}3. Intentando registro sin consentimientos (debe fallar)...${NC}"
REGISTER_FAIL=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "acceptTerms": false,
    "acceptPrivacy": false
  }')

HTTP_CODE=$(echo "$REGISTER_FAIL" | tail -n1)
if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}✓ Validación de consentimientos obligatorios funciona${NC}"
else
    echo -e "${RED}✗ Debería fallar con código 400, obtuvo: $HTTP_CODE${NC}"
fi

echo ""
echo -e "${YELLOW}4. Registrando usuario con consentimientos...${NC}"
RANDOM_EMAIL="test_$(date +%s)@example.com"
REGISTER_SUCCESS=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"Password123\",
    \"acceptTerms\": true,
    \"acceptPrivacy\": true,
    \"acceptMarketing\": true,
    \"acceptDataProcessing\": false
  }")

ACCESS_TOKEN=$(echo "$REGISTER_SUCCESS" | jq -r '.access_token')
if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ Registro exitoso${NC}"
    echo "Email: $RANDOM_EMAIL"
    echo "Token: ${ACCESS_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Error en el registro${NC}"
    echo "$REGISTER_SUCCESS" | jq '.'
    exit 1
fi

echo ""
echo -e "${YELLOW}5. Obteniendo consentimientos del usuario...${NC}"
MY_CONSENTS=$(curl -s "$BASE_URL/consent/my-consents" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$MY_CONSENTS" | jq '.'
CONSENT_COUNT=$(echo "$MY_CONSENTS" | jq -r '.count')
if [ "$CONSENT_COUNT" == "3" ]; then
    echo -e "${GREEN}✓ Se registraron 3 consentimientos (TERMS, PRIVACY, MARKETING)${NC}"
elif [ "$CONSENT_COUNT" == "2" ]; then
    echo -e "${YELLOW}⚠ Solo se registraron 2 consentimientos (esperado: 3)${NC}"
else
    echo -e "${RED}✗ Cantidad inesperada de consentimientos: $CONSENT_COUNT${NC}"
fi

echo ""
echo -e "${YELLOW}6. Registrando consentimiento adicional...${NC}"
CONSENT_ID=$(echo "$MY_CONSENTS" | jq -r '.consents[0].id')
NEW_CONSENT=$(curl -s -X POST "$BASE_URL/consent/accept" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"dummy-uuid\",
    \"consentType\": \"DATA_PROCESSING\",
    \"documentVersion\": \"v1.5\",
    \"metadata\": {
      \"source\": \"test_script\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }")
echo "$NEW_CONSENT" | jq '.'

echo ""
echo -e "${YELLOW}7. Verificando estado de consentimiento...${NC}"
# Necesitaríamos el userId real del usuario creado para esto
echo -e "${YELLOW}Nota: Este test requiere el userId real. Saltando...${NC}"

echo ""
echo -e "${YELLOW}8. Validando consentimientos requeridos...${NC}"
VALIDATION=$(curl -s -X POST "$BASE_URL/consent/validate-required" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$VALIDATION" | jq '.'
IS_VALID=$(echo "$VALIDATION" | jq -r '.valid')
if [ "$IS_VALID" == "true" ]; then
    echo -e "${GREEN}✓ Usuario tiene todos los consentimientos requeridos${NC}"
else
    echo -e "${RED}✗ Usuario no tiene todos los consentimientos requeridos${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Tests completados${NC}"
echo "========================================="
echo ""
echo "Pasos adicionales para verificar:"
echo "1. Revisa la base de datos:"
echo "   SELECT * FROM consent_logs ORDER BY \"createdAt\" DESC LIMIT 5;"
echo ""
echo "2. Verifica que se capturaron IP y User-Agent:"
echo "   SELECT \"ipAddress\", \"userAgent\" FROM consent_logs WHERE \"userId\" IS NOT NULL LIMIT 3;"
echo ""
echo "3. Prueba revocar un consentimiento:"
echo "   curl -X POST $BASE_URL/consent/revoke \\"
echo "     -H 'Authorization: Bearer $ACCESS_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"consentId\": \"ID_DEL_CONSENTIMIENTO\", \"reason\": \"Test revocation\"}'"
echo ""
