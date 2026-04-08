# 🚀 Quick Start Guide: AI-Assisted CI/CD Setup

**Time to First Deployment:** ~30 minutes (with existing Kubernetes cluster)

---

## ⚡ Prerequisites Checklist

- [ ] Kubernetes cluster (1.24+) running
- [ ] `kubectl` configured and accessible
- [ ] Argo Rollouts installed
- [ ] ArgoCD installed
- [ ] GitHub repository access
- [ ] OpenAI API key
- [ ] Docker installed locally (for testing)

---

## 📋 Quick Setup (5 minutes)

### 1. Clone & Switch to Demo Branch
```bash
git clone https://github.com/your-org/your-repo.git
cd agentic-ai-demo
git checkout demo

# Or if demo branch doesn't exist:
git checkout -b demo
```

### 2. Replace Configuration Variables
```bash
# Edit these files and replace:
# - your-org → your GitHub organization
# - your-repo → your repository name

sed -i 's|your-org|YOUR_ORG|g' manifests/ai-showcase/*.yaml
sed -i 's|your-repo|YOUR_REPO|g' manifests/ai-showcase/*.yaml
sed -i 's|your-domain.com|YOUR_DOMAIN|g' manifests/ai-showcase/*.yaml
```

### 3. Create Kubernetes Namespace & Secrets
```bash
# Create namespace
kubectl create namespace ai-showcase

# Create registry secret for GHCR
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=YOUR_EMAIL \
  -n ai-showcase

# Deploy ConfigMap
kubectl apply -f manifests/ai-showcase/configmap.yaml

# Deploy Secret
kubectl apply -f manifests/ai-showcase/secret.yaml
```

### 4. Create GitHub Secrets
```bash
# Settings → Secrets and variables → Actions
# Add these secrets:

OPENAI_API_KEY=sk-...                    # Your OpenAI API key
GITHUB_TOKEN=ghp_...                     # (Optional, already provided)
```

### 5. Deploy ArgoCD Application
```bash
kubectl apply -f manifests/ai-showcase/argocd-app.yaml

# Verify
kubectl get application -n argocd
```

---

## 🧪 Test Locally (5 minutes)

```bash
# Install dependencies
cd app
npm install

# Run tests
npm test

# Start app
npm start

# In another terminal:
curl http://localhost:3000/status

# Expected output:
# {
#   "status": "ok",
#   "service": "ai-showcase-app",
#   "version": "1.0.0",
#   "uptime_seconds": 5,
#   ...
# }
```

---

## 🐳 Build & Push Docker Image (10 minutes)

```bash
cd app

# Build image
docker build -t ghcr.io/YOUR_ORG/YOUR_REPO/ai-showcase-app:test .

# Test locally
docker run -p 3000:3000 ghcr.io/YOUR_ORG/YOUR_REPO/ai-showcase-app:test

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Push image (skip if testing locally only)
docker push ghcr.io/YOUR_ORG/YOUR_REPO/ai-showcase-app:test
```

---

## 🚀 Trigger First Deployment

### Option A: Push Code
```bash
git add .
git commit -m "feat: initial AI-CD setup"
git push origin demo

# GitHub Actions automatically triggers workflow
# Check progress: GitHub → Actions tab
```

### Option B: Manual Trigger in GitHub UI
```
1. Go to Actions tab
2. Select "AI-Assisted CI/CD with Kubernetes & ArgoCD"
3. Click "Run workflow"
4. Select "demo" branch
5. Click "Run workflow"
```

---

## 📊 Monitor Deployment (10 minutes)

### Watch GitHub Actions
```
GitHub → Actions → Latest Run
- View real-time logs
- Check each job status
- Read job summaries
```

### Watch ArgoCD Sync
```bash
# Port-forward ArgoCD
kubectl port-forward -n argocd svc/argocd-server 8080:443 &

# Open: https://localhost:8080
# Username: admin
# Password: $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
```

### Watch Canary Rollout
```bash
# Real-time rollout progress
kubectl get rollout ai-showcase-app -n ai-showcase -w

# Detailed status
kubectl describe rollout ai-showcase-app -n ai-showcase

# Pod status
kubectl get pods -n ai-showcase -w

# Events
kubectl get events -n ai-showcase --sort-by='.lastTimestamp'
```

