terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# --- Cloud Storage for Documents ---
resource "google_storage_bucket" "omnimind_docs" {
  name          = "${var.project_id}-omnimind-documents"
  location      = var.region
  force_destroy = true
  uniform_bucket_level_access = true
}

# --- Cloud SQL (PostgreSQL) ---
resource "google_sql_database_instance" "omnimind_db_instance" {
  name             = "omnimind-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"
  }
  deletion_protection = false
}

resource "google_sql_database" "omnimind_db" {
  name     = "omniminddb"
  instance = google_sql_database_instance.omnimind_db_instance.name
}

resource "google_sql_user" "omnimind_user" {
  name     = "omnimind_user"
  instance = google_sql_database_instance.omnimind_db_instance.name
  password = var.db_password
}

# --- Artifact Registry ---
resource "google_artifact_registry_repository" "omnimind_repo" {
  location      = var.region
  repository_id = "omnimind-repo"
  description   = "Docker repository for OmniMind frontend and backend"
  format        = "DOCKER"
}

# --- Service Account & IAM ---
resource "google_service_account" "backend_sa" {
  account_id   = "omnimind-backend-sa"
  display_name = "OmniMind Backend Service Account"
}

resource "google_project_iam_member" "vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_storage_bucket_iam_member" "gcs_admin" {
  bucket = google_storage_bucket.omnimind_docs.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.backend_sa.email}"
}

# --- Cloud Run: Backend ---
resource "google_cloud_run_v2_service" "omnimind_backend" {
  name     = "omnimind-backend"
  location = var.region

  template {
    service_account = google_service_account.backend_sa.email
    containers {
      # Use a placeholder image initially. You must push your real image and run terraform apply again.
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      
      env {
        name  = "DATABASE_URL"
        value = "postgresql://omnimind_user:${var.db_password}@/omniminddb?host=/cloudsql/${google_sql_database_instance.omnimind_db_instance.connection_name}"
      }
      
      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.omnimind_docs.name
      }
      
      env {
        name  = "GCP_PROJECT"
        value = var.project_id
      }
      
      env {
        name  = "GCP_LOCATION"
        value = var.region
      }
    }
    
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.omnimind_db_instance.connection_name]
      }
    }
  }
}

# --- Cloud Run: Frontend ---
resource "google_cloud_run_v2_service" "omnimind_frontend" {
  name     = "omnimind-frontend"
  location = var.region

  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      env {
        name  = "VITE_API_BASE_URL"
        value = google_cloud_run_v2_service.omnimind_backend.uri
      }
    }
  }
}

# Allow public access to frontend
resource "google_cloud_run_v2_service_iam_member" "frontend_public_access" {
  name     = google_cloud_run_v2_service.omnimind_frontend.name
  location = google_cloud_run_v2_service.omnimind_frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow public access to backend (or restrict it to frontend only using CORS/IAM if preferred)
resource "google_cloud_run_v2_service_iam_member" "backend_public_access" {
  name     = google_cloud_run_v2_service.omnimind_backend.name
  location = google_cloud_run_v2_service.omnimind_backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
