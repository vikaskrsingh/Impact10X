variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The GCP Region"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "The password for the Cloud SQL PostgreSQL instance"
  type        = string
  sensitive   = true
}

