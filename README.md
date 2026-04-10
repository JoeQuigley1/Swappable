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

## Database Setup
-You need PostgreSQL installed on your computer before running the backend.
-Download and install PostgreSQL from https://www.postgresql.org/download. During installation you will be asked to set a password for the postgres user (write this down as you will need it later).
-Once installed, open pgAdminand create Database named "swappable".
-Then open the file backend/src/main/resources/application.properties and replace your_postgres_password_here with the password you set during installation.
-When you run the backend Flyway will automatically create all the tables in your database.
