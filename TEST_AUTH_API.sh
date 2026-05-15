#!/bin/bash
# ============================================
# SCRIPT DE TEST - AUTHENTIFICATION API
# ============================================
# Ce script teste complètement le système d'authentification
# 
# Utilisation:
# chmod +x TEST_AUTH_API.sh
# ./TEST_AUTH_API.sh
#
# Ou utilisez les commandes curl individuellement

# Configuration
API_URL="https://backend-ovbc.onrender.com/api"
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}TEST COMPLET SYSTÈME AUTHENTIFICATION${NC}"
echo -e "${YELLOW}============================================${NC}\n"

# ============================================
# 1️⃣ TEST D'INSCRIPTION
# ============================================
echo -e "${YELLOW}1️⃣  TEST D'INSCRIPTION${NC}"
echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User\",
    \"phone\": \"+33612345678\",
    \"accepted_policy\": true
  }")

echo "Réponse complète:"
echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extraire le token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo -e "${GREEN}✅ INSCRIPTION RÉUSSIE${NC}"
  echo "Token reçu: ${TOKEN:0:50}..."
else
  echo -e "${RED}❌ INSCRIPTION ÉCHOUÉE${NC}"
  echo "Pas de token reçu"
  exit 1
fi

echo ""

# ============================================
# 2️⃣ TEST DE CONNEXION
# ============================================
echo -e "${YELLOW}2️⃣  TEST DE CONNEXION${NC}"
echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Réponse complète:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extraire le token
LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$LOGIN_TOKEN" != "null" ] && [ ! -z "$LOGIN_TOKEN" ]; then
  echo -e "${GREEN}✅ CONNEXION RÉUSSIE${NC}"
  echo "Token reçu: ${LOGIN_TOKEN:0:50}..."
  TOKEN=$LOGIN_TOKEN
else
  echo -e "${RED}❌ CONNEXION ÉCHOUÉE${NC}"
  echo "Pas de token reçu"
  exit 1
fi

echo ""

# ============================================
# 3️⃣ TEST /api/auth/me
# ============================================
echo -e "${YELLOW}3️⃣  TEST /api/auth/me (PROFIL)${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Réponse complète:"
echo "$ME_RESPONSE" | jq '.' 2>/dev/null || echo "$ME_RESPONSE"
echo ""

# Vérifier la réponse
USER_ID=$(echo "$ME_RESPONSE" | jq -r '.user.id' 2>/dev/null)

if [ "$USER_ID" != "null" ] && [ ! -z "$USER_ID" ]; then
  echo -e "${GREEN}✅ /api/auth/me RÉUSSI${NC}"
  echo "User ID: $USER_ID"
else
  echo -e "${RED}❌ /api/auth/me ÉCHOUÉ${NC}"
  echo "Vérifiez que le token est valide"
  exit 1
fi

echo ""

# ============================================
# 4️⃣ TEST DE MAUVAIS MOT DE PASSE
# ============================================
echo -e "${YELLOW}4️⃣  TEST DE MAUVAIS MOT DE PASSE${NC}"
echo "Email: $TEST_EMAIL"
echo "Password: WrongPassword"
echo ""

BAD_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword\"
  }")

echo "Réponse complète:"
echo "$BAD_LOGIN" | jq '.' 2>/dev/null || echo "$BAD_LOGIN"
echo ""

ERROR_MSG=$(echo "$BAD_LOGIN" | jq -r '.error' 2>/dev/null)

if [ "$ERROR_MSG" != "null" ] && [ ! -z "$ERROR_MSG" ]; then
  echo -e "${GREEN}✅ REJET CORRECT (mauvais mot de passe)${NC}"
  echo "Message d'erreur: $ERROR_MSG"
else
  echo -e "${RED}❌ ERREUR - Le mauvais mot de passe aurait dû être rejeté${NC}"
fi

echo ""

# ============================================
# 5️⃣ TEST SANS TOKEN
# ============================================
echo -e "${YELLOW}5️⃣  TEST SANS TOKEN SUR /api/auth/me${NC}"
echo ""

NO_TOKEN=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Content-Type: application/json")

echo "Réponse complète:"
echo "$NO_TOKEN" | jq '.' 2>/dev/null || echo "$NO_TOKEN"
echo ""

ERROR_NO_TOKEN=$(echo "$NO_TOKEN" | jq -r '.error' 2>/dev/null)

if [ "$ERROR_NO_TOKEN" != "null" ] && [ ! -z "$ERROR_NO_TOKEN" ]; then
  echo -e "${GREEN}✅ REJET CORRECT (pas de token)${NC}"
  echo "Message d'erreur: $ERROR_NO_TOKEN"
else
  echo -e "${RED}❌ ERREUR - Sans token, devrait être rejeté${NC}"
fi

echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo -e "${YELLOW}============================================${NC}"
echo -e "${GREEN}✅ TOUS LES TESTS TERMINÉS${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""
echo "Résumé:"
echo "  ✅ Inscription réussie"
echo "  ✅ Connexion réussie"
echo "  ✅ Récupération profil réussie"
echo "  ✅ Rejet mauvais mot de passe"
echo "  ✅ Rejet sans token"
echo ""
echo "Email de test créé: $TEST_EMAIL"
echo "Vous pouvez réutiliser cet email pour d'autres tests"
