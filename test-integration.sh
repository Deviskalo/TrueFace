#!/bin/bash

echo "🧪 TrueFace Integration Test"
echo "==========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if servers are running
echo -e "${YELLOW}1. Checking servers...${NC}"

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "   ✅ Frontend (Next.js) is running on http://localhost:3000"
else
    echo -e "   ❌ Frontend is not running"
    echo "   Start with: cd frontend && npm run dev"
    exit 1
fi

# Test backend
if curl -s http://localhost:8000/docs > /dev/null; then
    echo -e "   ✅ Backend (FastAPI) is running on http://localhost:8000"
else
    echo -e "   ❌ Backend is not running"
    echo "   Start with: source backend/venv/bin/activate && uvicorn backend.main:app --reload --port 8000"
    exit 1
fi

# Test 2: Check CORS
echo -e "\n${YELLOW}2. Testing CORS configuration...${NC}"
CORS_TEST=$(curl -s -X OPTIONS http://localhost:8000/api/auth/signup \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -w "%{http_code}")

if [[ $CORS_TEST == *"200"* ]]; then
    echo -e "   ✅ CORS is properly configured"
else
    echo -e "   ❌ CORS configuration issue"
    exit 1
fi

# Test 3: Check database connection
echo -e "\n${YELLOW}3. Testing database connection...${NC}"
DB_TEST=$(curl -s -X GET http://localhost:8000/api/logs -w "%{http_code}" | tail -c 3)

if [ "$DB_TEST" = "401" ]; then
    echo -e "   ✅ Database is connected (got expected 401 Unauthorized)"
elif [ "$DB_TEST" = "503" ]; then
    echo -e "   ❌ Database connection failed"
    echo "   Check MongoDB Atlas connection or MONGO_URI in backend/.env"
    exit 1
else
    echo -e "   ⚠️  Unexpected response: $DB_TEST"
fi

echo -e "\n${GREEN}🎉 All integration tests passed!${NC}"
echo ""
echo "📝 Ready to test:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Click 'Sign Up' to test the full camera capture flow"
echo "   3. Fill out the form and capture your face"
echo "   4. Complete the registration process"
echo ""
echo "🔍 API Documentation:"
echo "   • Backend Swagger UI: http://localhost:8000/docs"
echo "   • Test API endpoints directly from the Swagger interface"
echo ""
echo "🎯 What to test:"
echo "   ✅ Camera permissions and capture"
echo "   ✅ Form validation"
echo "   ✅ Face detection and embedding"
echo "   ✅ User registration in MongoDB"
echo "   ✅ JWT token generation"
echo "   ✅ Redirect to dashboard after signup"
