# TP5 DevOps — Pipeline CI/CD avec Jenkins & Docker

**Hanane | Master 2 DevOps | ENSET Mohammedia**

---

## Objectif

Mettre en place un pipeline CI/CD complet déclenché automatiquement à chaque `git push` :

```
git push → GitHub Webhook → Jenkins → Docker Build → Docker Hub → Deploy
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│             Machine locale              │
│                                         │
│  ┌─────────────┐    ┌────────────────┐  │
│  │   Jenkins   │    │  App Container │  │
│  │  port 9090  │───▶│   port 8080    │  │
│  └─────────────┘    └────────────────┘  │
│         │                               │
│   /var/run/docker.sock                  │
└─────────────────────────────────────────┘
         │                     ▲
         ▼                     │
    Docker Hub            git push
```

Jenkins communique avec Docker via le socket Unix (`/var/run/docker.sock`) plutôt qu'en exposant le port TCP 2375, ce qui est plus sécurisé.

---

## Structure du projet

```
devops-tp5/
├── src/
│   ├── index.js               # Serveur Express
│   └── public/
│       └── index.html         # Interface web
├── Dockerfile                 # Build multi-stage
├── docker-compose.yml         # Déploiement de l'app
├── docker-compose.jenkins.yml # Déploiement de Jenkins
├── Jenkinsfile                # Pipeline CI/CD (5 stages)
└── package.json
```

---

## Mise en place

### 1. Lancer Jenkins

```bash
docker compose -f docker-compose.jenkins.yml up -d
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Ouvrir **http://localhost:9090**, coller le mot de passe, installer les plugins suggérés.

### 2. Configurer les credentials

Dans **Manage Jenkins → Credentials → Global → Add Credentials** :
- Kind : `Username with password`
- Username : `hananenahim`
- Password : *(Docker Hub access token)*
- ID : `dockerhub-token`

### 3. Créer le job Pipeline

**New Item** → `devops-tp5` → Pipeline :
- Build Triggers : `GitHub hook trigger for GITScm polling`
- Pipeline : `Pipeline script from SCM` → Git
- Repository URL : `https://github.com/hannhm1109/devops-tp5.git`
- Branch : `*/main`
- Script Path : `Jenkinsfile`

### 4. Configurer le Webhook GitHub

Utiliser ngrok pour exposer Jenkins :
```bash
ngrok http 9090
```

Dans GitHub → **Settings → Webhooks → Add webhook** :
- Payload URL : `https://<ngrok-url>/github-webhook/`
- Content type : `application/json`
- Events : Push only

### 5. Pousser le code

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/hannhm1109/devops-tp5.git
git push -u origin main
```

---

## Les 5 stages du pipeline

| Stage | Description |
|-------|-------------|
| Checkout | Clone le repo depuis GitHub |
| Build | Construit l'image Docker taguée avec `$BUILD_NUMBER` |
| Push | Pousse l'image vers Docker Hub |
| Deploy | Déploie via `docker compose up` |
| Health Check | Vérifie que l'app répond en HTTP 200 |

---

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Interface web |
| `GET /health` | Statut, version, uptime |
| `GET /info` | Informations sur l'application |

---

## Vérification

```bash
curl http://localhost:8080/health
docker ps | grep devops-tp5
```
