# Riubs Library - Documentation du projet

## 1) Resume
Ce projet est une application web complete (frontend + API + auth + base de donnees) deployee avec Docker et Kubernetes (minikube). Le frontend sert une interface de bibliotheque, l API gere les livres, locations, budgets et stats, et le service auth gere la connexion et les sessions par cookie.

admin users for test :
mail: admin@library.local
password: admin123

## 2) Architecture globale
- Frontend (React + Vite, servi par Nginx)
  - Build React/Vite en assets statiques
  - Nginx sert le site et proxy vers /api et /auth
- API (Node.js/Express)
  - Livres, locations, budgets, stats, favoris
  - Seeding Open Library si la base est vide
- Auth (Node.js/Express)
  - Login, register, validate, logout
  - Session par cookie HTTP only
- Postgres
  - Stockage donnees (users, books, rentals, custom_books, favorites)
- Redis
  - Tokens de session

## 3) Services Kubernetes
- Deployment + Service pour: api, auth, frontend, postgres, redis
- frontend expose via Service NodePort (cluster interne)
- acces depuis l exterieur via port-forward vers la VM

## 4) Donnees et tables principales
- users (name, email, role, budget)
- books (catalogue)
- rentals (locations)
- custom_books (livres uploades en JSON)
- favorite_books (favoris)

## 5) Flux utilisateur
1) L utilisateur se connecte via /auth/login
2) Le cookie est stocke par le navigateur
3) L API valide la session via /auth/validate
4) L utilisateur voit la bibliotheque et peut louer ou mettre en favori

## 6) Endpoints principaux
- POST /auth/register
- POST /auth/login
- GET /auth/validate
- POST /auth/logout
- GET /api/books
- POST /api/books (admin)
- POST /api/books/import (admin)
- POST /api/rentals
- GET /api/rentals/current
- GET /api/rentals/history
- GET /api/favorites
- POST /api/favorites
- GET /api/custom-books
- POST /api/custom-books/import
- GET /api/stats/user
- GET /api/admin/stats

## 7) Commandes curl (exemples)
Les exemples utilisent le point d acces expose par port-forward:
- depuis la machine hote: http://192.168.56.102:8080
- dans la VM: http://127.0.0.1:8080

### Login
```bash
curl -i -X POST http://192.168.56.102:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@library.local","password":"demo123"}'
```

### Valider la session (avec cookie)
```bash
curl -i http://192.168.56.102:8080/auth/validate \
  -H "Cookie: riubs_auth=VOTRE_TOKEN"
```

### Liste des livres
```bash
curl -s http://192.168.56.102:8080/api/books | head -c 300
```

### Louer un livre
```bash
curl -i -X POST http://192.168.56.102:8080/api/rentals \
  -H "Content-Type: application/json" \
  -H "Cookie: riubs_auth=VOTRE_TOKEN" \
  -d '{"bookId":1}'
```

### Favori (livre du catalogue)
```bash
curl -i -X POST http://192.168.56.102:8080/api/favorites \
  -H "Content-Type: application/json" \
  -H "Cookie: riubs_auth=VOTRE_TOKEN" \
  -d '{"bookId":1}'
```

### Upload JSON (admin -> import catalogue)
```bash
curl -i -X POST http://192.168.56.102:8080/api/books/import \
  -H "Content-Type: application/json" \
  -H "Cookie: riubs_auth=VOTRE_TOKEN" \
  -d '{"books":[{"title":"Book A","author":"Author A","category":"Tech","price":120}]}'
```

## 8) Acces externe (port-forward)
Le NodePort est expose sur l IP interne minikube (ex: 192.168.49.2),
donc depuis l exterieur de la VM on utilise un port-forward:

```bash
kubectl port-forward --address 0.0.0.0 svc/frontend 8080:80
```

Pour eviter de bloquer un terminal, un service systemd user est fourni:

```bash
systemctl --user status k8s-frontend-portforward.service
```

## 9) Build et deploy (rappel)
```bash
sg docker -c 'cd /home/aaron/Desktop/web-k8s-docker-project && eval $(minikube -p minikube docker-env --shell bash) && docker build -t api:1.0 ./api && docker build -t auth:1.0 ./auth && docker build -t frontend:1.0 ./frontend'

kubectl apply -f k8s/postgres-init-config.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/auth.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/frontend.yaml
kubectl rollout restart deployment/frontend

## 10) start the project pods
minikube start
```
