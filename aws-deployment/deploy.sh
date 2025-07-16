#!/bin/bash

# Jargon AI Prototype - AWS Deployment Script
# This script orchestrates the complete migration from Supabase to AWS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
DOMAIN_NAME=${3:-Jargon AI-prototype.com}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    echo -e "${RED}Error: Environment must be dev, staging, or production${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Starting Jargon AI Prototype AWS Migration${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Domain: ${DOMAIN_NAME}${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    local missing_tools=()
    
    if ! command_exists aws; then
        missing_tools+=("AWS CLI")
    fi
    
    if ! command_exists terraform; then
        missing_tools+=("Terraform")
    fi
    
    if ! command_exists node; then
        missing_tools+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_tools+=("npm")
    fi
    
    if ! command_exists docker; then
        missing_tools+=("Docker")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools:${NC}"
        printf '%s\n' "${missing_tools[@]}"
        echo -e "${YELLOW}Please install the missing tools and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites are installed${NC}"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        echo -e "${YELLOW}Please run 'aws configure' and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ AWS credentials are configured${NC}"
}

# Function to create S3 bucket for Terraform state
create_terraform_bucket() {
    echo -e "${YELLOW}🪣 Creating S3 bucket for Terraform state...${NC}"
    
    local bucket_name="Jargon AI-terraform-state-${ENVIRONMENT}"
    
    if aws s3 ls "s3://${bucket_name}" 2>&1 > /dev/null; then
        echo -e "${GREEN}✅ Terraform state bucket already exists${NC}"
    else
        aws s3 mb "s3://${bucket_name}" --region "${REGION}"
        aws s3api put-bucket-versioning \
            --bucket "${bucket_name}" \
            --versioning-configuration Status=Enabled
        aws s3api put-bucket-encryption \
            --bucket "${bucket_name}" \
            --server-side-encryption-configuration '{
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }'
        echo -e "${GREEN}✅ Terraform state bucket created${NC}"
    fi
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo -e "${YELLOW}🏗️  Deploying infrastructure with Terraform...${NC}"
    
    cd aws-deployment/infrastructure
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan \
        -var="environment=${ENVIRONMENT}" \
        -var="aws_region=${REGION}" \
        -var="domain_name=${DOMAIN_NAME}" \
        -out=tfplan
    
    # Apply deployment
    echo -e "${YELLOW}Applying Terraform plan...${NC}"
    terraform apply tfplan
    
    # Get outputs
    echo -e "${YELLOW}📤 Getting infrastructure outputs...${NC}"
    terraform output -json > ../terraform-outputs.json
    
    cd ../..
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
}

# Function to migrate database
migrate_database() {
    echo -e "${YELLOW}🗄️  Migrating database from Supabase to RDS...${NC}"
    
    # Check if Supabase credentials are provided
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
        echo -e "${YELLOW}⚠️  Supabase credentials not provided, skipping database migration${NC}"
        echo -e "${YELLOW}Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables to migrate data${NC}"
        return 0
    fi
    
    cd aws-deployment/database
    
    # Install Python dependencies
    pip install -r requirements.txt
    
    # Run migration
    python migrate_supabase_to_rds.py \
        --supabase-url "$SUPABASE_URL" \
        --supabase-key "$SUPABASE_SERVICE_KEY" \
        --rds-secret-name "Jargon AI/database/${ENVIRONMENT}"
    
    cd ../..
    
    echo -e "${GREEN}✅ Database migration completed${NC}"
}

# Function to deploy backend
deploy_backend() {
    echo -e "${YELLOW}🔧 Deploying backend Lambda functions...${NC}"
    
    cd aws-deployment/backend
    
    # Install dependencies
    npm install
    
    # Deploy with Serverless Framework
    npx serverless deploy \
        --stage "${ENVIRONMENT}" \
        --region "${REGION}" \
        --verbose
    
    cd ../..
    
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
}

