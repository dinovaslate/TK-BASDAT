# Deploy Django Backend to Cloud Run with Cloud SQL PostgreSQL

This repository is a monorepo:

- React frontend: repo root (`src/`, `public/`, root `Dockerfile`)
- Django backend: `backend/` (`manage.py`, `backend/settings.py`, `backend/wsgi.py`)

The backend uses PostgreSQL. Ignore unrelated database instances for this app.

## 1. Configure Variables

PowerShell:

```powershell
$PROJECT_ID="your-gcp-project-id"
$REGION="asia-southeast2"
$SERVICE_NAME="tk-basdat-aeromiles-api"
$DB_INSTANCE="aeromiles-postgres"
$DB_NAME="aeromiles_db"
$DB_USER="aeromiles_app"
$DB_SCHEMA="public"
$FRONTEND_ORIGIN="https://tk-basdat-aeromiles-osvihgaoya-et.a.run.app"
$DB_PASSWORD_SECRET="django-backend-db-password"
$SECRET_KEY_SECRET="django-backend-secret-key"

gcloud config set project $PROJECT_ID
```

Use a strong password and keep it out of Git:

```powershell
$DB_PASSWORD=Read-Host "Cloud SQL database password"
$SECRET_KEY=Read-Host "Django SECRET_KEY"
```

Store them in Secret Manager:

```powershell
gcloud secrets describe $DB_PASSWORD_SECRET 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud secrets create $DB_PASSWORD_SECRET --replication-policy="automatic"
}

gcloud secrets describe $SECRET_KEY_SECRET 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud secrets create $SECRET_KEY_SECRET --replication-policy="automatic"
}

$tmpDb = New-TemporaryFile
[System.IO.File]::WriteAllText($tmpDb.FullName, $DB_PASSWORD, [System.Text.UTF8Encoding]::new($false))
gcloud secrets versions add $DB_PASSWORD_SECRET --data-file="$($tmpDb.FullName)"
Remove-Item -LiteralPath $tmpDb.FullName -Force

$tmpSecret = New-TemporaryFile
[System.IO.File]::WriteAllText($tmpSecret.FullName, $SECRET_KEY, [System.Text.UTF8Encoding]::new($false))
gcloud secrets versions add $SECRET_KEY_SECRET --data-file="$($tmpSecret.FullName)"
Remove-Item -LiteralPath $tmpSecret.FullName -Force
```

## 2. Enable Required APIs

