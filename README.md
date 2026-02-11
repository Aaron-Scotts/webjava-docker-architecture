# k8s-docker-project

Library-style full-stack sample with Docker + Kubernetes:
- `api` (Node/Express) book catalog, rentals, budgets, stats
- `auth` (Node/Express) registration + login backed by Postgres and Redis
- `frontend` (Nginx) UI with analytics charts

## Prereqs (Ubuntu)
- Docker
- kubectl
- minikube

## Build images inside minikube
```bash
minikube start
eval $(minikube -p minikube docker-env)

docker build -t api:1.0 ./api
docker build -t auth:1.0 ./auth
docker build -t frontend:1.0 ./frontend
```

## Deploy to Kubernetes
```bash
kubectl apply -f k8s/postgres-init-config.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/auth.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/frontend.yaml
```

## Access frontend
```bash
minikube service frontend
```

## Default accounts
- Admin: `admin@library.local` / `admin123`
- User: `demo@library.local` / `demo123`

## Key endpoints
- `POST /auth/register`
- `POST /auth/login`
- `GET /api/books`
- `POST /api/rentals`
- `GET /api/rentals/current`
- `GET /api/stats/user`
- `GET /api/admin/stats` (admin only)

## Test API locally from the cluster
```bash
kubectl get svc
kubectl port-forward svc/api 3000:3000
curl http://localhost:3000/health
```
