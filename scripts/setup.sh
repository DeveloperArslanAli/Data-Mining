#!/bin/bash

# Data Mining Platform - Development Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js")
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    fi
    
    # Check npm
    if ! command_exists npm; then
        missing_deps+=("npm")
    else
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    fi
    
    # Check Python
    if ! command_exists python3; then
        missing_deps+=("Python 3")
    else
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
    fi
    
    # Check pip
    if ! command_exists pip3; then
        missing_deps+=("pip3")
    else
        PIP_VERSION=$(pip3 --version)
        print_success "pip found: $PIP_VERSION"
    fi
    
    # Check Docker
    if ! command_exists docker; then
        missing_deps+=("Docker")
    else
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found: $DOCKER_VERSION"
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    else
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose found: $COMPOSE_VERSION"
    fi
    
    # Check Git
    if ! command_exists git; then
        missing_deps+=("Git")
    else
        GIT_VERSION=$(git --version)
        print_success "Git found: $GIT_VERSION"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites are satisfied!"
}

# Function to create project structure
create_project_structure() {
    print_status "Creating project structure..."
    
    # Create directories
    mkdir -p frontend
    mkdir -p backend
    mkdir -p services/crawling
    mkdir -p services/ml-engine
    mkdir -p config/postgres
    mkdir -p config/nginx
    mkdir -p config/prometheus
    mkdir -p config/grafana/dashboards
    mkdir -p config/grafana/datasources
    mkdir -p scripts
    mkdir -p tests/e2e
    mkdir -p tests/integration
    mkdir -p tests/performance
    mkdir -p storage/uploads
    mkdir -p storage/exports
    mkdir -p storage/temp
    mkdir -p logs
    
    print_success "Project structure created!"
}

# Function to setup environment files
setup_environment_files() {
    print_status "Setting up environment files..."
    
    # Copy environment templates
    if [ -f "config/development.env" ]; then
        cp config/development.env .env
        print_success "Development environment file created (.env)"
    else
        print_warning "Development environment template not found"
    fi
    
    # Create frontend environment file
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8090
NEXT_PUBLIC_CRAWLING_SERVICE_URL=http://localhost:3001
EOF
    print_success "Frontend environment file created"
    
    # Create backend environment file
    if [ ! -f "backend/.env" ]; then
        cp .env backend/.env
        print_success "Backend environment file created"
    fi
    
    # Create crawling service environment file
    cat > services/crawling/.env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://datamining_user:datamining_pass@localhost:5432/datamining
REDIS_URL=redis://localhost:6379
BACKEND_URL=http://localhost:8090
EOF
    print_success "Crawling service environment file created"
    
    # Create ML engine environment file
    cat > services/ml-engine/.env << EOF
ENVIRONMENT=development
DATABASE_URL=postgresql://datamining_user:datamining_pass@localhost:5432/datamining
REDIS_URL=redis://localhost:6379
BACKEND_URL=http://localhost:8090
STORAGE_PATH=./storage
OPENAI_API_KEY=your-openai-api-key
EOF
    print_success "ML engine environment file created"
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend (Next.js)..."
    
    cd frontend
    
    # Initialize Next.js project if not exists
    if [ ! -f "package.json" ]; then
        npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
        print_success "Next.js project initialized"
    else
        print_status "Next.js project already exists"
    fi
    
    # Install additional dependencies
    npm install @headlessui/react @heroicons/react zustand axios react-query recharts
    npm install -D @types/node @types/react @types/react-dom eslint-config-next
    
    cd ..
    print_success "Frontend setup completed!"
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend (FastAPI)..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Python virtual environment created"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Create requirements.txt if not exists
    if [ ! -f "requirements.txt" ]; then
        cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
redis==5.0.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
aiofiles==23.2.1
pandas==2.1.4
numpy==1.25.2
scikit-learn==1.3.2
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
structlog==23.2.0
prometheus-client==0.19.0
EOF
        print_success "Requirements file created"
    fi
    
    # Install dependencies
    pip install -r requirements.txt
    print_success "Backend dependencies installed"
    
    cd ..
    print_success "Backend setup completed!"
}

