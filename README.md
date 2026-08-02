# Swappable
Group Project CT5179


## Prerequisites

Make sure you have installed:

- Java 17
- Node.js 22
- Git

## Running the Project

### 1. Clone the repo

- git clone https://github.com/JoeQuigley1/Swappable.git

- cd swappable
---
### Backend

cd backend
./mvnw spring-boot:run


runs on:
http://localhost:8080


---
### 🎨 Frontend (React + Vite)


### Frontend

- cd frontend
- npm install
- npm run dev

  Runs on:
  http://localhost:5173

  
### Branching
-main contains stable production-ready code
 - develop is the shared integration branch
 - all new work is created from develop using feature branches
 - all changes must be merged by pull request
 - pull requests require approval and passing CI checks
 - only stable tested code is merged from develop into main

### Create Feature Branch
- git checkout develop
- git pull origin develop
- git checkout -b feature/name

example "git checkout -b feature/auth-backend"

### Work + Commit

git add .
git commit -m "Add login endpoint"

### Push Branch
- On first push "git push -u origin feature/name"
- Any subsequent push can just use "git push" 

The u sets the branch upstream 

### Open Pull Request 
In GitHub:

From: feature/...
Into: develop

This triggers:

CI
review
ruleset checks


## Dont forget to keep branch up to date 
- git checkout develop
- git pull origin develop
- git checkout feature/name
- git merge develop

## Environment Variables

Create `backend/src/main/resources/application.properties`
(or use your IDE Run Configuration) and configure:

- PostgreSQL username
- PostgreSQL password
- JWT secret
- Brevo API key (optional)

## Database Setup
- You need PostgreSQL installed on your computer before running the backend.
- Download and install PostgreSQL from https://www.postgresql.org/download.
- During installation you will be asked to set a password for the postgres user (write this down as you will need it later).
- Once installed, open pgAdmin and create Database named "swappable".
- Then open the file backend/src/main/resources/application.properties and replace your_postgres_password_here with the password you set during installation.
- When you run the backend Flyway will automatically create all the tables in your database.
- Flyway automatically applies database migrations when the backend starts.

## Running with Docker

- Ensure Docker Desktop is installed and running.
- From the backend directory run:
   docker compose up --build 
- Access the backend at http://localhost:8080. 
- Connect to PostgreSQL on localhost:5433 (if using the Docker port mapping).
- To stop docker run docker compose down 

## Testing and CI

The project uses GitHub Actions to run checks on pull requests and pushes to `develop` and `main`.

The pipeline includes:

- Backend Maven build and tests
- Frontend build
- Docker-based smoke test
- Newman/Postman API smoke collection



### Install Newman

Newman is the command-line runner for Postman collections.

Install globally with npm:

```bash
npm install -g newman
```

Verify the installation:

```bash
newman -v
```

## Running Tests

### Run smoke tests locally

Ensure the backend and PostgreSQL containers are running:

```bash
cd backend
docker compose up --build -d
```

From the repository root:

```bash
newman run postman/swappable-smoke.postman_collection.json --env-var baseUrl=http://localhost:8080
```



### Backend Tests

Run all backend JUnit tests:

```bash
cd backend
./mvnw test
```

This executes the backend unit and integration tests.

---

### Frontend Tests

Install dependencies (if not already installed):

```bash
cd frontend
npm install
```

Run the Vitest test suite:

```bash
npm test
```

Alternatively (if your project uses the Vite default):

```bash
npm run test
```

Run the tests with coverage:

```bash
npm run test:coverage
```

## Performance Testing

Performance testing was conducted manually using Grafana k6.

### Prerequisites

- Docker Desktop
- Grafana k6 (https://grafana.com/docs/k6/latest/set-up/install-k6/)

### Run the performance test

Start the backend and PostgreSQL containers:

```bash
cd backend
docker compose up --build -d
```

Verify the backend is running:

```
http://localhost:8080/api/items
```

Run the load test:

```bash
k6 run -e BASE_URL=http://localhost:8080 load/load.js
```

> **Note:** If `k6` is not available on your system PATH, use the full executable path, for example:
>
> ```bash
> "C:\Program Files\k6\k6.exe" run -e BASE_URL=http://localhost:8080 load/load.js
> ```
The load test targets the public GET /api/items endpoint and gradually increases to 50 concurrent virtual users before ramping down.


Stop the containers when finished:

```bash
docker compose down
```

---


## Live Deployment

Frontend:
https://swappable-frontend.onrender.com/

Backend health:
https://swappable-33ns.onrender.com/api/health

> **Note**
>
> The backend is hosted on Render's free tier.
> If inactive, the first request may take around 30–60 seconds while the service starts.

## Technology Stack

- React + Vite
- Spring Boot 3
- PostgreSQL
- Flyway
- Docker
- GitHub Actions
- JUnit
- Vitest
- Newman
- k6