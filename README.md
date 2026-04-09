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