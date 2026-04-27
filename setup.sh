#!/bin/bash
#
# AI-Showcase Rapid Setup Script
# 
# This script automates the initial setup of the AI-Assisted CI/CD pipeline.
# Usage: bash setup.sh
#
# Prerequisites:
# - kubectl configured
# - Argo Rollouts installed
# - ArgoCD installed
# - GitHub secrets configured
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 AI-Showcase CI/CD Rapid Setup${NC}"
echo "=================================================="
echo ""

# 1. Verify Prerequisites
echo -e "${YELLOW}[1/5] Verifying prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git not found. Please install git.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ kubectl and git found${NC}"

# 2. Confirm current directory
echo ""
echo -e "${YELLOW}[2/5] Confirming repository setup...${NC}"

if [ ! -d "agentic-ai-demo" ]; then
    echo -e "${RED}❌ Directory 'agentic-ai-demo' not found.${NC}"
    echo "This script should be run from the repository root."
    exit 1
fi

cd agentic-ai-demo

# 3. Create namespace and secrets
echo ""
echo -e "${YELLOW}[3/5] Setting up Kubernetes namespace and secrets...${NC}"

# Check if namespace exists
if kubectl get namespace ai-showcase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Namespace 'ai-showcase' already exists${NC}"
else
    echo "Creating namespace..."
    kubectl create namespace ai-showcase
    echo -e "${GREEN}✅ Namespace created${NC}"
fi

# 4. Deploy ConfigMaps and Secrets
echo ""
echo -e "${YELLOW}[4/5] Deploying ConfigMaps and Secrets...${NC}"

if [ -f "manifests/ai-showcase/configmap.yaml" ]; then
    kubectl apply -f manifests/ai-showcase/configmap.yaml
    echo -e "${GREEN}✅ ConfigMap deployed${NC}"
else
    echo -e "${RED}❌ ConfigMap file not found${NC}"
fi

if [ -f "manifests/ai-showcase/secret.yaml" ]; then
    kubectl apply -f manifests/ai-showcase/secret.yaml
    echo -e "${GREEN}✅ Secret deployed${NC}"
else
    echo -e "${RED}❌ Secret file not found${NC}"
fi

# 5. Deploy RBAC
echo ""
echo -e "${YELLOW}[5/5] Deploying RBAC resources...${NC}"

if [ -f "manifests/ai-showcase/rbac.yaml" ]; then
    kubectl apply -f manifests/ai-showcase/rbac.yaml
    echo -e "${GREEN}✅ RBAC deployed${NC}"
else
    echo -e "${RED}❌ RBAC file not found${NC}"
fi

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Create registry secret (if needed):"
echo "   kubectl create secret docker-registry ghcr-secret \\"
echo "     --docker-server=ghcr.io \\"
echo "     --docker-username=YOUR_USERNAME \\"
echo "     --docker-password=YOUR_TOKEN \\"
echo "     --docker-email=YOUR_EMAIL \\"
echo "     -n ai-showcase"
echo ""
echo "2. Deploy services:"
echo "   kubectl apply -f manifests/ai-showcase/service.yaml"
echo ""
echo "3. Deploy Argo Rollout:"
echo "   kubectl apply -f manifests/ai-showcase/rollout.yaml"
echo ""
echo "4. Deploy ArgoCD application:"
echo "   kubectl apply -f manifests/ai-showcase/argocd-app.yaml"
echo ""
echo "5. Verify deployment:"
echo "   kubectl get all -n ai-showcase"
echo ""
