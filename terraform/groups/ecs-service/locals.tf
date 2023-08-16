# Define all hardcoded local variable and local variables looked up from data resources
locals {
  stack_name                = "company-requests" # this must match the stack name the service deploys into
  name_prefix               = "${local.stack_name}-${var.environment}"
  service_name              = "lfp-appeals-frontend"
  container_port            = "3000" # default node port required here until prod docker container is built allowing port change via env var
  docker_repo               = "lfp-appeals-frontend"
  lb_listener_rule_priority = 13
  lb_listener_paths         = ["/appeal-a-penalty", "/appeal-a-penalty/.*"]
  healthcheck_path          = "/appeal-a-penalty" #healthcheck path for confirmation statement web
  healthcheck_matcher       = "200-302"           # no explicit healthcheck in this service yet, change this when added!

  service_secrets = jsondecode(data.vault_generic_secret.service_secrets.data_json)

  parameter_store_secrets = {
    "vpc_name"              = local.service_secrets["vpc_name"]
    "chs_api_key"           = local.service_secrets["chs_api_key"]
    "internal_api_url"      = local.service_secrets["internal_api_url"]
    "cdn_host"              = local.service_secrets["cdn_host"]
    "oauth2_auth_uri"       = local.service_secrets["oauth2_auth_uri"]
    "oauth2_redirect_uri"   = local.service_secrets["oauth2_redirect_uri"]
    "account_test_url"      = local.service_secrets["account_test_url"]
    "account_url"           = local.service_secrets["account_url"]
    "cache_server"          = local.service_secrets["cache_server"]
    "cookie_secret"         = local.service_secrets["cookie_secret"]
    "file_transfer_api_key" = local.service_secrets["file_transfer_api_key"]
    "oauth2_client_secret"  = local.service_secrets["oauth2_client_secret"]
    "oauth2_request_key"    = local.service_secrets["oauth2_request_key"]
    "oauth2_token_uri"      = local.service_secrets["oauth2_token_uri"]
    "oauth2_client_id"      = local.service_secrets["oauth2_client_id"]
  }

  vpc_name              = local.service_secrets["vpc_name"]
  chs_api_key           = local.service_secrets["chs_api_key"]
  internal_api_url      = local.service_secrets["internal_api_url"]
  cdn_host              = local.service_secrets["cdn_host"]
  oauth2_auth_uri       = local.service_secrets["oauth2_auth_uri"]
  oauth2_redirect_uri   = local.service_secrets["oauth2_redirect_uri"]
  account_test_url      = local.service_secrets["account_test_url"]
  account_url           = local.service_secrets["account_url"]
  cache_server          = local.service_secrets["cache_server"]
  cookie_secret         = local.service_secrets["cookie_secret"]
  file_transfer_api_key = local.service_secrets["file_transfer_api_key"]
  oauth2_client_secret  = local.service_secrets["oauth2_client_secret"]
  oauth2_request_key    = local.service_secrets["oauth2_request_key"]
  oauth2_token_uri      = local.service_secrets["oauth2_token_uri"]
  oauth2_client_id      = local.service_secrets["oauth2_client_id"]

  # create a map of secret name => secret arn to pass into ecs service module
  # using the trimprefix function to remove the prefixed path from the secret name
  secrets_arn_map = {
    for sec in data.aws_ssm_parameter.secret :
    trimprefix(sec.name, "/${local.name_prefix}/") => sec.arn
  }

  service_secrets_arn_map = {
    for sec in module.secrets.secrets :
    trimprefix(sec.name, "/${local.service_name}-${var.environment}/") => sec.arn
  }

  task_secrets = [
    { "name" : "CHS_DEVELOPER_CLIENT_ID", "valueFrom" : "${local.secrets_arn_map.web-oauth2-client-id}" },
    { "name" : "CHS_DEVELOPER_CLIENT_SECRET", "valueFrom" : "${local.secrets_arn_map.web-oauth2-client-secret}" },
    { "name" : "COOKIE_SECRET", "valueFrom" : "${local.secrets_arn_map.web-oauth2-cookie-secret}" },
    { "name" : "DEVELOPER_OAUTH2_REQUEST_KEY", "valueFrom" : "${local.secrets_arn_map.web-oauth2-request-key}" },
    { "name" : "CHS_API_KEY", "valueFrom" : "${local.service_secrets_arn_map.chs_api_key}" },
    { "name" : "CACHE_SERVER", "valueFrom" : "${local.service_secrets_arn_map.cache_server}" },
    { "name" : "OAUTH2_REDIRECT_URI", "valueFrom" : "${local.service_secrets_arn_map.oauth2_redirect_uri}" },
    { "name" : "OAUTH2_AUTH_URI", "valueFrom" : "${local.service_secrets_arn_map.oauth2_auth_uri}" },
    { "name" : "ACCOUNT_URL", "valueFrom" : "${local.service_secrets_arn_map.account_url}" },
    { "name" : "ACCOUNT_TEST_URL", "valueFrom" : "${local.service_secrets_arn_map.account_test_url}" },
    { "name" : "INTERNAL_API_URL", "valueFrom" : "${local.service_secrets_arn_map.internal_api_url}" }
  ]

  task_environment = [
    { "name" : "ACCOUNT_WEB_URL", "value" : "${var.account_web_url}" },
    { "name" : "ALLOWED_COMPANY_PREFIXES", "value" : "${var.allowed_company_prefixes}" },
    { "name" : "API_URL", "value" : "${var.api_url}" },
    { "name" : "APPEALS_API_URL", "value" : "${var.appeals_api_url}" },
    { "name" : "CDN_HOST", "value" : "${var.cdn_host}" },
    { "name" : "CHS_URL", "value" : "${var.chs_url}" },
    { "name" : "COMPANY_AUTH_VERIFICATION_FEATURE_ENABLED", "value" : "${var.company_auth_verification_feature_enabled}" },
    { "name" : "COOKIE_DOMAIN", "value" : "${var.cookie_domain}" },
    { "name" : "COOKIE_NAME", "value" : "${var.cookie_name}" },
    { "name" : "DEFAULT_SESSION_EXPIRATION", "value" : "${var.default_session_expiration}" },
    { "name" : "DEFAULT_TEAM_EMAIL", "value" : "${var.default_team_email}" },
    { "name" : "ENQUIRY_EMAIL", "value" : "${var.enquiry_email}" },
    { "name" : "FILE_TRANSFER_API_URL", "value" : "${var.file_transfer_api_url}" },
    { "name" : "HUMAN_LOG", "value" : "${var.human_log}" },
    { "name" : "ILLNESS_REASON_FEATURE_ENABLED", "value" : "${var.illness_reason_feature_enabled}" },
    { "name" : "KAFKA_BROKER_ADDR", "value" : "${var.kafka_broker_addr}" },
    { "name" : "LFP_APPEALS_FRONTEND_VERSION", "value" : "${var.lfp_appeals_frontend_version}" },
    { "name" : "LOG_LEVEL", "value" : "${var.log_level}" },
    { "name" : "MAX_FILE_SIZE_BYTES", "value" : "${var.max_file_size_bytes}" },
    { "name" : "MAX_NUMBER_OF_FILES", "value" : "${var.max_number_of_files}" },
    { "name" : "NI_TEAM_EMAIL", "value" : "${var.ni_team_email}" },
    { "name" : "PIWIK_SITE_ID", "value" : "${var.piwik_site_id}" },
    { "name" : "PIWIK_URL", "value" : "${var.piwik_url}" },
    { "name" : "SC_TEAM_EMAIL", "value" : "${var.sc_team_email}" },
    { "name" : "SUPPORTED_MIME_TYPES", "value" : "${var.supported_mime_types}" },
  ]

}
