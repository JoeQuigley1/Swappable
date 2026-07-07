# Swappable
Group Project CT5179


## Prerequisites

Make sure you have installed:

- Java 17
- Node.js 22
- Git

## Running the Project

### 1. Clone the repo

- git clone https://github.com/url

- cd swappable
---
### Backend

cd backend
./mvnw spring-boot:run


runs on http://localhost8080


---
### 🎨 Frontend (React + Vite)


### Frontend

- cd frontend
- npm install
- npm run dev

  Runs on:
  http://localhost:5173


## GitHub Workflow rules
### Branching
-main contains stable production-ready code
 - develop is the shared integration branch
 - all new work is created from develop using feature branches
 - all changes must be merged by pull request
 - pull requests require approval and passing CI checks
 - only stable tested code is merged from develop into main

## Useful commands:

### First Time setup
- main contains stable production-ready code
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