# ------------------------------------------------------------------------------
# Environment
# ------------------------------------------------------------------------------
variable "environment" {
  type        = string
  description = "The environment name, defined in envrionments vars."
}
variable "aws_region" {
  default     = "eu-west-2"
  type        = string
  description = "The AWS region for deployment."
}
variable "aws_profile" {
  default     = "development-eu-west-2"
  type        = string
  description = "The AWS profile to use for deployment."
}
variable "kms_alias" {
  type = string
}
# ------------------------------------------------------------------------------
# Terraform
# ------------------------------------------------------------------------------
variable "aws_bucket" {
  type        = string
  description = "The bucket used to store the current terraform state files"
}
variable "remote_state_bucket" {
  type        = string
  description = "Alternative bucket used to store the remote state files from ch-service-terraform"
}
variable "state_prefix" {
  type        = string
  description = "The bucket prefix used with the remote_state_bucket files."
}
variable "deploy_to" {
  type        = string
  description = "Bucket namespace used with remote_state_bucket and state_prefix."
}

# ------------------------------------------------------------------------------
# Docker Container
# ------------------------------------------------------------------------------
variable "docker_registry" {
  type        = string
  description = "The FQDN of the Docker registry."
}

# ------------------------------------------------------------------------------
# Service performance and scaling configs
# ------------------------------------------------------------------------------
variable "desired_task_count" {
  type        = number
  description = "The desired ECS task count for this service"
  default     = 1 # defaulted low for dev environments, override for production
}
variable "required_cpus" {
  type        = number
  description = "The required cpu resource for this service. 1024 here is 1 vCPU"
  default     = 128 # defaulted low for dev environments, override for production
}
variable "required_memory" {
  type        = number
  description = "The required memory for this service"
  default     = 256 # defaulted low for node service in dev environments, override for production
}

# ------------------------------------------------------------------------------
# Service environment variable configs
# ------------------------------------------------------------------------------
variable "log_level" {
  default     = "info"
  type        = string
  description = "The log level for services to use: trace, debug, info or error"
}

variable "lfp_appeals_frontend_version" {
  type        = string
  description = "The version of the ldp appeals frontend container to run."
}

variable "api_url" {
  type = string
}

variable "account_web_url" {
  type = string
}

variable "allowed_company_prefixes" {
  type = string
}

variable "appeals_api_url" {
  type = string
}

variable "cdn_host" {
  type = string
}

variable "chs_url" {
  type = string
}

variable "company_auth_verification_feature_enabled" {
  type    = string
  default = "1"
}

variable "cookie_domain" {
  type = string
}

variable "cookie_name" {
  type    = string
  default = "__SID"
}

variable "default_session_expiration" {
  type    = string
  default = "3600"
}

variable "default_team_email" {
  type = string
}

variable "enquiry_email" {
  type = string
}

variable "file_transfer_api_url" {
  type = string
}

variable "human_log" {
  type    = string
  default = "1"
}

variable "illness_reason_feature_enabled" {
  type    = string
  default = "1"
}

variable "kafka_broker_addr" {
  type = string
}

variable "max_file_size_bytes" {
  type    = string
  default = "4194304"
}

variable "max_number_of_files" {
  type    = string
  default = "10"
}

variable "ni_team_email" {
  type = string
}

variable "piwik_site_id" {
  type = string
}

variable "piwik_url" {
  type = string
}

variable "sc_team_email" {
  type = string
}

variable "supported_mime_types" {
  type = string
}

variable "node_env" {
  type = string
}

variable "tz" {
  type = string
}