### Check MTTR Dashboard
```bash
cat dashboard/mttr.json | jq '.stats'

# Output shows:
# {
#   "total_deployments": 1,
#   "successful_deployments": 1,
#   "average_mttr_minutes": X.X,
#   ...
# }
```

---

## ✅ Verify Deployment Success

```bash
# Check all resources deployed
kubectl get all -n ai-showcase

# Get service external IP
kubectl get svc ai-showcase-app -n ai-showcase

# Test the endpoint
curl http://<EXTERNAL-IP>/status

# Expected: {"status": "ok", ...}
```

---

## 🔄 Typical Development Cycle

```bash
# 1. Make code changes
nano app/app.js

# 2. Test locally
npm test              # from app/ directory

# 3. Commit and push
git add .
git commit -m "feat: new feature"
git push origin demo

# 4. GitHub Actions runs automatically
# 5. ArgoCD syncs changes
# 6. Canary rollout progresses
# 7. MTTR dashboard updates
# 8. Done! ✅
```

---

## 🎯 Key Commands Reference

```bash
# Kubernetes
kubectl apply -f manifests/ai-showcase/namespace.yaml
kubectl get pods -n ai-showcase
kubectl logs ai-showcase-app -n ai-showcase
kubectl describe pod <pod-name> -n ai-showcase
kubectl delete deployment ai-showcase-app -n ai-showcase

# Argo Rollouts
kubectl get rollout -n ai-showcase
kubectl describe rollout ai-showcase-app -n ai-showcase
kubectl argo rollouts status ai-showcase-app -n ai-showcase
kubectl argo rollouts promote ai-showcase-app -n ai-showcase

# ArgoCD
argocd app list
argocd app get ai-showcase
argocd app sync ai-showcase
argocd app rollback ai-showcase

# Test & Debug Locally
npm test
npm start
docker build -t ghcr.io/YOUR_ORG/ai-showcase:local .
docker run -p 3000:3000 ghcr.io/YOUR_ORG/ai-showcase:local
```

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail locally | `npm install && npm test` |
| Docker build fails | Check Dockerfile path, ensure Docker running |
| ArgoCD not syncing | Check repo URL, verify credentials |
| Canary stuck at 10% | Check pod logs, verify metrics running |
| Image push fails | Verify GHCR authentication, check token |

---

## 📈 Expected Timeline

| Phase | Duration | Result |
|-------|----------|--------|
| Code push | 0 min | GitHub Actions triggered |
| Security scan | 2 min | Trivy scan results |
| Tests | 3 min | 10/10 tests passing ✅ |
| Build image | 4 min | Image pushed to GHCR |
| Manifest update | 1 min | rollout.yaml updated |
| ArgoCD sync | 2 min | Resources deployed |
| Canary step 1 | 5 min | 10% traffic, validating |
| Canary step 2 | 5 min | 25% traffic, validating |
| Canary step 3 | 5 min | 50% traffic, validating |
| Canary step 4 | 5 min | 75% traffic, validating |
| Canary complete | 1 min | 100% traffic, done ✅ |
| **Total MTTR** | **~25 min** | **Deployment complete** |

---

## 🎓 Learn More

- **README.md** - Comprehensive documentation
- **Argo Rollouts Docs** - https://argoproj.io/projects/argo-rollouts/
- **ArgoCD Docs** - https://argo-cd.readthedocs.io/
- **GitHub Actions Docs** - https://docs.github.com/en/actions
- **OpenAI API** - https://platform.openai.com/docs

---

## 🎉 Next Steps

1. ✅ Follow quick setup above
2. ✅ Deploy first version
3. ✅ Test canary rollout
4. ✅ Integrate with monitoring (Prometheus)
5. ✅ Setup alerts for MTTR dashboard
6. ✅ Train team on GitOps workflow
7. ✅ Scale to other microservices

---

**Need help?** Check [README.md](README.md) for detailed documentation.

**Last Updated:** April 2024
