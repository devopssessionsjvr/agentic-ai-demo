# 🚀 AI-Assisted CI/CD with Kubernetes & Argo Rollouts

Complete, production-ready CI/CD workflow demonstrating **AI-assisted auto-fixing**, **GitOps with ArgoCD**, **canary deployments with Argo Rollouts**, and **MTTR dashboard**.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Features](#key-features)
- [Workflow Explanation](#workflow-explanation)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the CI/CD Pipeline](#running-the-cicd-pipeline)
- [Monitoring & Dashboards](#monitoring--dashboards)
- [Troubleshooting](#troubleshooting)
- [Client Presentation Points](#client-presentation-points)

---

## 🏗️ Architecture Overview

```
Developer Push to 'demo' Branch
        ↓
GitHub Actions Triggers
        ↓
┌─────────────────────────────────────┐
│  1. Security Scan (Trivy)           │
│  2. Run Tests (Jest)                │
└─────────────────────────────────────┘
        ↓
    Tests Failed?
    /           \
  YES            NO
  ↓              ↓
┌──────────────────┐  ┌─────────────────┐
│ 3a. AI Auto-Fix  │  │ 3b. Skip Auto-  │
│    (GPT-4)       │  │    fix, Continue│
│ - Analyze Errors │  └─────────────────┘
│ - Generate Fix   │        ↓
│ - Create PR      │  ┌──────────────────────┐
│ - Commit Changes │  │ 4. Build Docker      │
└──────────────────┘  │    Image             │
        ↓            │ - Multi-stage build  │
    Tests Pass   │ - Scan for vulns     │
        ↓            │ - Push to GHCR       │
┌──────────────────────────────────────┐
│ 5. Update Kubernetes Manifest        │
│ - Update image tag in rollout.yaml   │
│ - Update MTTR dashboard JSON         │
│ - Commit changes to demo branch      │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│ 6. ArgoCD Detects Changes            │
│ - Polls repository (or webhook)      │
│ - Syncs manifests to Kubernetes      │
│ - Creates/Updates Rollout resource   │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│ 7. Canary Rollout Progresses         │
│ Step 1: 10% traffic (5 min) ↓         │
│ Step 2: 25% traffic (5 min) ↓         │
│ Step 3: 50% traffic (5 min) ↓         │
│ Step 4: 75% traffic (5 min) ↓         │
│ Step 5: 100% traffic (Complete)     │
│                                      │
│ Automatic rollback if metrics fail  │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│ 8. MTTR Dashboard Updates            │
│ - Record deployment metrics          │
│ - Track canary progression           │
│ - Calculate MTTR (Mean Time to       │
│   Recovery)                          │
└──────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. **AI-Assisted Auto Fix** 🤖
- Automatically detects test failures
- Calls OpenAI GPT-4 API to analyze issues
- Generates code fixes
- Creates pull request with fixes
- Allows team review before merge

**Example Flow:**
```
Test Fails → AI Analyzes → PR Created → Team Reviews → Merge → Deploy
```

### 2. **GitOps with ArgoCD** 🔄
- Single source of truth: Git repository
- ArgoCD continuously syncs manifests
- Changes to Git automatically deploy
- Built-in rollback capabilities
- Declarative infrastructure

### 3. **Canary Deployments** 📊
- Gradual traffic shifting (10% → 25% → 50% → 75% → 100%)
- Automatic validation at each step
- Metrics-based rollback on failure
- Zero-downtime deployments
- Risk mitigation for critical apps

### 4. **MTTR Dashboard** 📈
- Tracks deployment metrics
- Calculates Mean Time To Recovery
- Shows AI fix effectiveness
- Visual representation of canary progress
- Historical data for trend analysis

### 5. **Security & Best Practices** 🔒
- Multi-stage Docker builds (optimized images)
- Non-root container execution
- Security scanning with Trivy
- RBAC controls
- Resource limits and requests
- Health probes (liveness, readiness, startup)

---

## 🔄 Workflow Explanation

### Step-by-Step Execution

#### **Phase 1: Initial Setup**
Developer pushes code to `demo` branch → GitHub Actions workflow triggers automatically.

#### **Phase 2: Tests & Security**
1. **Security Scan** - Trivy scans Docker image for vulnerabilities
2. **Unit Tests** - Jest runs all tests in `/app/tests/`
   - Tests check: `/status` endpoint, health checks, error handling
   - Coverage enforced at 70% minimum

#### **Phase 3: If Tests Fail**
1. **AI Analysis** - GitHub Actions calls OpenAI API
   - Analyzes test failure stack traces
   - Generates root cause analysis
   - Proposes code fixes

2. **Auto-Fix Branch** - Creates new branch: `ai-fix/test-failure-{timestamp}`
   - Applies AI-generated fixes
   - Adds documentation of changes
   - Commits to new branch

3. **Pull Request** - Creates PR with:
   - Detailed AI analysis
   - Fix explanation
   - Link to workflow run
   - Request for review

4. **Manual Review** - Team reviews and approves/rejects

#### **Phase 4: Build & Push**
- Builds Docker image with multi-stage approach
- Scans Docker image for vulnerabilities
- Pushes to GitHub Container Registry (GHCR)
- Tags with: `branch-{commit_sha_short}` (e.g., `demo-abc123de`)

#### **Phase 5: Update Manifests**
- Updates `manifests/ai-showcase/rollout.yaml` with new image tag
- Updates `dashboard/mttr.json` with deployment record
- Commits changes back to `demo` branch

#### **Phase 6: ArgoCD Synchronization**
1. **Change Detection** - ArgoCD polls repository (default: every 3 minutes)
   - Alternatively: Webhook triggers instant sync
   
2. **Manifest Sync** - ArgoCD applies manifests to Kubernetes cluster
   - Creates/Updates resources in `ai-showcase` namespace
   - Matches desired state (Git) with live state (cluster)

3. **Rollout Initiation** - Argo Rollouts resource created/updated
   - New ReplicaSet created with updated image
   - Old ReplicaSet kept for rollback
   - Traffic routing configured

#### **Phase 7: Canary Rollout Progression**

**Step 1: 10% Canary (5 minutes)**
- 1 out of 10 pods runs new version
- 10% of traffic routed to canary
- Prometheus metrics collected
- Error rate checked: must be ≤ 1%
- Response time checked: p95 must be ≤ 500ms

```
Active Pods:  [NEW, OLD, OLD, OLD, OLD, OLD, OLD, OLD, OLD, OLD]
Traffic:      10% → NEW,  90% → OLD
```

**Step 2: 25% Canary (5 minutes)**
- 2-3 out of 10 pods run new version
- 25% of traffic routed to canary
- Validation repeated

**Step 3: 50% Blue-Green (5 minutes)**
- Half the cluster on new version
- 50% traffic split
- Higher confidence in new version

**Step 4: 75% Canary (5 minutes)**
- 7-8 out of 10 pods run new version
- 75% traffic routed to canary
- Final validation

**Step 5: 100% Rollout (Complete)**
- All pods running new version
- 100% traffic to new version
- Old ReplicaSet retained for quick rollback

**Automatic Rollback Example:**
- If error rate > 1% at any step → automatically rollback
- If response time p95 > 500ms → automatically rollback
- Manual rollback available anytime

#### **Phase 8: MTTR Dashboard Update**
- Records deployment start/end times
- Calculates MTTR (minutes)
- Stores: commit hash, author, test status, AI fix status, canary progress
- Updates aggregate statistics

---

## 📁 Project Structure

```
agentic-ai-demo/
├── app/                                    # Node.js Express Application
│   ├── app.js                              # Main Express server
│   ├── package.json                        # Dependencies
│   ├── jest.config.js                      # Jest test configuration
│   ├── Dockerfile                          # Multi-stage production build
│   ├── .dockerignore                       # Docker build exclusions
│   ├── .env.example                        # Environment variables template
│   └── tests/
│       └── app.test.js                     # Unit tests (Jest)
│
├── manifests/
│   └── ai-showcase/                        # Kubernetes manifests (GitOps)
│       ├── namespace.yaml                  # ai-showcase namespace
│       ├── configmap.yaml                  # App config & MTTR schema
│       ├── secret.yaml                     # API keys (reference only)
│       ├── deployment.yaml                 # Standard Kubernetes Deployment
│       ├── service.yaml                    # LoadBalancer Service
│       ├── rollout.yaml                    # Argo Rollout (canary config)
│       ├── rbac.yaml                       # ServiceAccount, Role, RoleBinding
│       └── argocd-app.yaml                 # ArgoCD Application & Project
│
├── dashboard/
│   └── mttr.json                           # MTTR Dashboard data
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                       # GitHub Actions Workflow
│           │
│           ├─ Job 1: Security Scan (Trivy)
│           ├─ Job 2: Run Tests (Jest)
│           ├─ Job 3: AI Auto-Fix (on test failure)
│           ├─ Job 4: Build Docker Image
│           ├─ Job 5: Update Kubernetes Manifest
│           ├─ Job 6: Watch ArgoCD Sync
│           └─ Job 7: Finalize Deployment
│
└── README.md                               # This file
```

---

## 📦 Prerequisites

### Local Development
- **Node.js** 18.x or later
- **npm** 8.x or later
- **Docker** (for building images)
- **kubectl** (for Kubernetes operations)

### Infrastructure
- **Kubernetes Cluster** (1.24+)
  - Options: EKS, GKE, AKS, or local (Minikube/Kind)
- **Argo Rollouts** installed in cluster
  ```bash
  kubectl apply -n argo-rollouts -f \
    https://github.com/argoproj/argo-rollouts/releases/download/stable/install.yaml
  ```
- **ArgoCD** installed in cluster
  ```bash
  kubectl create namespace argocd
  kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  ```
- **Prometheus** (optional, for metrics-based canary validation)

### GitHub Configuration
- Repository with GitHub Actions enabled
- **Secrets configured** in repository settings:
  - `OPENAI_API_KEY` - For AI-assisted fixes
  - `GITHUB_TOKEN` - For creating PRs (default provided)
  - `DOCKER_REGISTRY_TOKEN` - For GHCR push (if not using GitHub token)

### Container Registry
- **GitHub Container Registry (GHCR)** OR Docker Hub
- Credentials configured in GitHub Actions

---

## 🚀 Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/your-org/your-repo.git
cd agentic-ai-demo
```

### 2. Check Out Demo Branch
```bash
git checkout demo
# Or create if doesn't exist:
git checkout -b demo
```

### 3. Install Local Dependencies
```bash
cd app
npm install
npm install --save-dev  # dev dependencies for testing

# Verify installation
npm test
```

### 4. Configure Environment Variables
```bash
cp app/.env.example app/.env

# Edit .env with your values
nano app/.env
```

### 5. Build Docker Image Locally (Optional)
```bash
cd app
docker build -t ghcr.io/your-org/ai-showcase-app:local .
docker run -p 3000:3000 ghcr.io/your-org/ai-showcase-app:local
# Test: curl http://localhost:3000/status
```

### 6. Configure GitHub Secrets
```bash
# Go to: Settings → Secrets and variables → Actions
# Add:
#   - OPENAI_API_KEY=sk-...
#   - (GITHUB_TOKEN is provided by default)
```

### 7. Update Manifest Variables
Replace these in all manifests:
- `your-org` → Your GitHub organization
- `your-repo` → Your repository name
- `your-domain.com` → Your domain

```bash
# Batch replace (macOS):
find manifests -name "*.yaml" -exec sed -i '' 's|your-org|myorg|g' {} \;
find manifests -name "*.yaml" -exec sed -i '' 's|your-repo|myrepo|g' {} \;
```

### 8. Setup Kubernetes Namespace & Secrets
```bash
# Create namespace
kubectl create namespace ai-showcase

# Create registry secret for GHCR
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-token> \
  --docker-email=<email> \
  -n ai-showcase

# Create app secrets
kubectl apply -f manifests/ai-showcase/secret.yaml
```

### 9. Deploy ArgoCD Application
```bash
# Create ArgoCD app
kubectl apply -f manifests/ai-showcase/argocd-app.yaml

# Verify
kubectl get application -n argocd
```

---

## 🔥 Running the CI/CD Pipeline

### Trigger Option 1: Push to Demo Branch
```bash
git add .
git commit -m "feat: Add new feature"
git push origin demo

# GitHub Actions automatically triggers
# Check progress: GitHub → Actions tab
```

### Trigger Option 2: Manual Workflow Dispatch
```bash
# In GitHub UI:
# Actions → CI-CD Workflow → Run workflow → Select 'demo' branch
```

### Monitor Workflow Execution

**In GitHub:**
1. Go to `Settings → Actions`
2. Click on latest workflow run
3. View real-time logs:
   - Security Scan
   - Test Results
   - Docker Build
   - Manifest Updates

**In Kubernetes:**
```bash
# Watch manifest updates
kubectl get rollout -n ai-showcase -w

# View pod status
kubectl get pods -n ai-showcase -w

# Check canary progress
kubectl get rollout ai-showcase-app -n ai-showcase -o yaml | grep -A 10 'status'

# View events
kubectl get events -n ai-showcase --sort-by='.lastTimestamp'
```

**In ArgoCD UI:**
```bash
# Port-forward to ArgoCD
kubectl port-forward -n argocd svc/argocd-server 8080:443

# Open: https://localhost:8080
# Username: admin
# Password: $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

# Watch application sync
```

---

## 📈 Monitoring & Dashboards

### MTTR Dashboard (JSON View)
Access `dashboard/mttr.json` to see deployment metrics

### Kubernetes Dashboards
```bash
# Helm chart for monitoring setup (optional):
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# View metrics
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Open: http://localhost:9090
```

---

## 🔧 Troubleshooting

### Issue: Tests Fail, AI Fix Not Created

**Cause:** OpenAI API key not configured

**Solution:**
```bash
# Verify secret exists
kubectl get secret -n ai-showcase ai-showcase-secrets

# Check GitHub secret
# Settings → Secrets → OPENAI_API_KEY
```

### Issue: ArgoCD Not Syncing

**Cause:** ArgoCD application not found or repo not accessible

**Solution:**
```bash
# Check ArgoCD app
kubectl get application -n argocd

# Check ArgoCD logs
kubectl logs -n argocd deployment/argocd-application-controller

# Manually sync
argocd app sync ai-showcase --grpc-web
```

### Issue: Canary Rollout Stuck at 10%

**Cause:** Metrics validation failing

**Solution:**
```bash
# Check Argo Rollout status
kubectl describe rollout ai-showcase-app -n ai-showcase

# View analysis results
kubectl get analysis -n ai-showcase
```

---

## 👥 Support

For questions or issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review logs: `kubectl logs -n ai-showcase -l app=ai-showcase`
3. Check GitHub Actions workflow runs
4. Open GitHub issue with logs

---

**Built with ❤️ for DevOps Excellence**
**Version:** 1.0.0 | **Status:** Production Ready ✅