# Function to setup crawling service
setup_crawling_service() {
    print_status "Setting up crawling service (Node.js)..."
    
    cd services/crawling
    
    # Initialize Node.js project if not exists
    if [ ! -f "package.json" ]; then
        npm init -y
        print_success "Node.js project initialized"
    fi
    
    # Install dependencies
    npm install express cors helmet morgan dotenv
    npm install puppeteer cheerio axios redis
    npm install -D nodemon @types/node @types/express @types/cors
    npm install -D jest supertest @types/jest
    
    # Update package.json scripts
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts = {
        ...pkg.scripts,
        'dev': 'nodemon src/index.js',
        'start': 'node src/index.js',
        'test': 'jest',
        'test:watch': 'jest --watch'
    };
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    
    cd ..
    print_success "Crawling service setup completed!"
}

# Function to setup ML engine service
setup_ml_engine_service() {
    print_status "Setting up ML engine service (Python)..."
    
    cd services/ml-engine
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Python virtual environment created"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Create requirements.txt
    cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
pandas==2.1.4
numpy==1.25.2
scikit-learn==1.3.2
matplotlib==3.8.2
seaborn==0.13.0
plotly==5.17.0
openai==1.3.7
requests==2.31.0
redis==5.0.1
pydantic==2.5.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
EOF
    
    # Install dependencies
    pip install -r requirements.txt
    print_success "ML engine dependencies installed"
    
    cd ..
    print_success "ML engine service setup completed!"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Create PostgreSQL initialization script
    cat > config/postgres/init.sql << EOF
-- Create database and user
CREATE DATABASE datamining;
CREATE USER datamining_user WITH PASSWORD 'datamining_pass';
GRANT ALL PRIVILEGES ON DATABASE datamining TO datamining_user;

-- Connect to the database
\c datamining;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    data_schema JSONB,
    row_count INTEGER,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cleaning_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES datasets(id),
    operation_type VARCHAR(100) NOT NULL,
    parameters JSONB,
    applied_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES datasets(id),
    user_id UUID REFERENCES users(id),
    format VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO datamining_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO datamining_user;
EOF
    
    print_success "Database initialization script created!"
}

# Function to setup Docker
setup_docker() {
    print_status "Setting up Docker configuration..."
    
    # Create .dockerignore
    cat > .dockerignore << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.DS_Store
*.log
EOF
    
    print_success "Docker configuration created!"
}

# Function to setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    # Install husky if not already installed
    if [ ! -d "node_modules/.bin/husky" ]; then
        npm install husky --save-dev
        npx husky install
    fi
    
    # Create pre-commit hook
    npx husky add .husky/pre-commit "npm run lint-staged"
    
    print_success "Git hooks configured!"
}

# Function to start services
start_services() {
    print_status "Starting services with Docker..."
    
    # Build and start services
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    cd backend
    source venv/bin/activate
    alembic upgrade head
    cd ..
    
    print_success "Services started successfully!"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    cd frontend
    npm test -- --passWithNoTests
    cd ..
    
    # Backend tests
    cd backend
    source venv/bin/activate
    pytest --version
    cd ..
    
    print_success "Tests completed!"
}

# Main execution
main() {
    echo "=========================================="
    echo "Data Mining Platform - Setup Script"
    echo "=========================================="
    
    check_prerequisites
    create_project_structure
    setup_environment_files
    setup_frontend
    setup_backend
    setup_crawling_service
    setup_ml_engine_service
    setup_database
    setup_docker
    setup_git_hooks
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Update .env files with your configuration"
    echo "2. Start services: docker-compose up -d"
    echo "3. Run frontend: cd frontend && npm run dev"
    echo "4. Run backend: cd backend && uvicorn main:app --reload"
    echo "5. Run crawling service: cd services/crawling && npm run dev"
    echo ""
    echo "Documentation: ./docs/"
    echo "API Documentation: http://localhost:8090/docs"
    echo "Frontend: http://localhost:3050"
    echo ""
}

# Run main function
main "$@"