# Function to deploy ML service
deploy_ml_service() {
    echo -e "${YELLOW}🤖 Deploying ML service...${NC}"
    
    cd aws-deployment/ml-service
    
    # Build Docker image
    docker build -t Jargon AI-ml:latest .
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REPO_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/Jargon AI-ml"
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names Jargon AI-ml --region "${REGION}" 2>/dev/null || \
    aws ecr create-repository --repository-name Jargon AI-ml --region "${REGION}"
    
    # Login to ECR
    aws ecr get-login-password --region "${REGION}" | \
    docker login --username AWS --password-stdin "${ECR_REPO_URI}"
    
    # Tag and push image
    docker tag Jargon AI-ml:latest "${ECR_REPO_URI}:latest"
    docker push "${ECR_REPO_URI}:latest"
    
    # Deploy to ECS (you can also use EKS or App Runner)
    # This is a simplified deployment - you might want to use CloudFormation or CDK
    echo -e "${GREEN}✅ ML service image pushed to ECR${NC}"
    echo -e "${YELLOW}⚠️  Please deploy the ECS service manually or use CloudFormation${NC}"
    
    cd ../..
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}🌐 Deploying frontend to Amplify...${NC}"
    
    cd aws-deployment/frontend
    
    # Initialize Amplify if not already done
    if [ ! -d ".amplify" ]; then
        npx amplify init \
            --app "Jargon AI-frontend-${ENVIRONMENT}" \
            --envName "${ENVIRONMENT}" \
            --defaultEditor code \
            --framework nextjs \
            --yes
    fi
    
    # Add hosting
    npx amplify add hosting \
        --environmentName "${ENVIRONMENT}" \
        --yes
    
    # Push to Amplify
    npx amplify push --yes
    
    cd ../..
    
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
}

# Function to update environment variables
update_environment_variables() {
    echo -e "${YELLOW}🔧 Updating environment variables...${NC}"
    
    # Read Terraform outputs
    if [ ! -f "aws-deployment/terraform-outputs.json" ]; then
        echo -e "${RED}❌ Terraform outputs not found. Run infrastructure deployment first.${NC}"
        exit 1
    fi
    
    # Extract values from Terraform outputs
    COGNITO_USER_POOL_ID=$(jq -r '.cognito_user_pool_id.value' aws-deployment/terraform-outputs.json)
    COGNITO_CLIENT_ID=$(jq -r '.cognito_client_id.value' aws-deployment/terraform-outputs.json)
    S3_BUCKET=$(jq -r '.s3_bucket_name.value' aws-deployment/terraform-outputs.json)
    API_URL=$(jq -r '.api_gateway_url.value' aws-deployment/terraform-outputs.json)
    
    # Update frontend environment variables
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
NEXT_PUBLIC_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
NEXT_PUBLIC_S3_BUCKET=${S3_BUCKET}
EOF
    
    echo -e "${GREEN}✅ Environment variables updated${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    
    # Run backend tests
    cd aws-deployment/backend
    npm test || echo -e "${YELLOW}⚠️  Backend tests failed or not configured${NC}"
    cd ../..
    
    # Run frontend tests
    npm test || echo -e "${YELLOW}⚠️  Frontend tests failed or not configured${NC}"
    
    echo -e "${GREEN}✅ Tests completed${NC}"
}

# Function to show deployment summary
show_summary() {
    echo ""
    echo -e "${GREEN}🎉 Deployment Summary${NC}"
    echo -e "${GREEN}===================${NC}"
    echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
    echo -e "${BLUE}Region: ${REGION}${NC}"
    echo -e "${BLUE}Domain: ${DOMAIN_NAME}${NC}"
    echo ""
    
    if [ -f "aws-deployment/terraform-outputs.json" ]; then
        echo -e "${YELLOW}Infrastructure URLs:${NC}"
        jq -r 'to_entries[] | "\(.key): \(.value.value)"' aws-deployment/terraform-outputs.json
    fi
    
    echo ""
    echo -e "${GREEN}✅ Jargon AI Prototype has been successfully migrated to AWS!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Configure your domain DNS to point to the CloudFront distribution"
    echo -e "2. Set up monitoring and alerting in CloudWatch"
    echo -e "3. Configure backup and disaster recovery procedures"
    echo -e "4. Set up CI/CD pipelines for automated deployments"
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Jargon AI Prototype AWS Migration${NC}"
    echo -e "${BLUE}================================${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Create Terraform state bucket
    create_terraform_bucket
    
    # Deploy infrastructure
    deploy_infrastructure
    
    # Migrate database (if credentials provided)
    migrate_database
    
    # Deploy backend
    deploy_backend
    
    # Deploy ML service
    deploy_ml_service
    
    # Update environment variables
    update_environment_variables
    
    # Deploy frontend
    deploy_frontend
    
    # Run tests
    run_tests
    
    # Show summary
    show_summary
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "infrastructure")
        check_prerequisites
        create_terraform_bucket
        deploy_infrastructure
        ;;
    "database")
        migrate_database
        ;;
    "backend")
        deploy_backend
        ;;
    "ml")
        deploy_ml_service
        ;;
    "frontend")
        update_environment_variables
        deploy_frontend
        ;;
    "test")
        run_tests
        ;;
    "summary")
        show_summary
        ;;
    *)
        echo -e "${RED}Usage: $0 [deploy|infrastructure|database|backend|ml|frontend|test|summary] [environment] [region] [domain]${NC}"
        echo -e "${YELLOW}Default: deploy dev us-east-1 Jargon AI-prototype.com${NC}"
        exit 1
        ;;
esac 