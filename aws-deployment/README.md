# Jargon AI Prototype - AWS Deployment Guide

## Architecture Overview

This deployment migrates the Jargon AI prototype from Supabase to a fully AWS-native solution:

### Frontend
- **AWS Amplify** - Hosting and CI/CD for Next.js app
- **CloudFront** - CDN for global content delivery

### Backend Services
- **AWS Lambda** - Serverless API endpoints (replacing Next.js API routes)
- **API Gateway** - REST API management
- **AWS AppSync** - GraphQL API for real-time features

### Database & Storage
- **Amazon RDS (PostgreSQL)** - Primary database (replacing Supabase)
- **Amazon DynamoDB** - NoSQL for real-time data and caching
- **Amazon S3** - File storage for uploads and static assets

### Authentication & Security
- **Amazon Cognito** - User authentication and management
- **AWS IAM** - Access control and permissions
- **AWS Secrets Manager** - Environment variables and secrets

### AI/ML Services
- **AWS Lambda** - Python ML service (replacing FastAPI)
- **Amazon Bedrock** - AI/ML foundation models (replacing Google Gemini)
- **Amazon SageMaker** - ML model training and deployment (optional)

### Monitoring & Analytics
- **AWS CloudWatch** - Logging and monitoring
- **AWS X-Ray** - Distributed tracing
- **Amazon CloudTrail** - API call logging

## Deployment Steps

### 1. Prerequisites
- AWS CLI installed and configured
- Node.js 18+ and Python 3.9+
- Docker (for containerized deployments)

### 2. Infrastructure Setup
```bash
# Deploy core infrastructure
cd aws-deployment/infrastructure
terraform init
terraform plan
terraform apply
```

### 3. Database Migration
```bash
# Migrate from Supabase to RDS
cd aws-deployment/database
python migrate_supabase_to_rds.py
```

### 4. Backend Deployment
```bash
# Deploy Lambda functions
cd aws-deployment/backend
npm install
serverless deploy
```

### 5. Frontend Deployment
```bash
# Deploy to Amplify
cd aws-deployment/frontend
amplify init
amplify push
```

### 6. ML Service Deployment
```bash
# Deploy ML service
cd aws-deployment/ml-service
docker build -t Jargon AI-ml .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag Jargon AI-ml:latest $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/Jargon AI-ml:latest
docker push $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/Jargon AI-ml:latest
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxx
NEXT_PUBLIC_APPSYNC_URL=https://your-appsync-url.amazonaws.com/graphql
NEXT_PUBLIC_S3_BUCKET=Jargon AI-assets-xxxxx
```

### Backend (Lambda environment variables)
```env
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/Jargon AI
DYNAMODB_TABLE=Jargon AI-transactions
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
S3_BUCKET=Jargon AI-assets-xxxxx
```

## Cost Optimization

### Free Tier Usage
- Lambda: 1M requests/month
- API Gateway: 1M requests/month
- RDS: 750 hours/month (t3.micro)
- S3: 5GB storage
- CloudFront: 1TB data transfer

### Production Recommendations
- Use Reserved Instances for RDS
- Enable Lambda Provisioned Concurrency for consistent performance
- Implement S3 lifecycle policies
- Use CloudFront caching strategies

## Security Considerations

### Data Protection
- All data encrypted at rest and in transit
- VPC isolation for RDS
- IAM roles with least privilege access
- Secrets Manager for sensitive configuration

### Compliance
- GDPR compliance with data residency
- PCI DSS considerations for financial data
- Vietnamese data protection regulations

## Monitoring & Alerting

### CloudWatch Dashboards
- Application performance metrics
- Database performance
- Lambda function metrics
- API Gateway usage

### Alerts
- High error rates
- Database connection issues
- Lambda function failures
- Cost threshold alerts

## Disaster Recovery

### Backup Strategy
- RDS automated backups (7 days)
- S3 cross-region replication
- DynamoDB point-in-time recovery

### Recovery Procedures
- Database restore procedures
- Application rollback strategies
- Multi-region failover setup

## Performance Optimization

### Frontend
- Next.js image optimization
- CloudFront caching
- Code splitting and lazy loading

### Backend
- Lambda function optimization
- Database query optimization
- API Gateway caching

### Database
- Connection pooling
- Read replicas for scaling
- Query optimization

## Troubleshooting

### Common Issues
1. **CORS errors**: Check API Gateway CORS configuration
2. **Database connection**: Verify VPC and security group settings
3. **Lambda timeouts**: Increase timeout or optimize code
4. **Authentication issues**: Check Cognito configuration

### Debug Tools
- CloudWatch Logs
- X-Ray tracing
- API Gateway logs
- RDS performance insights 