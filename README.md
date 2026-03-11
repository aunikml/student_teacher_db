# BRAC IED SIM - Deployment Handbook

Comprehensive guide for deploying the **BRAC IED Student Information Management (SIM)** system on a production **Ubuntu** server.

**Architecture stack:**
- **Frontend** → React (static build served by Nginx)
- **Backend** → Django + Django REST Framework
- **Application server** → Gunicorn
- **Reverse proxy & static file server** → Nginx
- **Database** → PostgreSQL
- **Process manager** → systemd
- **CI/CD** → GitHub Actions (automatic deployment on push to `main`)

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Part I – Server Preparation (One-Time Setup)](#part-i--server-preparation-one-time-setup)
4. [Part II – Manual First-Time Deployment](#part-ii--manual-first-time-deployment)
5. [Part III – Production Service Configuration](#part-iii--production-service-configuration)
6. [Part IV – CI/CD Pipeline with GitHub Actions](#part-iv--cicd-pipeline-with-github-actions)
7. [Quick Troubleshooting Checklist](#quick-troubleshooting-checklist)

## Architecture Overview

- **Nginx**  
  Serves React static files, Django static/media, and proxies `/api/` requests to Gunicorn.

- **Gunicorn**  
  Runs the Django WSGI application.

- **PostgreSQL**  
  Production database.

- **systemd**  
  Keeps Gunicorn running as a reliable service.

- **GitHub Actions**  
  Automatically deploys on every push to the `main` branch.

## Prerequisites

- Ubuntu 22.04 LTS (or newer) server / VM with **root** or `sudo` access
- Domain or subdomain pointed to the server's public IP
- Private GitHub repository containing the project
- SSH access to the server

## Part I – Server Preparation (One-Time Setup)

SSH into your server and run:

```bash
# 1. Update system & install core packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y git python3-pip python3-venv build-essential python3-dev libpq-dev nginx curl

# 2. Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 3. Install latest LTS Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

#PostgreSQL Setup

sudo -i -u postgres psql
CREATE DATABASE brac_ied_sim_db;

CREATE USER brac_ied_sim_user WITH PASSWORD 'YOUR_STRONG_DATABASE_PASSWORD';

ALTER ROLE brac_ied_sim_user SET client_encoding TO 'utf8';
ALTER ROLE brac_ied_sim_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE brac_ied_sim_user SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE brac_ied_sim_db TO brac_ied_sim_user;

\q

#Project Directory
sudo mkdir -p /srv/brac-ied-sim
sudo chown -R $USER:$USER /srv/brac-ied-sim
#(replace $USER with your actual login username, e.g. ubuntu)

#Part II – Manual First-Time Deployment

#Clone Repository

cd /srv/brac-ied-sim
git clone https://github.com/YourUsername/YourRepositoryName.git .

#Backend Setup

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn psycopg2-binary python-decouple

#Create .env file:
nano .env

SECRET_KEY='your-very-long-random-secret-key'
DEBUG=False

DB_NAME='brac_ied_sim_db'
DB_USER='brac_ied_sim_user'
DB_PASSWORD='YOUR_STRONG_DATABASE_PASSWORD'
DB_HOST='localhost'
DB_PORT=5432

#Update backend/settings.py (important lines):

from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = ['your_domain.com', 'your.server.ip.address']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', cast=int),
    }
}

STATIC_ROOT = BASE_DIR / 'staticfiles'

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

#Frontend Buil
cd ../frontend
npm install
npm run build

#Part III – Production Service Configuration
#Gunicorn systemd Service

sudo nano /etc/systemd/system/gunicorn.socket

#content 

[Unit]
Description=gunicorn socket for BRAC IED SIM

[Socket]
ListenStream=/run/gunicorn.sock

[Install]
WantedBy=sockets.target

sudo nano /etc/systemd/system/gunicorn.service

#content 
[Unit]
Description=gunicorn daemon for BRAC IED SIM
Requires=gunicorn.socket
After=network.target

[Service]
User=your_username
Group=www-data
WorkingDirectory=/srv/brac-ied-sim/backend
ExecStart=/srv/brac-ied-sim/backend/venv/bin/gunicorn \
          --access-logfile - \
          --workers 3 \
          --bind unix:/run/gunicorn.sock \
          backend.wsgi:application

[Install]
WantedBy=multi-user.target

sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket
sudo systemctl status gunicorn.socket

#Nginx Configuration

sudo nano /etc/nginx/sites-available/brac_ied_sim

#content 
server {
    listen 80;
    server_name your_domain.com your.server.ip.address;

    client_max_body_size 20M;

    location /static/ {
        alias /srv/brac-ied-sim/backend/staticfiles/;
    }

    location /api/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /srv/brac-ied-sim/frontend/build;
        try_files $uri /index.html;
    }
}


sudo ln -s /etc/nginx/sites-available/brac_ied_sim /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # optional – remove default site
sudo nginx -t
sudo systemctl restart nginx

#Firewall
sudo ufw allow 'Nginx Full'
sudo ufw enable

#→ Application should now be live at http://your_domain.com

#Part IV – CI/CD Pipeline with GitHub Actions

#1. Generate Deploy Key (on server)

ssh-keygen -t ed25519 -C "github-actions-deploy-key" -f ~/.ssh/github_actions_deploy -N ""
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions_deploy
cat ~/.ssh/github_actions_deploy   # copy private key

#2. GitHub Repository Secrets

#Add these secrets in Settings → Secrets and variables → Actions:
#SERVER_HOST     – server public IP
#SERVER_USERNAME – e.g. ubuntu
#SERVER_SSH_KEY  – the private key you copied

#3. Allow passwordless sudo for services

sudo visudo

#Add at the end:

your_username ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart gunicorn, /usr/bin/systemctl restart nginx

#Create workflow file

#.github/workflows/deploy.yml

name: Deploy to Production Server

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Execute Deployment Commands via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USERNAME }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /srv/brac-ied-sim
            
            echo "--- Pulling latest code ---"
            git fetch origin main && git reset --hard origin/main
            
            echo "--- Deploying Django Backend ---"
            cd backend
            source venv/bin/activate
            pip install -r requirements.txt
            python manage.py migrate --noinput
            python manage.py collectstatic --noinput
            
            echo "--- Deploying React Frontend ---"
            cd ../frontend
            npm install
            npm run build
            
            echo "--- Restarting Gunicorn and Nginx ---"
            sudo systemctl restart gunicorn
            sudo systemctl restart nginx
            
            echo "--- Deployment Complete ---"

#Commit & push:

git add .github/workflows/deploy.yml
git commit -m "Add automated production deployment workflow"
git push origin main

# Quick Troubleshooting Checklist

# sudo systemctl status gunicorn → is socket/service active?
# sudo journalctl -u gunicorn -n 100 → backend errors?
# sudo nginx -t → config syntax ok?
# curl http://localhost:8000 (from server) → Django responding?
# Browser → check /api/ endpoint returns JSON, not 502
# Logs: /var/log/nginx/error.log


