#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.production

# AWS configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY="coin-group-backend"
ECS_CLUSTER="coin-group-cluster"
ECS_SERVICE="coin-group-backend-service"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Build the Docker image
echo "Building Docker image..."
docker build -t $ECR_REPOSITORY .

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push the image
echo "Tagging and pushing image to ECR..."
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

echo "Deployment completed successfully!" 