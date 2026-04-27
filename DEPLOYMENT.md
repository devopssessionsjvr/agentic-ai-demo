# 📦 Deployment Guide: From Demo to Production

Complete step-by-step guide for deploying the AI-Assisted CI/CD workflow to a real Kubernetes cluster.

---

## 📋 Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Infrastructure Setup](#infrastructure-setup)
- [Kubernetes Cluster Preparation](#kubernetes-cluster-preparation)
- [Application Deployment](#application-deployment)
- [Verification & Testing](#verification--testing)
- [Production Hardening](#production-hardening)
- [Monitoring & Alerting](#monitoring--alerting)
- [Rollback Procedures](#rollback-procedures)

---

## ✅ Pre-Deployment Checklist

### Infrastructure
- [ ] Kubernetes cluster ready (1.24+)
- [ ] kubectl context configured
- [ ] Storage class available
- [ ] Network policies (if required)
- [ ] Load balancer support
- [ ] DNS configured

### Tools & Services
- [ ] Argo Rollouts installed
- [ ] ArgoCD installed
- [ ] Prometheus installed (optional but recommended)
- [ ] Docker registry access (GHCR)
- [ ] Git repository accessible from cluster

### Credentials & Secrets
- [ ] OpenAI API key ready
- [ ] GitHub token with repo access
- [ ] Docker registry credentials
- [ ] SSL certificates (if using HTTPS)
- [ ] Database credentials (if applicable)

### Configuration
- [ ] Organization name finalized
- [ ] Repository name finalized
- [ ] Domain name finalized
- [ ] Namespace name decided
- [ ] Image registry URL confirmed

---

## 🏗️ Infrastructure Setup

### Step 1: Kubernetes Cluster Setup

#### Option A: AWS EKS
```bash
# Create cluster using eksctl
eksctl create cluster \
  --name ai-showcase \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --managed

# Update kubeconfig
aws eks update-kubeconfig --name ai-showcase --region us-east-1
```

#### Option B: Google GKE
```bash
# Create cluster using gcloud
gcloud container clusters create ai-showcase \
  --zone us-central1-a \
  --num-nodes 3 \
  --enable-ip-alias \
  --network "default"

# Get credentials
gcloud container clusters get-credentials ai-showcase --zone us-central1-a
```

#### Option C: Azure AKS
```bash
# Create cluster using az cli
az aks create \
  --resource-group myResourceGroup \
  --name ai-showcase \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets \
  --load-balancer-sku standard \
  --enable-managed-identity

# Get credentials
az aks get-credentials --resource-group myResourceGroup --name ai-showcase
```

#### Option D: Local Testing (Minikube/Kind)
```bash
# Using Minikube
minikube start --cpus 4 --memory 8192 --nodes 3

# Using Kind
kind create cluster --name ai-showcase --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker
EOF
```

### Step 2: Verify Cluster Access
```bash
# Verify cluster connection
kubectl cluster-info
kubectl get nodes
kubectl get namespaces

# Output: All nodes should show 'Ready' status
```

---

## 🔧 Kubernetes Cluster Preparation

### Step 1: Install Argo Rollouts

#### Official Installation
```bash
# Create namespace
kubectl create namespace argo-rollouts

# Install Argo Rollouts
kubectl apply -n argo-rollouts -f \
  https://github.com/argoproj/argo-rollouts/releases/download/stable/install.yaml

# Verify installation
kubectl get deployment -n argo-rollouts
kubectl get crd | grep rollout
```

#### Using Helm
```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

helm install argo-rollouts argo/argo-rollouts \
  --namespace argo-rollouts \
  --create-namespace \
  --values - <<EOF
serviceAccount:
  create: true
RBAC:
  create: true
authoritativeRole: true
EOF
```

### Step 2: Install ArgoCD

#### Official Installation
```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for deployment
kubectl wait --for=condition=Available --timeout=300s \
  deployment/argocd-server -n argocd

# Get initial admin password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)
echo "ArgoCD admin password: $ARGOCD_PASSWORD"
```

#### Expose ArgoCD
```bash
# Option 1: Port forward (development)
kubectl port-forward -n argocd svc/argocd-server 8080:443 &

# Option 2: LoadBalancer (production)
kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"LoadBalancer"}}'

# Get external IP
kubectl get svc -n argocd argocd-server

# Option 3: Ingress (recommended for production)
# Create ingress resource with TLS
```

### Step 3: Install Prometheus (Optional but Recommended)

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Prometheus
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090 &
# Open: http://localhost:9090
```

### Step 4: Storage Configuration (if needed)

```bash
# Check available storage classes
kubectl get storageclass

# If none exist, create default
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard-rwo
provisioner: kubernetes.io/aws-ebs  # Change based on cloud provider
parameters:
  type: gp2
  iops: "100"
  volumeType: gp2
EOF
```

---

## 📦 Application Deployment

### Step 1: Create Namespace & RBAC
```bash
# Create namespace
kubectl create namespace ai-showcase

# Create RBAC
kubectl apply -f manifests/ai-showcase/rbac.yaml
```

### Step 2: Create ConfigMap & Secrets

#### ConfigMap (non-sensitive)
```bash
kubectl apply -f manifests/ai-showcase/configmap.yaml

# Verify
kubectl get configmap -n ai-showcase
kubectl describe configmap ai-showcase-config -n ai-showcase
```

#### Secrets (sensitive data)

**IMPORTANT:** In production, use external secret management!

```bash
# Option 1: Create from manifest (development only)
kubectl apply -f manifests/ai-showcase/secret.yaml

# Option 2: Create from literal values (recommended)
kubectl create secret generic ai-showcase-secrets \
  --from-literal=OPENAI_API_KEY=$OPENAI_API_KEY \
  --from-literal=GITHUB_TOKEN=$GITHUB_TOKEN \
  --from-literal=DATABASE_URL=$DATABASE_URL \
  --from-literal=REDIS_URL=$REDIS_URL \
  -n ai-showcase

# Option 3: External Secret Operator (best practice)
# Use AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets-system \
  --create-namespace
```

### Step 3: Create Registry Secret
```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_USERNAME \
  --docker-password=$GITHUB_TOKEN \
  --docker-email=$EMAIL \
  -n ai-showcase

# Verify
kubectl get secret ghcr-secret -n ai-showcase
```

### Step 4: Deploy Services & Storage
```bash
# Deploy Service
kubectl apply -f manifests/ai-showcase/service.yaml

# Verify
kubectl get svc -n ai-showcase
kubectl get svc ai-showcase-app -n ai-showcase

# Get LoadBalancer external IP (may take 1-2 minutes)
kubectl get svc ai-showcase-app -n ai-showcase -w
```

### Step 5: Deploy Standard Deployment (Optional)
```bash
# Deploy standard Kubernetes Deployment (optional, for reference)
kubectl apply -f manifests/ai-showcase/deployment.yaml

# Verify
kubectl get deployment -n ai-showcase
kubectl get pods -n ai-showcase
```

### Step 6: Deploy Argo Rollout
```bash
# Deploy Argo Rollout
kubectl apply -f manifests/ai-showcase/rollout.yaml

# Verify
kubectl get rollout -n ai-showcase
kubectl describe rollout ai-showcase-app -n ai-showcase

# Watch rollout status
kubectl argo rollouts get rollout ai-showcase-app -n ai-showcase -w
```

### Step 7: Deploy ArgoCD Application
```bash
# Deploy ArgoCD application
kubectl apply -f manifests/ai-showcase/argocd-app.yaml

# Verify
kubectl get application -n argocd
kubectl describe application ai-showcase -n argocd
```

---

## ✅ Verification & Testing

### Verify All Resources
```bash
# List all resources in namespace
kubectl get all -n ai-showcase

# Check pods are running
kubectl get pods -n ai-showcase
# Expected: All pods should be in 'Running' state

# Check services
kubectl get svc -n ai-showcase
# Expected: ai-showcase-app LoadBalancer should have External-IP

# Check rollout
kubectl get rollout -n ai-showcase
# Expected: Rollout should show desired replicas = current replicas
```

### Test Application Endpoints
```bash
# Get LoadBalancer IP
EXTERNAL_IP=$(kubectl get svc ai-showcase-app -n ai-showcase \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "External IP: $EXTERNAL_IP"

# Test endpoints
curl http://$EXTERNAL_IP/status
curl http://$EXTERNAL_IP/health
curl http://$EXTERNAL_IP/ready
curl http://$EXTERNAL_IP/metrics
```

### Test Canary Rollout
```bash
# Update image to trigger new rollout
kubectl patch rollout ai-showcase-app -n ai-showcase \
  --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/image", 
       "value":"ghcr.io/your-org/ai-showcase-app:test-v2"}]'

# Watch canary progress
kubectl argo rollouts get rollout ai-showcase-app -n ai-showcase -w

# Or describe for detailed status
kubectl describe rollout ai-showcase-app -n ai-showcase
```

### Test ArgoCD Sync
```bash
# Check if app is synced
kubectl get application ai-showcase -n argocd -o yaml | grep syncStatus

# If out of sync, manually sync
kubectl patch application ai-showcase -n argocd \
  -p '{"spec":{"syncPolicy":{"automated":{"prune":true,"selfHeal":true}}}}' \
  --type merge
```

---

## 🔐 Production Hardening

### 1. Security Best Practices

```bash
# Apply network policies
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-showcase-network-policy
  namespace: ai-showcase
spec:
  podSelector:
    matchLabels:
      app: ai-showcase
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector: {}
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53      # DNS
    - protocol: UDP
      port: 53
EOF
```

### 2. Resource Quotas

```bash
# Apply resource quotas to namespace
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ai-showcase-quota
  namespace: ai-showcase
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"
    services: "10"
EOF
```

### 3. Pod Disruption Budgets

```bash
# Ensure high availability during disruptions
kubectl apply -f - <<EOF
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ai-showcase-pdb
  namespace: ai-showcase
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: ai-showcase
EOF
```

### 4. HTTPS/TLS Setup

```bash
# Create Ingress with TLS (using cert-manager)
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Create Ingress with TLS
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-showcase-ingress
  namespace: ai-showcase
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ai-showcase.your-domain.com
    secretName: ai-showcase-tls
  rules:
  - host: ai-showcase.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-showcase-app
            port:
              number: 80
EOF
```

### 5. Container Image Scanning

```bash
# Use Trivy for vulnerability scanning
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ghcr.io/your-org/ai-showcase-app:latest

# Automated scanning in pipeline (see .github/workflows/ci-cd.yml)
```

---

## 📊 Monitoring & Alerting

### Configure Prometheus Metrics
```bash
# Create ServiceMonitor for Prometheus
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ai-showcase
  namespace: ai-showcase
spec:
  selector:
    matchLabels:
      app: ai-showcase
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
EOF
```

### Setup Alerts
```bash
# Create PrometheusRule for alerts
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ai-showcase-alerts
  namespace: ai-showcase
spec:
  groups:
  - name: ai-showcase
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
      for: 5m
      annotations:
        summary: High error rate detected
    
    - alert: HighLatency
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
      for: 5m
      annotations:
        summary: High latency detected
EOF
```

---

## 🔄 Rollback Procedures

### Immediate Rollback (Canary)
```bash
# Automatic: Argo Rollouts will rollback if metrics fail
# Manual: Abort canary rollout
kubectl argo rollouts abort rollout ai-showcase-app -n ai-showcase

# Manually promote canary to full rollout
kubectl argo rollouts promote rollout ai-showcase-app -n ai-showcase

# Rollback to previous version
kubectl argo rollouts undo rollout ai-showcase-app -n ai-showcase
```

### Git-Based Rollback (ArgoCD)
```bash
# Revert commit in Git
git revert <commit-hash>
git push origin demo

# ArgoCD automatically syncs and reverts deployment
argocd app sync ai-showcase

# Or manual sync
kubectl patch application ai-showcase -n argocd \
  -p '{"spec":{"syncPolicy":{"automated":{"prune":true}}}}' \
  --type merge
```

### Force Rollback
```bash
# Delete current rollout
kubectl delete rollout ai-showcase-app -n ai-showcase

# Reapply old version from Git
git checkout <old-commit> manifests/ai-showcase/rollout.yaml
kubectl apply -f manifests/ai-showcase/rollout.yaml
```

---

## 🎯 Post-Deployment Checklist

- [ ] All pods running and healthy
- [ ] Services accessible via external IP/DNS
- [ ] ArgoCD application synced
- [ ] Canary rollout working correctly
- [ ] Metrics being collected by Prometheus
- [ ] Alerts configured and testing
- [ ] GitHub Actions secrets configured
- [ ] MTTR dashboard showing data
- [ ] Backup/restore procedures documented
- [ ] Team trained on GitOps workflow

---

## 📞 Support Commands

```bash
# Debug pod issues
kubectl logs pod-name -n ai-showcase
kubectl describe pod pod-name -n ai-showcase
kubectl exec -it pod-name -n ai-showcase -- /bin/sh

# Check resource usage
kubectl top pods -n ai-showcase
kubectl top nodes

# View events
kubectl get events -n ai-showcase --sort-by='.lastTimestamp'

# Get detailed application info
kubectl get application ai-showcase -n argocd -o yaml
kubectl describe application ai-showcase -n argocd

# Check ArgoCD server logs
kubectl logs -n argocd deployment/argocd-server
```

---

**Deployment complete! Your AI-Assisted CI/CD pipeline is now running.** 🎉

For monitoring and observability, see: [README.md](README.md#monitoring--dashboards)