```powershell
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Ensure the Artifact Registry repository used below exists:

```powershell
$AR_REPO_EXISTS=(gcloud artifacts repositories describe cloud-run-source-deploy --location=$REGION --format="value(name)" 2>$null)
if (-not $AR_REPO_EXISTS) {
  gcloud artifacts repositories create cloud-run-source-deploy `
    --repository-format=docker `
    --location=$REGION `
    --description="Cloud Run deployment images"
}
```

## 3. Create Cloud SQL PostgreSQL

```powershell
gcloud sql instances create $DB_INSTANCE `
  --database-version=POSTGRES_16 `
  --tier=db-f1-micro `
  --region=$REGION `
  --storage-type=SSD `
  --storage-size=10GB
```

Create the app database and user:

```powershell
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE

gcloud sql users create $DB_USER `
  --instance=$DB_INSTANCE `
  --password=$DB_PASSWORD
```

The deployment commands below default `DB_SCHEMA` to `public`. If you choose a custom schema, create it before migrations:

```powershell
gcloud sql connect $DB_INSTANCE --user=postgres --database=$DB_NAME
```

Then run this SQL in the `psql` prompt, replacing `aeromiles` and `aeromiles_app` if needed:

```sql
CREATE SCHEMA IF NOT EXISTS aeromiles AUTHORIZATION aeromiles_app;
GRANT ALL ON SCHEMA aeromiles TO aeromiles_app;
ALTER ROLE aeromiles_app SET search_path TO aeromiles,public;
```

## 4. Get Instance Connection Name

```powershell
$INSTANCE_CONNECTION_NAME=(gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
Write-Output $INSTANCE_CONNECTION_NAME
```

## 5. Grant Cloud Run Cloud SQL Access

The default Cloud Run service account is usually the Compute Engine default service account:

```powershell
$PROJECT_NUMBER=(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
$RUN_SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$RUN_SERVICE_ACCOUNT" `
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$RUN_SERVICE_ACCOUNT" `
  --role="roles/secretmanager.secretAccessor"
```

If you deploy with a custom service account, grant `roles/cloudsql.client` to that account instead.

## 6. Build Backend Container

The backend Dockerfile and backend requirements live under `backend/`, so build that folder:

```powershell
$IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$SERVICE_NAME`:latest"

gcloud builds submit `
  --config=cloudbuild.backend.yaml `
  --substitutions="_IMAGE=$IMAGE" `
  .
```

For direct Cloud Run source deployment, use `--source=backend`.

## 7. Deploy Backend to Cloud Run

```powershell
gcloud run deploy $SERVICE_NAME `
  --image=$IMAGE `
  --region=$REGION `
  --platform=managed `
  --allow-unauthenticated `
  --add-cloudsql-instances=$INSTANCE_CONNECTION_NAME `
  --set-env-vars="DEBUG=False,DB_NAME=$DB_NAME,DB_USER=$DB_USER,INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,DB_SCHEMA=$DB_SCHEMA,ALLOWED_HOSTS=.run.app,CSRF_TRUSTED_ORIGINS=https://*.run.app,$FRONTEND_ORIGIN,CORS_ALLOWED_ORIGINS=$FRONTEND_ORIGIN" `
  --set-secrets="DB_PASSWORD=$DB_PASSWORD_SECRET`:latest,SECRET_KEY=$SECRET_KEY_SECRET`:latest"
```

After deploy, capture the backend URL:

```powershell
$BACKEND_URL=(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
Write-Output $BACKEND_URL
```

The API base URL for the frontend is:

```powershell
$FRONTEND_API_BASE_URL="$BACKEND_URL/api"
Write-Output $FRONTEND_API_BASE_URL
```

## 8. Run Django Migrations with a Cloud Run Job

Create the job:

```powershell
gcloud run jobs create "$SERVICE_NAME-migrate" `
  --image=$IMAGE `
  --region=$REGION `
  --set-cloudsql-instances=$INSTANCE_CONNECTION_NAME `
  --set-env-vars="DEBUG=False,DB_NAME=$DB_NAME,DB_USER=$DB_USER,INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,DB_SCHEMA=$DB_SCHEMA,ALLOWED_HOSTS=.run.app,CSRF_TRUSTED_ORIGINS=https://*.run.app,$FRONTEND_ORIGIN,CORS_ALLOWED_ORIGINS=$FRONTEND_ORIGIN" `
  --set-secrets="DB_PASSWORD=$DB_PASSWORD_SECRET`:latest,SECRET_KEY=$SECRET_KEY_SECRET`:latest" `
  --command=/bin/sh `
  --args="-c,python manage.py migrate"
```

Execute and wait:

```powershell
gcloud run jobs execute "$SERVICE_NAME-migrate" --region=$REGION --wait
```

If the job already exists, update it instead:

```powershell
gcloud run jobs update "$SERVICE_NAME-migrate" `
  --image=$IMAGE `
  --region=$REGION `
  --set-cloudsql-instances=$INSTANCE_CONNECTION_NAME `
  --set-env-vars="DEBUG=False,DB_NAME=$DB_NAME,DB_USER=$DB_USER,INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,DB_SCHEMA=$DB_SCHEMA,ALLOWED_HOSTS=.run.app,CSRF_TRUSTED_ORIGINS=https://*.run.app,$FRONTEND_ORIGIN,CORS_ALLOWED_ORIGINS=$FRONTEND_ORIGIN" `
  --set-secrets="DB_PASSWORD=$DB_PASSWORD_SECRET`:latest,SECRET_KEY=$SECRET_KEY_SECRET`:latest" `
  --command=/bin/sh `
  --args="-c,python manage.py migrate"
```

## 9. Install Database Programs

The feature logic uses SQL triggers and stored procedures from `backend/sql/trigger_stored_procedure.sql`.
After the required AeroMiles tables exist, run the included management command:

```powershell
gcloud run jobs create "$SERVICE_NAME-install-db-programs" `
  --image=$IMAGE `
  --region=$REGION `
  --set-cloudsql-instances=$INSTANCE_CONNECTION_NAME `
  --set-env-vars="DEBUG=False,DB_NAME=$DB_NAME,DB_USER=$DB_USER,INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,DB_SCHEMA=$DB_SCHEMA,ALLOWED_HOSTS=.run.app,CSRF_TRUSTED_ORIGINS=https://*.run.app,$FRONTEND_ORIGIN,CORS_ALLOWED_ORIGINS=$FRONTEND_ORIGIN" `
  --set-secrets="DB_PASSWORD=$DB_PASSWORD_SECRET`:latest,SECRET_KEY=$SECRET_KEY_SECRET`:latest" `
  --command=/bin/sh `
  --args="-c,python manage.py install_db_programs"

gcloud run jobs execute "$SERVICE_NAME-install-db-programs" --region=$REGION --wait
```

## 10. Update Frontend API Base URL

The React app reads `REACT_APP_API_BASE_URL` at build time. Rebuild the existing frontend Cloud Run image with the backend API URL:

```powershell
$FRONTEND_SERVICE_NAME="tk-basdat-aeromiles"
$FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$FRONTEND_SERVICE_NAME`:latest"

gcloud builds submit `
  --config=cloudbuild.frontend.yaml `
  --substitutions="_IMAGE=$FRONTEND_IMAGE,_REACT_APP_API_BASE_URL=$FRONTEND_API_BASE_URL" `
  .
```

If using Docker directly, pass the build argument:

```powershell
docker build `
  --build-arg REACT_APP_API_BASE_URL=$FRONTEND_API_BASE_URL `
  -t $FRONTEND_IMAGE `
  .
```

Deploy the rebuilt frontend image:

```powershell
gcloud run deploy $FRONTEND_SERVICE_NAME `
  --image=$FRONTEND_IMAGE `
  --region=$REGION `
  --platform=managed `
  --allow-unauthenticated
```

## 11. Smoke Checks

```powershell
Invoke-WebRequest "$BACKEND_URL/api/health/" -UseBasicParsing
Invoke-WebRequest "$FRONTEND_ORIGIN" -UseBasicParsing
```
