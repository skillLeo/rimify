-- RIMIFY rimify-snapshot/1: Grundstand der Testumgebung (php artisan rimify:reset-baseline)
--@meta {"format":"rimify-snapshot/1","purpose":"Grundstand der Testumgebung (php artisan rimify:reset-baseline)","migrations":["0001_01_01_000000_create_users_table","0001_01_01_000001_create_cache_table","0001_01_01_000002_create_jobs_table","2026_09_20_000101_create_permission_tables","2026_09_20_000102_create_activity_log_table","2026_09_20_000103_create_media_table","2026_09_20_000104_create_telescope_entries_table","2026_09_20_100100_create_admin_users_table","2026_09_20_100200_create_vehicles_table","2026_09_20_100300_create_catalogue_tables","2026_09_20_100400_create_approval_documents_table","2026_09_20_100500_create_fitments_table","2026_09_20_100600_create_condition_tables","2026_09_20_100700_create_reference_and_conflict_tables","2026_09_21_100800_add_supersede_guard_to_approval_documents","2026_09_21_100900_add_presentation_columns_to_catalogue","2026_09_21_200100_create_commerce_tables","2026_09_21_200200_create_order_line_fitments_table","2026_09_21_200300_create_content_and_access_tables","2026_09_21_200400_add_role_metadata_to_roles","2026_09_21_210000_fix_navigation_links","2026_09_22_000100_phase0_navigation_and_search","2026_09_23_000100_phase0_homepage_data","2026_09_23_000200_create_fitment_subscriptions_table","2026_09_23_000300_add_demo_flag_and_image_manifest_to_catalogue","2026_09_24_000100_add_max_load_to_wheel_configs","2026_09_25_000100_create_komplettrad_option_tables","2026_09_25_000200_add_komplettrad_columns_to_commerce","2026_09_25_000300_add_is_wheel_brand_to_brands","2026_09_25_000400_add_centre_bore_to_fitments","2026_09_26_000100_add_preferences_to_admin_users","2026_09_26_000200_german_role_labels","2026_09_26_000310_create_admin_invitations_table","2026_09_26_000320_add_sessions_revoked_at_to_admin_users","2026_09_26_000330_let_closed_invitations_release_their_role","2026_09_26_000400_index_audit_logs_for_filters","2026_09_26_000500_add_drafts_and_revisions_to_pages","2026_09_26_000510_add_team_edit_marks_to_faq_and_nav","2026_09_26_000520_add_content_version_to_pages","2026_09_26_000600_create_notifications_table","2026_09_26_000700_add_order_list_columns","2026_09_27_000800_create_verdict_tallies_table","2026_09_27_000900_create_demand_marks_table","2026_09_27_001000_create_saved_views_table","2026_09_28_000100_add_columns_to_saved_views","2026_09_28_000200_mark_demo_rows","2026_09_28_000300_create_storage_settings_table","2026_09_28_000400_demo_models_never_published","2026_09_28_000500_catalogue_admin","2026_09_28_000600_create_review_feedback_table","2026_09_28_000700_vehicle_provenance","2026_09_28_000800_create_wheel_finish_images_table","2026_09_28_000900_catalogue_import_supplier","2026_09_28_001000_vehicle_source_values","2026_09_28_001100_brands_unique_among_live","2026_09_28_001200_document_conditions","2026_09_28_001300_derived_entry_per_tyre_size","2026_09_28_001400_conflict_decisions","2026_09_28_001500_document_record_shape","2026_09_28_001600_six_spoke_wheels","2026_09_28_001700_document_speed_deratings","2026_09_28_001800_load_limit_confirmation","2026_09_28_001900_derating_seed_origin","2026_09_28_002000_vehicles_from_documents","2026_09_29_000100_check_results","2026_09_29_000200_tyre_size_power_band","2026_09_29_000300_tyre_size_entries","2026_09_29_100100_payments","2026_09_29_100200_refunds_disputes_invoices","2026_09_29_100300_brand_manufacturer","2026_09_29_100400_customer_accounts","2026_09_30_100100_invoice_series_opening","2026_10_01_000100_reword_three_faq_answers","2026_10_01_100100_document_papers_and_annexes","2026_10_01_100200_add_internal_note_to_wheel_models","2026_10_02_000100_reviews_and_delivery","2026_10_02_000200_condition_levels","2026_10_02_000300_order_line_axle","2026_10_02_000500_contact_messages","2026_10_05_000100_record_database_environment","2026_10_06_000100_create_mail_settings_and_suppressions","2026_10_07_000100_acceptance_set","2026_10_07_000200_demo_never_published_null_safe","2026_10_14_000100_document_completeness","2026_10_14_000200_faq_entry_question_quotes","2026_10_15_000100_order_origin","2026_10_16_000100_document_counts","2026_10_17_000100_document_tyre_combinations","2026_10_17_000200_fitments_document_status_index","2026_10_18_000100_document_tyre_index_source","2026_10_18_000200_audit_logs_people_index","2026_10_18_000300_vehicle_imports","2026_10_18_000310_vehicle_numbers_per_source","2026_10_18_000400_wheel_title_and_availability","2026_10_19_000100_tyre_availability_and_label","2026_10_19_000200_load_index_to_120","2026_10_23_000100_legal_placeholder_flag","2026_10_24_000100_drop_unreal_role_cells","2026_10_29_000100_wheel_model_stated_rating","2026_10_29_000200_pages_soft_delete"],"last_migration":{"name":"2026_10_29_000200_pages_soft_delete","batch":1},"schema":"fd8f138d5b39de551e1ceaa89affa5923cbed3444478ba3954162fa4d4ee88ce","app":{"commit":"e5549e4f","release_seed":10},"tables":["addresses","admin_invitations","admin_users","approval_documents","audit_logs","balance_weight_colours","brands","cache","cache_locks","catalogue_gap_events","catalogue_imports","check_results","contact_messages","customers","customer_accounts","demand_marks","disputes","document_conditions","document_condition_reworks","document_fasteners","document_notices","document_speed_deratings","document_tyre_combinations","failed_jobs","faq_entries","fitments","fitment_conditions","fitment_conflicts","fitment_subscriptions","fitment_tyre_sizes","fitment_tyre_size_conditions","invoices","invoice_sequences","jobs","job_batches","load_index_table","mail_settings","mail_suppressions","media","migrations","model_has_permissions","model_has_roles","nav_items","notifications","orders","order_lines","order_line_fitments","pages","page_blocks","page_revisions","password_reset_tokens","payment_events","payment_settings","permissions","refunds","reviews","review_feedback","roles","role_has_permissions","role_permissions","saved_views","search_misses","sessions","settings","speed_symbol_table","storage_settings","stripe_events","telescope_entries","telescope_entries_tags","telescope_monitoring","tpms_sensor_prices","tyre_variants","users","vehicles","vehicle_imports","verdict_tallies","wheel_configs","wheel_finishes","wheel_finish_images","wheel_models"]}
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
--@drop addresses
DROP TABLE IF EXISTS `addresses`;
--@create addresses
CREATE TABLE `addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint(20) unsigned DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `street` varchar(255) NOT NULL,
  `house_number` varchar(32) NOT NULL,
  `address_extra` varchar(255) DEFAULT NULL,
  `zip_code` varchar(16) NOT NULL,
  `city` varchar(255) NOT NULL,
  `country` char(2) NOT NULL DEFAULT 'DE',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `addresses_demo_ref_unique` (`demo_ref`),
  KEY `addresses_customer_id_foreign` (`customer_id`),
  KEY `idx_address_locality` (`zip_code`,`city`),
  KEY `addresses_is_demo_index` (`is_demo`),
  CONSTRAINT `addresses_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_adr_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger addresses trg_adr_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_adr_demo_fixed
BEFORE UPDATE ON addresses
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop admin_invitations
DROP TABLE IF EXISTS `admin_invitations`;
--@create admin_invitations
CREATE TABLE `admin_invitations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `role_id` bigint(20) unsigned DEFAULT NULL,
  `token_hash` char(64) NOT NULL,
  `invited_by` bigint(20) unsigned DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_invitations_token_hash_unique` (`token_hash`),
  KEY `admin_invitations_invited_by_foreign` (`invited_by`),
  KEY `admin_invitations_email_index` (`email`),
  KEY `admin_invitations_role_id_foreign` (`role_id`),
  CONSTRAINT `admin_invitations_invited_by_foreign` FOREIGN KEY (`invited_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admin_invitations_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop admin_users
DROP TABLE IF EXISTS `admin_users`;
--@create admin_users
CREATE TABLE `admin_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `totp_secret` text DEFAULT NULL,
  `totp_confirmed_at` timestamp NULL DEFAULT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'invited',
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferences`)),
  `failed_login_count` smallint(5) unsigned NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `sessions_revoked_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_users_email_unique` (`email`),
  UNIQUE KEY `admin_users_demo_ref_unique` (`demo_ref`),
  KEY `admin_users_status_index` (`status`),
  KEY `admin_users_is_demo_index` (`is_demo`),
  CONSTRAINT `chk_admin_users_status` CHECK (`status` in ('active','invited','suspended')),
  CONSTRAINT `chk_adm_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows admin_users
INSERT INTO `admin_users` (`id`, `name`, `email`, `password`, `totp_secret`, `totp_confirmed_at`, `status`, `preferences`, `failed_login_count`, `locked_until`, `last_login_at`, `last_login_ip`, `sessions_revoked_at`, `remember_token`, `created_at`, `updated_at`, `is_demo`, `demo_ref`) VALUES (8, 'Testzugang Verkauf', 'verkauf@rimify.test', '$2y$12$Yiv4awpVqNiHAm4h4mkGWekGL6SqXAYBl3q5VfEOHMyzXYDzS.xFW', NULL, NULL, 'active', NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00', 0, NULL), (9, 'Testzugang Lager', 'lager@rimify.test', '$2y$12$Yiv4awpVqNiHAm4h4mkGWekGL6SqXAYBl3q5VfEOHMyzXYDzS.xFW', NULL, NULL, 'active', NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00', 0, NULL), (10, 'Testzugang Admin', 'admin@rimify.test', '$2y$12$Yiv4awpVqNiHAm4h4mkGWekGL6SqXAYBl3q5VfEOHMyzXYDzS.xFW', NULL, NULL, 'active', NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00', 0, NULL);
--@trigger admin_users trg_adm_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_adm_demo_fixed
BEFORE UPDATE ON admin_users
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop approval_documents
DROP TABLE IF EXISTS `approval_documents`;
--@create approval_documents
CREATE TABLE `approval_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `kind` varchar(24) NOT NULL,
  `kba_number` varchar(64) DEFAULT NULL COMMENT 'ABE',
  `approval_mark` varchar(64) DEFAULT NULL COMMENT 'ECE-R124',
  `report_number` varchar(64) DEFAULT NULL COMMENT 'Teilegutachten',
  `annex` varchar(64) DEFAULT NULL COMMENT 'Anlage',
  `test_report_number` varchar(64) DEFAULT NULL COMMENT 'Prüfbericht-Nr.',
  `copy_number` varchar(32) DEFAULT NULL COMMENT 'Ausfertigung',
  `designation_number` varchar(64) DEFAULT NULL COMMENT 'Benennungsnummer',
  `test_site` varchar(120) DEFAULT NULL COMMENT 'Prüfort',
  `test_date` date DEFAULT NULL COMMENT 'Prüfdatum',
  `revision_date` date DEFAULT NULL COMMENT 'Stand',
  `valid_from_production` date DEFAULT NULL COMMENT 'gültig ab Fertigungsdatum: the first day of the month',
  `papers_correction_required` tinyint(1) DEFAULT NULL COMMENT '§ 15 FZV: false = the document frees the papers from correction; null = it says nothing',
  `missing_annexes` varchar(255) DEFAULT NULL COMMENT 'the Anlagen or ranges of its Verwendungsbereich we do not hold, as printed („1–15“)',
  `tyre_index_source` varchar(16) DEFAULT NULL COMMENT 'document | papers | table: how the document gives the required tyre index; null = not answered',
  `completeness` varchar(16) DEFAULT NULL COMMENT 'complete | partial | unknown, asserted at release; NULL = not answered, read as partial',
  `completeness_by` bigint(20) unsigned DEFAULT NULL,
  `completeness_at` timestamp NULL DEFAULT NULL,
  `completeness_revision` int(10) unsigned DEFAULT NULL COMMENT 'the revision the answer was given for',
  `counted_codes` smallint(5) unsigned DEFAULT NULL COMMENT 'Auflagen codes its Verwendungsbereich prints for the vehicles to be entered',
  `counted_codes_page` smallint(5) unsigned DEFAULT NULL,
  `counted_sizes` smallint(5) unsigned DEFAULT NULL COMMENT 'tyre sizes it names for them',
  `counted_sizes_page` smallint(5) unsigned DEFAULT NULL,
  `counted_axle_limit_kg` smallint(5) unsigned DEFAULT NULL COMMENT 'the axle-load limit it names; NULL once counted = none',
  `counted_axle_limit_page` smallint(5) unsigned DEFAULT NULL,
  `counted_abnahme` varchar(8) DEFAULT NULL COMMENT 'all | some | none',
  `counted_abnahme_page` smallint(5) unsigned DEFAULT NULL,
  `counted_before_entry` tinyint(1) NOT NULL DEFAULT 0,
  `counted_by` bigint(20) unsigned DEFAULT NULL,
  `counted_at` timestamp NULL DEFAULT NULL,
  `issuer` varchar(255) DEFAULT NULL,
  `issued_on` date DEFAULT NULL,
  `revision` int(10) unsigned NOT NULL DEFAULT 1,
  `supersedes_id` bigint(20) unsigned DEFAULT NULL,
  `supplement_to_id` bigint(20) unsigned DEFAULT NULL,
  `supplement_to_number` varchar(64) DEFAULT NULL COMMENT 'the base we do not hold, as the Nachtrag names it',
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL COMMENT 'NULL = current revision',
  `pdf_key` varchar(255) DEFAULT NULL COMMENT 'object storage; served by signed URL',
  `pdf_sha256` varchar(64) DEFAULT NULL COMMENT 'proves the file was never swapped',
  `page_count` smallint(5) unsigned DEFAULT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'draft',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `approval_documents_demo_ref_unique` (`demo_ref`),
  KEY `approval_documents_created_by_foreign` (`created_by`),
  KEY `idx_document_current` (`status`,`valid_to`),
  KEY `idx_document_kba` (`kba_number`),
  KEY `idx_document_supersedes` (`supersedes_id`),
  KEY `approval_documents_supplement_to_id_foreign` (`supplement_to_id`),
  KEY `approval_documents_is_demo_index` (`is_demo`),
  KEY `approval_documents_completeness_by_foreign` (`completeness_by`),
  KEY `approval_documents_counted_by_foreign` (`counted_by`),
  CONSTRAINT `approval_documents_completeness_by_foreign` FOREIGN KEY (`completeness_by`) REFERENCES `admin_users` (`id`),
  CONSTRAINT `approval_documents_counted_by_foreign` FOREIGN KEY (`counted_by`) REFERENCES `admin_users` (`id`),
  CONSTRAINT `approval_documents_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `approval_documents_supersedes_id_foreign` FOREIGN KEY (`supersedes_id`) REFERENCES `approval_documents` (`id`),
  CONSTRAINT `approval_documents_supplement_to_id_foreign` FOREIGN KEY (`supplement_to_id`) REFERENCES `approval_documents` (`id`),
  CONSTRAINT `chk_approval_documents_status` CHECK (`status` in ('draft','published','superseded','withdrawn')),
  CONSTRAINT `chk_document_validity` CHECK (`valid_from` is null or `valid_to` is null or `valid_from` <= `valid_to`),
  CONSTRAINT `chk_document_revision` CHECK (`revision` >= 1),
  CONSTRAINT `chk_document_published_has_pdf` CHECK (`status` <> 'published' or `pdf_key` is not null and `pdf_sha256` is not null),
  CONSTRAINT `chk_document_sha_shape` CHECK (`pdf_sha256` is null or `pdf_sha256` regexp '(?-i)^[0-9a-f]{64}$'),
  CONSTRAINT `chk_approval_documents_kind` CHECK (`kind` in ('ABE','NACHTRAG','TEILEGUTACHTEN','EC','ECE')),
  CONSTRAINT `chk_document_supplement` CHECK (`kind` = 'NACHTRAG' = (`supplement_to_id` is not null or `supplement_to_number` is not null)),
  CONSTRAINT `chk_document_production_month` CHECK (`valid_from_production` is null or dayofmonth(`valid_from_production`) = 1),
  CONSTRAINT `chk_apd_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null),
  CONSTRAINT `chk_approval_documents_completeness` CHECK (`completeness` in ('complete','partial','unknown')),
  CONSTRAINT `chk_document_completeness_who` CHECK (`completeness` is null or `completeness_at` is not null and `completeness_revision` is not null),
  CONSTRAINT `chk_approval_documents_counted_abnahme` CHECK (`counted_abnahme` in ('all','some','none')),
  CONSTRAINT `chk_document_count_whole` CHECK (`counted_at` is null = (`counted_codes` is null) and `counted_at` is null = (`counted_sizes` is null) and `counted_at` is null = (`counted_abnahme` is null) and `counted_codes` is null = (`counted_codes_page` is null) and `counted_sizes` is null = (`counted_sizes_page` is null) and `counted_axle_limit_kg` is null = (`counted_axle_limit_page` is null)),
  CONSTRAINT `chk_document_count_abnahme_page` CHECK (`counted_abnahme` is null or `counted_abnahme` = 'none' or `counted_abnahme_page` is not null),
  CONSTRAINT `chk_approval_documents_tyre_index_source` CHECK (`tyre_index_source` in ('document','papers','table'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger approval_documents trg_ad_no_self_supersede_update
DELIMITER ;;
CREATE TRIGGER trg_ad_no_self_supersede_update
    BEFORE UPDATE ON approval_documents
    FOR EACH ROW
    BEGIN
        IF NEW.supersedes_id IS NOT NULL AND NEW.supersedes_id = NEW.id THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ein Dokument kann sich nicht selbst ablösen';
        END IF;
    END;;
DELIMITER ;
--@trigger approval_documents trg_apd_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_apd_demo_fixed
BEFORE UPDATE ON approval_documents
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop audit_logs
DROP TABLE IF EXISTS `audit_logs`;
--@create audit_logs
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `log_name` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `subject_type` varchar(255) DEFAULT NULL,
  `subject_id` bigint(20) unsigned DEFAULT NULL,
  `event` varchar(255) DEFAULT NULL,
  `causer_type` varchar(255) DEFAULT NULL,
  `causer_id` bigint(20) unsigned DEFAULT NULL,
  `attribute_changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attribute_changes`)),
  `properties` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`properties`)),
  `actor_email` varchar(255) DEFAULT NULL COMMENT 'kept even if the user is later removed',
  `ip_address` varchar(45) DEFAULT NULL,
  `correlation_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_logs_demo_ref_unique` (`demo_ref`),
  KEY `subject` (`subject_type`,`subject_id`),
  KEY `idx_audit_event` (`event`),
  KEY `idx_audit_correlation` (`correlation_id`),
  KEY `idx_audit_created` (`created_at`),
  KEY `audit_logs_log_name_index` (`log_name`),
  KEY `idx_audit_actor_email` (`actor_email`),
  KEY `audit_logs_is_demo_index` (`is_demo`),
  KEY `idx_audit_people` (`causer_type`,`causer_id`,`actor_email`),
  CONSTRAINT `chk_audit_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger audit_logs trg_audit_no_delete
DELIMITER ;;
CREATE TRIGGER trg_audit_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
BEGIN
    IF NOT (OLD.is_demo = 1 AND OLD.demo_ref IS NOT NULL) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'audit_logs is append-only';
    END IF;
END;;
DELIMITER ;
--@trigger audit_logs trg_audit_no_update
DELIMITER ;;
CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    BEGIN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'audit_logs is append-only';
    END;;
DELIMITER ;
--@drop balance_weight_colours
DROP TABLE IF EXISTS `balance_weight_colours`;
--@create balance_weight_colours
CREATE TABLE `balance_weight_colours` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name_de` varchar(64) NOT NULL COMMENT 'Silber — as the customer reads it',
  `slug` varchar(64) NOT NULL COMMENT 'silber — stable identifier for seeders and tests',
  `swatch_hex` char(7) DEFAULT NULL COMMENT '#C8CCD2',
  `surcharge_cents` int(10) unsigned NOT NULL DEFAULT 0,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_weight_colour_slug` (`slug`),
  UNIQUE KEY `uq_weight_colour_name` (`name_de`),
  UNIQUE KEY `balance_weight_colours_demo_ref_unique` (`demo_ref`),
  KEY `idx_weight_colour_order` (`active`,`sort_order`),
  KEY `balance_weight_colours_is_demo_index` (`is_demo`),
  CONSTRAINT `chk_weight_colour_currency` CHECK (`currency` regexp '(?-i)^[A-Z]{3}$'),
  CONSTRAINT `chk_weight_colour_hex` CHECK (`swatch_hex` is null or `swatch_hex` regexp '(?-i)^#[0-9A-F]{6}$'),
  CONSTRAINT `chk_bwc_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger balance_weight_colours trg_bwc_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_bwc_demo_fixed
BEFORE UPDATE ON balance_weight_colours
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop brands
DROP TABLE IF EXISTS `brands`;
--@create brands
CREATE TABLE `brands` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `is_wheel_brand` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'on the brand wall, stock or not',
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `manufacturer_name` varchar(190) DEFAULT NULL,
  `manufacturer_address` varchar(500) DEFAULT NULL,
  `manufacturer_contact` varchar(190) DEFAULT NULL COMMENT 'an e-mail address or a web address',
  `eu_responsible_name` varchar(190) DEFAULT NULL COMMENT 'only for a manufacturer outside the EU',
  `eu_responsible_address` varchar(500) DEFAULT NULL,
  `eu_responsible_contact` varchar(190) DEFAULT NULL,
  `safety_note` text DEFAULT NULL COMMENT 'the manufacturer''s safety information, in German',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `live_name` varchar(255) GENERATED ALWAYS AS (if(`deleted_at` is null,`name`,NULL)) VIRTUAL,
  `live_slug` varchar(255) GENERATED ALWAYS AS (if(`deleted_at` is null,`slug`,NULL)) VIRTUAL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_brands_live_name` (`live_name`),
  UNIQUE KEY `uq_brands_live_slug` (`live_slug`),
  UNIQUE KEY `brands_demo_ref_unique` (`demo_ref`),
  KEY `brands_name_index` (`name`),
  KEY `brands_slug_index` (`slug`),
  KEY `brands_is_demo_index` (`is_demo`),
  CONSTRAINT `chk_brd_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger brands trg_brd_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_brd_demo_fixed
BEFORE UPDATE ON brands
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop cache
DROP TABLE IF EXISTS `cache`;
--@create cache
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop cache_locks
DROP TABLE IF EXISTS `cache_locks`;
--@create cache_locks
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop catalogue_gap_events
DROP TABLE IF EXISTS `catalogue_gap_events`;
--@create catalogue_gap_events
CREATE TABLE `catalogue_gap_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint(20) unsigned DEFAULT NULL,
  `wheel_config_id` bigint(20) unsigned DEFAULT NULL,
  `hsn` varchar(4) DEFAULT NULL,
  `tsn` varchar(3) DEFAULT NULL,
  `vehicle_label` varchar(255) DEFAULT NULL,
  `reason_code` varchar(48) NOT NULL,
  `surface` varchar(32) NOT NULL COMMENT 'plp | pdp | check | selector',
  `occurred_at` timestamp NOT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `catalogue_gap_events_demo_ref_unique` (`demo_ref`),
  KEY `idx_gap_keys` (`hsn`,`tsn`),
  KEY `idx_gap_reason` (`reason_code`,`occurred_at`),
  KEY `idx_gap_vehicle` (`vehicle_id`),
  KEY `catalogue_gap_events_is_demo_index` (`is_demo`),
  CONSTRAINT `chk_catalogue_gap_events_surface` CHECK (`surface` in ('plp','pdp','check','selector')),
  CONSTRAINT `chk_gap_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger catalogue_gap_events trg_gap_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_gap_demo_fixed
BEFORE UPDATE ON catalogue_gap_events
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop catalogue_imports
DROP TABLE IF EXISTS `catalogue_imports`;
--@create catalogue_imports
CREATE TABLE `catalogue_imports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `admin_user_id` bigint(20) unsigned DEFAULT NULL,
  `file_name` varchar(200) NOT NULL,
  `supplier` varchar(80) DEFAULT NULL,
  `file_format` varchar(8) NOT NULL COMMENT 'csv | xlsx',
  `file_sha256` char(64) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'previewed',
  `mapping` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'field => column header' CHECK (json_valid(`mapping`)),
  `mapping_remembered` tinyint(1) NOT NULL DEFAULT 0,
  `decimal` varchar(8) NOT NULL DEFAULT 'komma' COMMENT 'komma | punkt: how the file writes 8,5',
  `source` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`source`)),
  `rows` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'the rows as read, after mapping' CHECK (json_valid(`rows`)),
  `plan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'per row: create | update | unchanged | refused, and why' CHECK (json_valid(`plan`)),
  `summary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'counts per action' CHECK (json_valid(`summary`)),
  `undo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'created ids and the values updates replaced' CHECK (json_valid(`undo`)),
  `applied_at` timestamp NULL DEFAULT NULL,
  `rolled_back_at` timestamp NULL DEFAULT NULL,
  `rolled_back_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `catalogue_imports_admin_user_id_foreign` (`admin_user_id`),
  KEY `catalogue_imports_rolled_back_by_foreign` (`rolled_back_by`),
  KEY `idx_catalogue_import_status` (`status`,`created_at`),
  KEY `catalogue_imports_supplier_index` (`supplier`),
  CONSTRAINT `catalogue_imports_admin_user_id_foreign` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `catalogue_imports_rolled_back_by_foreign` FOREIGN KEY (`rolled_back_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop check_results
DROP TABLE IF EXISTS `check_results`;
--@create check_results
CREATE TABLE `check_results` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `token` char(32) NOT NULL,
  `vehicle_id` bigint(20) unsigned NOT NULL,
  `wheel_config_id` bigint(20) unsigned NOT NULL,
  `approval_document_id` bigint(20) unsigned DEFAULT NULL,
  `document_revision` int(10) unsigned DEFAULT NULL,
  `verdict_status` varchar(16) NOT NULL,
  `verdict` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'FitmentVerdict::toArray() as the page showed it, with the whole tyre sum' CHECK (json_valid(`verdict`)),
  `papers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'the figures from the customer''s papers the answer used, when any' CHECK (json_valid(`papers`)),
  `engine_version` varchar(16) NOT NULL,
  `computed_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `check_results_token_unique` (`token`),
  KEY `check_results_vehicle_id_index` (`vehicle_id`),
  KEY `check_results_wheel_config_id_index` (`wheel_config_id`),
  KEY `check_results_approval_document_id_index` (`approval_document_id`),
  CONSTRAINT `chk_check_results_verdict_status` CHECK (`verdict_status` in ('PERMITTED','CONDITIONAL','NOT_PERMITTED','UNKNOWN')),
  CONSTRAINT `chk_check_results_token` CHECK (`token` regexp '(?-i)^[A-Za-z0-9]{32}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger check_results trg_check_results_no_update
DELIMITER ;;
CREATE TRIGGER trg_check_results_no_update
    BEFORE UPDATE ON check_results
    FOR EACH ROW
    BEGIN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'check_results is append-only';
    END;;
DELIMITER ;
--@drop contact_messages
DROP TABLE IF EXISTS `contact_messages`;
--@create contact_messages
CREATE TABLE `contact_messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `subject` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `vehicle_label` varchar(255) DEFAULT NULL,
  `from_path` varchar(255) DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `read_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_messages_read_by_foreign` (`read_by`),
  KEY `idx_contact_created` (`created_at`),
  CONSTRAINT `contact_messages_read_by_foreign` FOREIGN KEY (`read_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop customers
DROP TABLE IF EXISTS `customers`;
--@create customers
CREATE TABLE `customers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_demo_ref_unique` (`demo_ref`),
  KEY `idx_customer_email` (`email`),
  KEY `customers_is_demo_index` (`is_demo`),
  CONSTRAINT `chk_cus_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger customers trg_cus_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_cus_demo_fixed
BEFORE UPDATE ON customers
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop customer_accounts
DROP TABLE IF EXISTS `customer_accounts`;
--@create customer_accounts
CREATE TABLE `customer_accounts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(190) NOT NULL,
  `password` varchar(255) DEFAULT NULL COMMENT 'null until the customer sets one through the mailed link',
  `email_verified_at` timestamp NULL DEFAULT NULL COMMENT 'set when a password is set through a link sent to this address',
  `remember_token` varchar(100) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_accounts_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop demand_marks
DROP TABLE IF EXISTS `demand_marks`;
--@create demand_marks
CREATE TABLE `demand_marks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `gap_key` varchar(32) NOT NULL,
  `state` varchar(16) NOT NULL,
  `brand_id` bigint(20) unsigned DEFAULT NULL,
  `admin_user_id` bigint(20) unsigned DEFAULT NULL,
  `marked_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `demand_marks_gap_key_unique` (`gap_key`),
  KEY `demand_marks_brand_id_foreign` (`brand_id`),
  KEY `demand_marks_admin_user_id_foreign` (`admin_user_id`),
  CONSTRAINT `demand_marks_admin_user_id_foreign` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `demand_marks_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_demand_marks_state` CHECK (`state` in ('watched','requested'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop disputes
DROP TABLE IF EXISTS `disputes`;
--@create disputes
CREATE TABLE `disputes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned DEFAULT NULL,
  `provider` varchar(16) NOT NULL,
  `provider_dispute_id` varchar(255) NOT NULL,
  `charge_id` varchar(255) DEFAULT NULL,
  `reason` varchar(64) NOT NULL,
  `amount_cents` int(10) unsigned NOT NULL,
  `currency` char(3) NOT NULL,
  `status` varchar(32) NOT NULL,
  `evidence_due_by` timestamp NULL DEFAULT NULL,
  `evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'the files and the note given as evidence' CHECK (json_valid(`evidence`)),
  `evidence_submitted_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `outcome` varchar(16) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `disputes_provider_dispute_id_unique` (`provider_dispute_id`),
  KEY `disputes_order_id_foreign` (`order_id`),
  KEY `disputes_status_evidence_due_by_index` (`status`,`evidence_due_by`),
  CONSTRAINT `disputes_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `chk_dispute_outcome` CHECK (`outcome` is null or `outcome` in ('won','lost','accepted'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop document_conditions
DROP TABLE IF EXISTS `document_conditions`;
--@create document_conditions
CREATE TABLE `document_conditions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `approval_document_id` bigint(20) unsigned NOT NULL,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'as the document prints it',
  `kind` varchar(24) NOT NULL,
  `level` varchar(16) NOT NULL DEFAULT 'auflage',
  `text_de` text NOT NULL COMMENT 'the full sentence, as the customer reads it (R-15)',
  `source_page` smallint(5) unsigned DEFAULT NULL,
  `body_forms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'karosserieform: the body styles permitted' CHECK (json_valid(`body_forms`)),
  `drive` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'antrieb: {"mode": "only"|"not", "drive": "Allrad"|…}' CHECK (json_valid(`drive`)),
  `max_axle_load_kg` smallint(5) unsigned DEFAULT NULL COMMENT 'reifen_tragfaehigkeit',
  `axle` varchar(8) DEFAULT NULL COMMENT 'reifen_achse: FRONT or REAR',
  `limit_confirmed_reason` text DEFAULT NULL,
  `limit_confirmed_by` bigint(20) unsigned DEFAULT NULL,
  `limit_confirmed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_condition_code` (`approval_document_id`,`code`),
  KEY `document_conditions_limit_confirmed_by_foreign` (`limit_confirmed_by`),
  CONSTRAINT `document_conditions_approval_document_id_foreign` FOREIGN KEY (`approval_document_id`) REFERENCES `approval_documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_conditions_limit_confirmed_by_foreign` FOREIGN KEY (`limit_confirmed_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_document_conditions_kind` CHECK (`kind` in ('abnahme','karosseriearbeit','karosserieform','antrieb','befestigung','reifen_tragfaehigkeit','reifen_achse','reifen_kombination','tacho','verbot','hinweis','nacharbeitsprofil')),
  CONSTRAINT `chk_document_condition_text` CHECK (trim(`text_de`) <> ''),
  CONSTRAINT `chk_document_condition_axle` CHECK (`axle` is null or `axle` in ('FRONT','REAR')),
  CONSTRAINT `chk_document_conditions_level` CHECK (`level` in ('hinweis','auflage','nicht_zulaessig')),
  CONSTRAINT `chk_condition_level_floor` CHECK (`kind` not in ('abnahme','karosseriearbeit') or `level` <> 'hinweis')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop document_condition_reworks
DROP TABLE IF EXISTS `document_condition_reworks`;
--@create document_condition_reworks
CREATE TABLE `document_condition_reworks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `document_condition_id` bigint(20) unsigned NOT NULL,
  `vehicle_type` varchar(64) NOT NULL COMMENT 'as the document names it, e.g. 3C',
  `axle` varchar(8) NOT NULL,
  `from_mm` decimal(5,1) DEFAULT NULL COMMENT 'the rework begins … mm from the arch centre',
  `to_mm` decimal(5,1) DEFAULT NULL,
  `flare_mm` decimal(4,1) DEFAULT NULL COMMENT 'the arch flared by … mm',
  `note_de` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rework_condition` (`document_condition_id`),
  CONSTRAINT `document_condition_reworks_document_condition_id_foreign` FOREIGN KEY (`document_condition_id`) REFERENCES `document_conditions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_rework_axle` CHECK (`axle` in ('FRONT','REAR','ALL')),
  CONSTRAINT `chk_rework_measured` CHECK (`from_mm` is not null or `to_mm` is not null or `flare_mm` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop document_fasteners
DROP TABLE IF EXISTS `document_fasteners`;
--@create document_fasteners
CREATE TABLE `document_fasteners` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `approval_document_id` bigint(20) unsigned NOT NULL,
  `number` varchar(16) NOT NULL COMMENT 'as the document numbers it, e.g. S01',
  `thread` varchar(32) NOT NULL COMMENT 'M14x1,25',
  `seat` varchar(48) NOT NULL COMMENT 'Kegelbund 60°, Kugelbund R12',
  `torque_nm` smallint(5) unsigned DEFAULT NULL,
  `shaft_length_mm` smallint(5) unsigned DEFAULT NULL,
  `article_number` varchar(64) DEFAULT NULL,
  `vehicle_types` varchar(255) DEFAULT NULL COMMENT 'for which vehicle types, as the document says',
  `source_page` smallint(5) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_fastener_number` (`approval_document_id`,`number`),
  CONSTRAINT `document_fasteners_approval_document_id_foreign` FOREIGN KEY (`approval_document_id`) REFERENCES `approval_documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_fastener_torque` CHECK (`torque_nm` is null or `torque_nm` between 50 and 300)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop document_notices
DROP TABLE IF EXISTS `document_notices`;
--@create document_notices
CREATE TABLE `document_notices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `approval_document_id` bigint(20) unsigned NOT NULL,
  `text_de` text NOT NULL COMMENT 'always shown with the verdict, as a full sentence (R-15)',
  `source_page` smallint(5) unsigned DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `document_notices_approval_document_id_foreign` (`approval_document_id`),
  CONSTRAINT `document_notices_approval_document_id_foreign` FOREIGN KEY (`approval_document_id`) REFERENCES `approval_documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_notice_text` CHECK (trim(`text_de`) <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop document_speed_deratings
DROP TABLE IF EXISTS `document_speed_deratings`;
--@create document_speed_deratings
CREATE TABLE `document_speed_deratings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `approval_document_id` bigint(20) unsigned NOT NULL,
  `speed_kmh` smallint(5) unsigned NOT NULL COMMENT 'the table row, km/h',
  `symbol` varchar(4) NOT NULL COMMENT 'the speed symbol column: V, W, Y',
  `percent` tinyint(3) unsigned DEFAULT NULL COMMENT 'share of the load index; NULL = „–“, not permitted',
  `source_page` smallint(5) unsigned DEFAULT NULL,
  `seeded_from` varchar(120) DEFAULT NULL COMMENT 'NULL = typed from this document',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doc_derating_cell` (`approval_document_id`,`speed_kmh`,`symbol`),
  CONSTRAINT `document_speed_deratings_approval_document_id_foreign` FOREIGN KEY (`approval_document_id`) REFERENCES `approval_documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_derating_percent` CHECK (`percent` is null or `percent` between 1 and 100),
  CONSTRAINT `chk_derating_speed` CHECK (`speed_kmh` between 100 and 400),
  CONSTRAINT `chk_derating_symbol` CHECK (`symbol` regexp '^[A-Z()]{1,4}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop document_tyre_combinations
DROP TABLE IF EXISTS `document_tyre_combinations`;
--@create document_tyre_combinations
CREATE TABLE `document_tyre_combinations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `approval_document_id` bigint(20) unsigned NOT NULL,
  `number` smallint(5) unsigned NOT NULL COMMENT 'the document''s own „Kombination N“',
  `front_width_mm` smallint(5) unsigned NOT NULL,
  `front_aspect` tinyint(3) unsigned NOT NULL,
  `front_diameter_in` decimal(4,1) NOT NULL,
  `rear_width_mm` smallint(5) unsigned NOT NULL,
  `rear_aspect` tinyint(3) unsigned NOT NULL,
  `rear_diameter_in` decimal(4,1) NOT NULL,
  `source_page` smallint(5) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_tyre_combination` (`approval_document_id`,`front_width_mm`,`front_aspect`,`front_diameter_in`,`rear_width_mm`,`rear_aspect`,`rear_diameter_in`),
  KEY `idx_document_tyre_combination_number` (`approval_document_id`,`number`),
  CONSTRAINT `document_tyre_combinations_approval_document_id_foreign` FOREIGN KEY (`approval_document_id`) REFERENCES `approval_documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_combination_number` CHECK (`number` >= 1),
  CONSTRAINT `chk_combination_sizes` CHECK (`front_width_mm` between 100 and 400 and `rear_width_mm` between 100 and 400 and `front_aspect` between 20 and 90 and `rear_aspect` between 20 and 90 and `front_diameter_in` between 10 and 30 and `rear_diameter_in` between 10 and 30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop failed_jobs
DROP TABLE IF EXISTS `failed_jobs`;
--@create failed_jobs
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop faq_entries
DROP TABLE IF EXISTS `faq_entries`;
--@create faq_entries
CREATE TABLE `faq_entries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `group_key` varchar(64) NOT NULL COMMENT 'KOMPATIBILITÄT & FREIGABE | BESTELLUNG & VERSAND',
  `question_de` text NOT NULL,
  `answer_de` text NOT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `published` tinyint(1) NOT NULL DEFAULT 1,
  `team_edited_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_faq_group` (`published`,`group_key`,`sort_order`),
  FULLTEXT KEY `ft_faq` (`question_de`,`answer_de`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows faq_entries
INSERT INTO `faq_entries` (`id`, `group_key`, `question_de`, `answer_de`, `sort_order`, `published`, `team_edited_at`, `created_at`, `updated_at`) VALUES (1, 'KOMPATIBILITÄT & FREIGABE', 'Was ist RIMIFY?', 'RIMIFY ist ein Felgenshop für den deutschen Markt. Du gibst dein Fahrzeug an, wir zeigen dir ausschließlich Felgen, die für genau dieses Fahrzeug eine gültige Freigabe haben. Du bekommst sie ohne Reifen oder als Komplettrad – mit Reifen, fertig montiert und gewuchtet.', 10, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (2, 'KOMPATIBILITÄT & FREIGABE', 'Woher weiß ich, ob eine Felge zu meinem Auto passt?', 'Sobald du dein Fahrzeug gewählt hast, prüfen wir jede Felge gegen das zugehörige Gutachten – Felgenbreite, Einpresstiefe, zulässige Reifengrößen und Auflagen. Angezeigt werden nur Felgen, deren Gutachten dein Fahrzeug nennt. Ob Auflagen gelten oder wir noch Werte aus deinen Fahrzeugpapieren brauchen, steht bei jeder Felge. Einzelne Kombinationen prüfst du mit dem RIMIFY-Check.', 20, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (3, 'KOMPATIBILITÄT & FREIGABE', 'Was bedeutet „Eintragung erforderlich“?', 'Bei manchen Felgen verlangt das Gutachten, dass ein amtlich anerkannter Prüfer die Änderung abnimmt und sie in die Fahrzeugpapiere eingetragen wird. Bei anderen genügt die Abnahme, weil das Gutachten von der Berichtigung der Fahrzeugpapiere befreit (§ 15 FZV). Was für deine Felge gilt, steht bei jeder Größe, bevor du sie in den Warenkorb legst – und du kannst gezielt nach Felgen ohne Abnahme und Eintragung filtern.', 30, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (4, 'KOMPATIBILITÄT & FREIGABE', 'Wo finde ich HSN und TSN in meinen Fahrzeugpapieren?', 'In der Zulassungsbescheinigung Teil I steht die HSN in Feld 2.1 – vier Ziffern, führende Nullen gehören dazu. Die TSN sind die ersten drei Zeichen in Feld 2.2, Ziffern oder Buchstaben. Im älteren Fahrzeugschein stehen dieselben Nummern an anderer Stelle – beide Varianten zeigen wir dir in der Fahrzeugauswahl.', 40, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (5, 'KOMPATIBILITÄT & FREIGABE', 'Was ist, wenn zu meiner Schlüsselnummer mehrere Fahrzeuge angezeigt werden?', 'Das ist normal. Eine Kombination aus HSN und TSN kann mehrere Varianten umfassen, die sich in Bauzeitraum, Höchstgeschwindigkeit oder Achslast unterscheiden. Wir fragen dann kurz nach, weil genau diese Unterschiede darüber entscheiden, welche Reifen zulässig sind.', 50, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (6, 'BESTELLUNG & VERSAND', 'Was ist ein Komplettrad und was ist enthalten?', 'Ein Komplettrad ist eine Felge mit aufgezogenem und gewuchtetem Reifen. Welches Gutachten dazugehört und ob eine Eintragung nötig ist, steht bei jeder Felge.', 60, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (7, 'BESTELLUNG & VERSAND', 'Wie lange dauert die Lieferung?', 'Die Lieferzeit hängt von Felge und Ausführung ab. Frag uns gern vorher per E-Mail.', 70, 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (8, 'BESTELLUNG & VERSAND', 'Kann ich Felgen zurückgeben?', 'Was bei Widerruf und Rückgabe gilt, steht in unserer Widerrufsbelehrung – der Link steht unten auf jeder Seite.', 80, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00');
--@drop fitments
DROP TABLE IF EXISTS `fitments`;
--@create fitments
CREATE TABLE `fitments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `approval_document_id` bigint(20) unsigned NOT NULL,
  `vehicle_id` bigint(20) unsigned NOT NULL,
  `wheel_config_id` bigint(20) unsigned NOT NULL,
  `axle` varchar(8) NOT NULL DEFAULT 'ALL',
  `build_from` date DEFAULT NULL,
  `build_to` date DEFAULT NULL,
  `permitted_width_min` decimal(4,2) DEFAULT NULL,
  `permitted_width_max` decimal(4,2) DEFAULT NULL,
  `permitted_et_min` smallint(6) DEFAULT NULL,
  `permitted_et_max` smallint(6) DEFAULT NULL,
  `centre_bore_mm` decimal(5,2) DEFAULT NULL COMMENT 'Mittenlochbohrung this document states for THIS vehicle; NULL = the document states none',
  `requires_entry` tinyint(1) NOT NULL,
  `entry_note_de` text DEFAULT NULL,
  `entry_override` varchar(16) DEFAULT NULL COMMENT 'required | not_required — against the derived value',
  `entry_override_reason` text DEFAULT NULL,
  `entry_override_by` bigint(20) unsigned DEFAULT NULL,
  `entry_override_at` timestamp NULL DEFAULT NULL,
  `source_page` smallint(5) unsigned DEFAULT NULL COMMENT 'which page of the PDF',
  `status` varchar(16) NOT NULL DEFAULT 'draft',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fitment_identity` (`approval_document_id`,`vehicle_id`,`wheel_config_id`,`axle`),
  KEY `fitments_created_by_foreign` (`created_by`),
  KEY `idx_fitment_lookup` (`vehicle_id`,`status`,`wheel_config_id`),
  KEY `idx_fitment_vehicle` (`vehicle_id`,`status`,`build_from`,`build_to`),
  KEY `idx_fitment_config` (`wheel_config_id`,`status`),
  KEY `fitments_entry_override_by_foreign` (`entry_override_by`),
  KEY `idx_fitment_document_status` (`approval_document_id`,`status`),
  CONSTRAINT `fitments_approval_document_id_foreign` FOREIGN KEY (`approval_document_id`) REFERENCES `approval_documents` (`id`),
  CONSTRAINT `fitments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fitments_entry_override_by_foreign` FOREIGN KEY (`entry_override_by`) REFERENCES `admin_users` (`id`),
  CONSTRAINT `fitments_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  CONSTRAINT `fitments_wheel_config_id_foreign` FOREIGN KEY (`wheel_config_id`) REFERENCES `wheel_configs` (`id`),
  CONSTRAINT `chk_fitments_axle` CHECK (`axle` in ('ALL','FRONT','REAR')),
  CONSTRAINT `chk_fitments_status` CHECK (`status` in ('draft','published','retired')),
  CONSTRAINT `chk_fitment_build_window` CHECK (`build_from` is null or `build_to` is null or `build_from` <= `build_to`),
  CONSTRAINT `chk_fitment_width_range` CHECK (`permitted_width_min` is null or `permitted_width_max` is null or `permitted_width_min` <= `permitted_width_max`),
  CONSTRAINT `chk_fitment_et_range` CHECK (`permitted_et_min` is null or `permitted_et_max` is null or `permitted_et_min` <= `permitted_et_max`),
  CONSTRAINT `chk_fitment_width_positive` CHECK ((`permitted_width_min` is null or `permitted_width_min` > 0) and (`permitted_width_max` is null or `permitted_width_max` > 0)),
  CONSTRAINT `chk_fitment_centre_bore_positive` CHECK (`centre_bore_mm` is null or `centre_bore_mm` > 0),
  CONSTRAINT `chk_fitments_entry_override` CHECK (`entry_override` in ('required','not_required')),
  CONSTRAINT `chk_fitment_entry_override_reason` CHECK (`entry_override` is null or `entry_override_reason` is not null and trim(`entry_override_reason`) <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop fitment_conditions
DROP TABLE IF EXISTS `fitment_conditions`;
--@create fitment_conditions
CREATE TABLE `fitment_conditions` (
  `fitment_id` bigint(20) unsigned NOT NULL,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'as printed; resolved against the row''s own document',
  `note_de` text DEFAULT NULL COMMENT 'document-specific qualifier',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`fitment_id`,`code`),
  CONSTRAINT `fitment_condition_codes_fitment_id_foreign` FOREIGN KEY (`fitment_id`) REFERENCES `fitments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop fitment_conflicts
DROP TABLE IF EXISTS `fitment_conflicts`;
--@create fitment_conflicts
CREATE TABLE `fitment_conflicts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `kind` varchar(32) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'open',
  `vehicle_id` bigint(20) unsigned NOT NULL,
  `wheel_config_id` bigint(20) unsigned NOT NULL,
  `candidate_fitment_id` bigint(20) unsigned DEFAULT NULL,
  `existing_fitment_id` bigint(20) unsigned NOT NULL,
  `detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'both sides of the disagreement, as shown side by side' CHECK (json_valid(`detail`)),
  `blocking` tinyint(1) NOT NULL DEFAULT 0,
  `detected_by` bigint(20) unsigned DEFAULT NULL,
  `resolved_by` bigint(20) unsigned DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution_note` text DEFAULT NULL,
  `prevailing_document_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fitment_conflicts_wheel_config_id_foreign` (`wheel_config_id`),
  KEY `fitment_conflicts_candidate_fitment_id_foreign` (`candidate_fitment_id`),
  KEY `fitment_conflicts_existing_fitment_id_foreign` (`existing_fitment_id`),
  KEY `fitment_conflicts_detected_by_foreign` (`detected_by`),
  KEY `fitment_conflicts_resolved_by_foreign` (`resolved_by`),
  KEY `idx_conflict_open` (`status`,`kind`),
  KEY `idx_conflict_pair` (`vehicle_id`,`wheel_config_id`),
  KEY `fitment_conflicts_prevailing_document_id_foreign` (`prevailing_document_id`),
  CONSTRAINT `fitment_conflicts_candidate_fitment_id_foreign` FOREIGN KEY (`candidate_fitment_id`) REFERENCES `fitments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fitment_conflicts_detected_by_foreign` FOREIGN KEY (`detected_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fitment_conflicts_existing_fitment_id_foreign` FOREIGN KEY (`existing_fitment_id`) REFERENCES `fitments` (`id`),
  CONSTRAINT `fitment_conflicts_prevailing_document_id_foreign` FOREIGN KEY (`prevailing_document_id`) REFERENCES `approval_documents` (`id`),
  CONSTRAINT `fitment_conflicts_resolved_by_foreign` FOREIGN KEY (`resolved_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fitment_conflicts_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  CONSTRAINT `fitment_conflicts_wheel_config_id_foreign` FOREIGN KEY (`wheel_config_id`) REFERENCES `wheel_configs` (`id`),
  CONSTRAINT `chk_fitment_conflicts_kind` CHECK (`kind` in ('ENTRY_REQUIREMENT','TYRE_SIZES','WIDTH_ET_RANGE','CONDITIONS')),
  CONSTRAINT `chk_fitment_conflicts_status` CHECK (`status` in ('open','resolved_intersection','resolved_supersede','dismissed')),
  CONSTRAINT `chk_conflict_prevailing` CHECK (`status` = 'resolved_supersede' = (`prevailing_document_id` is not null))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop fitment_subscriptions
DROP TABLE IF EXISTS `fitment_subscriptions`;
--@create fitment_subscriptions
CREATE TABLE `fitment_subscriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `vehicle_id` bigint(20) unsigned NOT NULL,
  `confirm_token` char(64) NOT NULL,
  `unsubscribe_token` char(64) NOT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `unsubscribed_at` timestamp NULL DEFAULT NULL,
  `notified_at` timestamp NULL DEFAULT NULL COMMENT 'the last time a match was mailed',
  `notified_document_id` bigint(20) unsigned DEFAULT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'startseite' COMMENT 'where the request came from',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subscription_email_vehicle` (`email`,`vehicle_id`),
  UNIQUE KEY `fitment_subscriptions_confirm_token_unique` (`confirm_token`),
  UNIQUE KEY `fitment_subscriptions_unsubscribe_token_unique` (`unsubscribe_token`),
  KEY `fitment_subscriptions_notified_document_id_foreign` (`notified_document_id`),
  KEY `idx_subscription_match` (`vehicle_id`,`confirmed_at`,`unsubscribed_at`),
  CONSTRAINT `fitment_subscriptions_notified_document_id_foreign` FOREIGN KEY (`notified_document_id`) REFERENCES `approval_documents` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fitment_subscriptions_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop fitment_tyre_sizes
DROP TABLE IF EXISTS `fitment_tyre_sizes`;
--@create fitment_tyre_sizes
CREATE TABLE `fitment_tyre_sizes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fitment_id` bigint(20) unsigned NOT NULL,
  `width_mm` smallint(5) unsigned NOT NULL,
  `aspect` smallint(5) unsigned NOT NULL,
  `diameter_in` decimal(4,1) NOT NULL,
  `min_load_index` smallint(5) unsigned DEFAULT NULL,
  `min_speed_symbol` varchar(3) DEFAULT NULL,
  `axle` varchar(8) NOT NULL DEFAULT 'ALL',
  `kw_min` smallint(5) unsigned DEFAULT NULL COMMENT 'the kW band the document states for this size, from',
  `kw_max` smallint(5) unsigned DEFAULT NULL COMMENT '… to; NULL on both = no band stated',
  `entry_key` varchar(96) GENERATED ALWAYS AS (concat_ws('|',`width_mm`,`aspect`,`diameter_in`,`axle`,ifnull(`kw_min`,''),ifnull(`kw_max`,''),ifnull(`min_load_index`,''),ifnull(`min_speed_symbol`,''))) STORED COMMENT 'size, axle, kW band and printed indexes: one entry each per row',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fitment_tyre_size_entry` (`fitment_id`,`entry_key`),
  KEY `idx_fitment_tyre_size_lookup` (`width_mm`,`aspect`,`diameter_in`),
  CONSTRAINT `fitment_tyre_sizes_fitment_id_foreign` FOREIGN KEY (`fitment_id`) REFERENCES `fitments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_fitment_tyre_sizes_axle` CHECK (`axle` in ('ALL','FRONT','REAR')),
  CONSTRAINT `chk_fts_width` CHECK (`width_mm` > 0),
  CONSTRAINT `chk_fts_aspect` CHECK (`aspect` > 0),
  CONSTRAINT `chk_fts_diameter` CHECK (`diameter_in` > 0),
  CONSTRAINT `chk_fts_load_index` CHECK (`min_load_index` is null or `min_load_index` > 0),
  CONSTRAINT `chk_fts_kw_band` CHECK (`kw_min` is null and `kw_max` is null or `kw_min` > 0 and `kw_max` >= `kw_min`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop fitment_tyre_size_conditions
DROP TABLE IF EXISTS `fitment_tyre_size_conditions`;
--@create fitment_tyre_size_conditions
CREATE TABLE `fitment_tyre_size_conditions` (
  `fitment_tyre_size_id` bigint(20) unsigned NOT NULL,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'as printed; resolved against the row''s own document',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`fitment_tyre_size_id`,`code`),
  CONSTRAINT `fitment_tyre_size_conditions_fitment_tyre_size_id_foreign` FOREIGN KEY (`fitment_tyre_size_id`) REFERENCES `fitment_tyre_sizes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop invoices
DROP TABLE IF EXISTS `invoices`;
--@create invoices
CREATE TABLE `invoices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `kind` varchar(16) NOT NULL,
  `series` varchar(8) NOT NULL,
  `sequence` int(10) unsigned NOT NULL,
  `number` varchar(32) NOT NULL,
  `issued_at` timestamp NOT NULL,
  `net_cents` int(10) unsigned NOT NULL,
  `tax_cents` int(10) unsigned NOT NULL,
  `gross_cents` int(10) unsigned NOT NULL,
  `tax_rate_bp` smallint(5) unsigned NOT NULL,
  `currency` char(3) NOT NULL,
  `seller` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'who issued it, frozen: name, address, tax number or USt-IdNr' CHECK (json_valid(`seller`)),
  `buyer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'to whom, frozen' CHECK (json_valid(`buyer`)),
  `lines` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'quantity and kind of each item, net, VAT and gross, frozen' CHECK (json_valid(`lines`)),
  `refund_id` bigint(20) unsigned DEFAULT NULL COMMENT 'a credit note: the refund it documents',
  `corrects_invoice_id` bigint(20) unsigned DEFAULT NULL COMMENT 'a credit note: the invoice it corrects',
  `pdf_key` varchar(255) NOT NULL,
  `pdf_sha256` char(64) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_series_sequence` (`series`,`sequence`),
  UNIQUE KEY `invoices_number_unique` (`number`),
  KEY `invoices_order_id_foreign` (`order_id`),
  KEY `invoices_corrects_invoice_id_foreign` (`corrects_invoice_id`),
  KEY `invoices_refund_id_foreign` (`refund_id`),
  CONSTRAINT `invoices_corrects_invoice_id_foreign` FOREIGN KEY (`corrects_invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `invoices_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `invoices_refund_id_foreign` FOREIGN KEY (`refund_id`) REFERENCES `refunds` (`id`),
  CONSTRAINT `chk_invoice_kind` CHECK (`kind` in ('invoice','credit_note')),
  CONSTRAINT `chk_invoice_sums` CHECK (`net_cents` + `tax_cents` = `gross_cents`),
  CONSTRAINT `chk_invoice_currency` CHECK (`currency` = ucase(`currency`)),
  CONSTRAINT `chk_invoice_sequence` CHECK (`sequence` > 0),
  CONSTRAINT `chk_invoice_series` CHECK (`series` in ('RE','GS','TRE','TGS')),
  CONSTRAINT `chk_invoice_series_kind` CHECK (`kind` = 'invoice' = `series` in ('RE','TRE')),
  CONSTRAINT `chk_invoice_test_number` CHECK (left(`series`,1) = 'T' = (left(`number`,5) = 'TEST-')),
  CONSTRAINT `chk_invoice_number` CHECK (`number` = concat(if(left(`series`,1) = 'T',concat('TEST-',substr(`series`,2)),`series`),'-',lpad(`sequence`,greatest(6,char_length(`sequence`)),'0')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger invoices trg_invoices_no_delete
DELIMITER ;;
CREATE TRIGGER trg_invoices_no_delete
    BEFORE DELETE ON invoices
    FOR EACH ROW
    BEGIN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'invoices are never deleted';
    END;;
DELIMITER ;
--@trigger invoices trg_invoices_take_number
DELIMITER ;;
CREATE TRIGGER trg_invoices_take_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    BEGIN
        IF NOT (NEW.sequence <=> (SELECT s.last_number FROM invoice_sequences s WHERE s.series = NEW.series)) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'an invoice takes the number its series has just counted to';
        END IF;
    END;;
DELIMITER ;
--@trigger invoices trg_invoices_no_update
DELIMITER ;;
CREATE TRIGGER trg_invoices_no_update
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    BEGIN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'invoices are issued once: correct one with a credit note';
    END;;
DELIMITER ;
--@drop invoice_sequences
DROP TABLE IF EXISTS `invoice_sequences`;
--@create invoice_sequences
CREATE TABLE `invoice_sequences` (
  `series` varchar(8) NOT NULL,
  `last_number` int(10) unsigned NOT NULL DEFAULT 0,
  `first_number` int(10) unsigned DEFAULT NULL COMMENT 'a real series: its first number, from the client''s accounting',
  `opened_by_admin_id` bigint(20) unsigned DEFAULT NULL,
  `opened_by_name` varchar(191) DEFAULT NULL COMMENT 'who opened it, frozen',
  `opened_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`series`),
  CONSTRAINT `chk_invoice_sequence_series` CHECK (`series` in ('RE','GS','TRE','TGS'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger invoice_sequences trg_invoice_sequences_no_delete
DELIMITER ;;
CREATE TRIGGER trg_invoice_sequences_no_delete
    BEFORE DELETE ON invoice_sequences
    FOR EACH ROW
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'an invoice series is never deleted';
    END;;
DELIMITER ;
--@trigger invoice_sequences trg_invoice_sequences_insert
DELIMITER ;;
CREATE TRIGGER trg_invoice_sequences_insert
    BEFORE INSERT ON invoice_sequences
    FOR EACH ROW
    BEGIN
        IF LEFT(NEW.series, 1) = 'T' THEN
            IF NEW.last_number <> 0 OR NEW.first_number IS NOT NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'a test invoice series starts at 1';
            END IF;
        ELSEIF NEW.first_number IS NULL OR NEW.first_number < 1 OR NEW.last_number + 1 <> NEW.first_number
            OR NEW.opened_by_name IS NULL OR NEW.opened_at IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'a real invoice series is opened once, at its first number, by a named operator';
        END IF;
    END;;
DELIMITER ;
--@trigger invoice_sequences trg_invoice_sequences_update
DELIMITER ;;
CREATE TRIGGER trg_invoice_sequences_update
    BEFORE UPDATE ON invoice_sequences
    FOR EACH ROW
    BEGIN
        IF NOT (NEW.series <=> OLD.series) OR NEW.last_number <> OLD.last_number + 1
            OR NOT (NEW.first_number <=> OLD.first_number) OR NOT (NEW.opened_by_admin_id <=> OLD.opened_by_admin_id)
            OR NOT (NEW.opened_by_name <=> OLD.opened_by_name) OR NOT (NEW.opened_at <=> OLD.opened_at) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'an invoice series only ever counts on by one';
        END IF;
    END;;
DELIMITER ;
--@drop jobs
DROP TABLE IF EXISTS `jobs`;
--@create jobs
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop job_batches
DROP TABLE IF EXISTS `job_batches`;
--@create job_batches
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop load_index_table
DROP TABLE IF EXISTS `load_index_table`;
--@create load_index_table
CREATE TABLE `load_index_table` (
  `load_index` smallint(5) unsigned NOT NULL,
  `capacity_kg` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`load_index`),
  CONSTRAINT `chk_load_index_capacity` CHECK (`capacity_kg` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows load_index_table
INSERT INTO `load_index_table` (`load_index`, `capacity_kg`) VALUES (70, 335), (71, 345), (72, 355), (73, 365), (74, 375), (75, 387), (76, 400), (77, 412), (78, 425), (79, 437), (80, 450), (81, 462), (82, 475), (83, 487), (84, 500), (85, 515), (86, 530), (87, 545), (88, 560), (89, 580), (90, 600), (91, 615), (92, 630), (93, 650), (94, 670), (95, 690), (96, 710), (97, 730), (98, 750), (99, 775), (100, 800), (101, 825), (102, 850), (103, 875), (104, 900), (105, 925), (106, 950), (107, 975), (108, 1000), (109, 1030), (110, 1060), (111, 1090), (112, 1120), (113, 1150), (114, 1180), (115, 1215), (116, 1250), (117, 1285), (118, 1320), (119, 1360), (120, 1400);
--@drop mail_settings
DROP TABLE IF EXISTS `mail_settings`;
--@create mail_settings
CREATE TABLE `mail_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `state` varchar(8) NOT NULL,
  `region` varchar(32) NOT NULL DEFAULT 'eu-north-1',
  `from_address` varchar(254) DEFAULT NULL,
  `from_name` varchar(120) DEFAULT NULL,
  `access_key` text DEFAULT NULL,
  `secret` text DEFAULT NULL,
  `key_last4` char(4) DEFAULT NULL,
  `secret_last4` char(4) DEFAULT NULL,
  `topic_arn` varchar(256) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `last_test` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`last_test`)),
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mail_settings_state_unique` (`state`),
  KEY `mail_settings_updated_by_foreign` (`updated_by`),
  CONSTRAINT `mail_settings_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_mail_state` CHECK (`state` in ('active','pending'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop mail_suppressions
DROP TABLE IF EXISTS `mail_suppressions`;
--@create mail_suppressions
CREATE TABLE `mail_suppressions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(254) NOT NULL,
  `reason` varchar(16) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `sns_message_id` varchar(100) NOT NULL,
  `occurred_at` timestamp NOT NULL,
  `released_at` timestamp NULL DEFAULT NULL,
  `released_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mail_suppressions_sns_message_id_email_unique` (`sns_message_id`,`email`),
  KEY `mail_suppressions_released_by_foreign` (`released_by`),
  KEY `mail_suppressions_email_index` (`email`),
  CONSTRAINT `mail_suppressions_released_by_foreign` FOREIGN KEY (`released_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_mail_suppression_reason` CHECK (`reason` in ('bounce','complaint'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop media
DROP TABLE IF EXISTS `media`;
--@create media
CREATE TABLE `media` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `collection_name` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `disk` varchar(255) NOT NULL,
  `conversions_disk` varchar(255) DEFAULT NULL,
  `size` bigint(20) unsigned NOT NULL,
  `manipulations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`manipulations`)),
  `custom_properties` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`custom_properties`)),
  `generated_conversions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`generated_conversions`)),
  `responsive_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`responsive_images`)),
  `order_column` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `media_uuid_unique` (`uuid`),
  KEY `media_model_type_model_id_index` (`model_type`,`model_id`),
  KEY `media_order_column_index` (`order_column`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop migrations
DROP TABLE IF EXISTS `migrations`;
--@create migrations
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows migrations
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1, '0001_01_01_000000_create_users_table', 1), (2, '0001_01_01_000001_create_cache_table', 1), (3, '0001_01_01_000002_create_jobs_table', 1), (4, '2026_09_20_000101_create_permission_tables', 1), (5, '2026_09_20_000102_create_activity_log_table', 1), (6, '2026_09_20_000103_create_media_table', 1), (7, '2026_09_20_000104_create_telescope_entries_table', 1), (8, '2026_09_20_100100_create_admin_users_table', 1), (9, '2026_09_20_100200_create_vehicles_table', 1), (10, '2026_09_20_100300_create_catalogue_tables', 1), (11, '2026_09_20_100400_create_approval_documents_table', 1), (12, '2026_09_20_100500_create_fitments_table', 1), (13, '2026_09_20_100600_create_condition_tables', 1), (14, '2026_09_20_100700_create_reference_and_conflict_tables', 1), (15, '2026_09_21_100800_add_supersede_guard_to_approval_documents', 1), (16, '2026_09_21_100900_add_presentation_columns_to_catalogue', 1), (17, '2026_09_21_200100_create_commerce_tables', 1), (18, '2026_09_21_200200_create_order_line_fitments_table', 1), (19, '2026_09_21_200300_create_content_and_access_tables', 1), (20, '2026_09_21_200400_add_role_metadata_to_roles', 1), (21, '2026_09_21_210000_fix_navigation_links', 1), (22, '2026_09_22_000100_phase0_navigation_and_search', 1), (23, '2026_09_23_000100_phase0_homepage_data', 1), (24, '2026_09_23_000200_create_fitment_subscriptions_table', 1), (25, '2026_09_23_000300_add_demo_flag_and_image_manifest_to_catalogue', 1), (26, '2026_09_24_000100_add_max_load_to_wheel_configs', 1), (27, '2026_09_25_000100_create_komplettrad_option_tables', 1), (28, '2026_09_25_000200_add_komplettrad_columns_to_commerce', 1), (29, '2026_09_25_000300_add_is_wheel_brand_to_brands', 1), (30, '2026_09_25_000400_add_centre_bore_to_fitments', 1), (31, '2026_09_26_000100_add_preferences_to_admin_users', 1), (32, '2026_09_26_000200_german_role_labels', 1), (33, '2026_09_26_000310_create_admin_invitations_table', 1), (34, '2026_09_26_000320_add_sessions_revoked_at_to_admin_users', 1), (35, '2026_09_26_000330_let_closed_invitations_release_their_role', 1), (36, '2026_09_26_000400_index_audit_logs_for_filters', 1), (37, '2026_09_26_000500_add_drafts_and_revisions_to_pages', 1), (38, '2026_09_26_000510_add_team_edit_marks_to_faq_and_nav', 1), (39, '2026_09_26_000520_add_content_version_to_pages', 1), (40, '2026_09_26_000600_create_notifications_table', 1), (41, '2026_09_26_000700_add_order_list_columns', 1), (42, '2026_09_27_000800_create_verdict_tallies_table', 1), (43, '2026_09_27_000900_create_demand_marks_table', 1), (44, '2026_09_27_001000_create_saved_views_table', 1), (45, '2026_09_28_000100_add_columns_to_saved_views', 1), (46, '2026_09_28_000200_mark_demo_rows', 1), (47, '2026_09_28_000300_create_storage_settings_table', 1), (48, '2026_09_28_000400_demo_models_never_published', 1), (49, '2026_09_28_000500_catalogue_admin', 1), (50, '2026_09_28_000600_create_review_feedback_table', 1), (51, '2026_09_28_000700_vehicle_provenance', 1), (52, '2026_09_28_000800_create_wheel_finish_images_table', 1), (53, '2026_09_28_000900_catalogue_import_supplier', 1), (54, '2026_09_28_001000_vehicle_source_values', 1), (55, '2026_09_28_001100_brands_unique_among_live', 1), (56, '2026_09_28_001200_document_conditions', 1), (57, '2026_09_28_001300_derived_entry_per_tyre_size', 1), (58, '2026_09_28_001400_conflict_decisions', 1), (59, '2026_09_28_001500_document_record_shape', 1), (60, '2026_09_28_001600_six_spoke_wheels', 1), (61, '2026_09_28_001700_document_speed_deratings', 1), (62, '2026_09_28_001800_load_limit_confirmation', 1), (63, '2026_09_28_001900_derating_seed_origin', 1), (64, '2026_09_28_002000_vehicles_from_documents', 1), (65, '2026_09_29_000100_check_results', 1), (66, '2026_09_29_000200_tyre_size_power_band', 1), (67, '2026_09_29_000300_tyre_size_entries', 1), (68, '2026_09_29_100100_payments', 1), (69, '2026_09_29_100200_refunds_disputes_invoices', 1), (70, '2026_09_29_100300_brand_manufacturer', 1), (71, '2026_09_29_100400_customer_accounts', 1), (72, '2026_09_30_100100_invoice_series_opening', 1), (73, '2026_10_01_000100_reword_three_faq_answers', 1), (74, '2026_10_01_100100_document_papers_and_annexes', 1), (75, '2026_10_01_100200_add_internal_note_to_wheel_models', 1), (76, '2026_10_02_000100_reviews_and_delivery', 1), (77, '2026_10_02_000200_condition_levels', 1), (78, '2026_10_02_000300_order_line_axle', 1), (79, '2026_10_02_000500_contact_messages', 1), (80, '2026_10_05_000100_record_database_environment', 1), (81, '2026_10_06_000100_create_mail_settings_and_suppressions', 1), (82, '2026_10_07_000100_acceptance_set', 1), (83, '2026_10_07_000200_demo_never_published_null_safe', 1), (84, '2026_10_14_000100_document_completeness', 1), (85, '2026_10_14_000200_faq_entry_question_quotes', 1), (86, '2026_10_15_000100_order_origin', 1), (87, '2026_10_16_000100_document_counts', 1), (88, '2026_10_17_000100_document_tyre_combinations', 1), (89, '2026_10_17_000200_fitments_document_status_index', 1), (90, '2026_10_18_000100_document_tyre_index_source', 1), (91, '2026_10_18_000200_audit_logs_people_index', 1), (92, '2026_10_18_000300_vehicle_imports', 1), (93, '2026_10_18_000310_vehicle_numbers_per_source', 1), (94, '2026_10_18_000400_wheel_title_and_availability', 1), (95, '2026_10_19_000100_tyre_availability_and_label', 1), (96, '2026_10_19_000200_load_index_to_120', 1), (97, '2026_10_23_000100_legal_placeholder_flag', 1), (98, '2026_10_24_000100_drop_unreal_role_cells', 1), (99, '2026_10_29_000100_wheel_model_stated_rating', 1), (100, '2026_10_29_000200_pages_soft_delete', 1);
--@drop model_has_permissions
DROP TABLE IF EXISTS `model_has_permissions`;
--@create model_has_permissions
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop model_has_roles
DROP TABLE IF EXISTS `model_has_roles`;
--@create model_has_roles
CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows model_has_roles
INSERT INTO `model_has_roles` (`role_id`, `model_type`, `model_id`) VALUES (1, 'App\\Models\\AdminUser', 10), (2, 'App\\Models\\AdminUser', 9), (4, 'App\\Models\\AdminUser', 8);
--@drop nav_items
DROP TABLE IF EXISTS `nav_items`;
--@create nav_items
CREATE TABLE `nav_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `menu` varchar(32) NOT NULL COMMENT 'header | footer_pages | footer_legal | mobile_bottom',
  `label` varchar(255) NOT NULL,
  `href` varchar(255) DEFAULT NULL,
  `route_name` varchar(255) DEFAULT NULL,
  `behaviour` varchar(32) DEFAULT NULL,
  `icon` varchar(32) DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `team_edited_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_nav_menu` (`menu`,`sort_order`,`visible`),
  CONSTRAINT `chk_nav_items_menu` CHECK (`menu` in ('header','footer_shop','footer_service','footer_legal','mobile_bottom'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows nav_items
INSERT INTO `nav_items` (`id`, `menu`, `label`, `href`, `route_name`, `behaviour`, `icon`, `sort_order`, `visible`, `team_edited_at`, `created_at`, `updated_at`) VALUES (1, 'header', 'Felgen', NULL, 'felgen.index', NULL, NULL, 10, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (2, 'header', 'RIMIFY-Check', NULL, 'check.index', NULL, NULL, 20, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (4, 'header', 'Kontakt', NULL, 'kontakt', NULL, NULL, 40, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (5, 'footer_shop', 'Alle Felgen', NULL, 'felgen.index', NULL, NULL, 10, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (6, 'footer_shop', 'Fahrzeug wählen', NULL, 'felgen.suchen', NULL, NULL, 20, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (7, 'footer_shop', 'RIMIFY-Check', NULL, 'check.index', NULL, NULL, 30, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (9, 'footer_service', 'Kontakt', NULL, 'kontakt', NULL, NULL, 20, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (10, 'footer_service', 'Versand', '/rechtliches/versand', NULL, NULL, NULL, 30, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (11, 'footer_legal', 'Impressum', '/rechtliches/impressum', NULL, NULL, NULL, 10, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (12, 'footer_legal', 'Datenschutz', '/rechtliches/datenschutz', NULL, NULL, NULL, 20, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (13, 'footer_legal', 'AGB', '/rechtliches/agb', NULL, NULL, NULL, 30, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (14, 'footer_legal', 'Widerrufsbelehrung', '/rechtliches/widerrufsbelehrung', NULL, NULL, NULL, 40, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (15, 'mobile_bottom', 'Start', NULL, 'startseite', NULL, 'home', 10, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (16, 'mobile_bottom', 'Felgen', NULL, 'felgen.index', NULL, 'wheel', 20, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (17, 'mobile_bottom', 'Check', NULL, 'check.index', NULL, 'check-circle', 30, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (18, 'mobile_bottom', 'Kontakt', NULL, 'kontakt', NULL, 'mail', 40, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (19, 'mobile_bottom', 'Warenkorb', NULL, 'warenkorb.index', NULL, 'cart', 50, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (20, 'header', 'Häufige Fragen', NULL, 'faq', NULL, NULL, 30, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (21, 'footer_shop', 'Felgenrechner', NULL, 'felgenrechner.index', NULL, NULL, 40, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (22, 'footer_shop', 'Blog', NULL, 'blog.index', NULL, NULL, 50, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (23, 'footer_service', 'Häufige Fragen', NULL, 'faq', NULL, NULL, 10, 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00');
--@drop notifications
DROP TABLE IF EXISTS `notifications`;
--@create notifications
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `type` varchar(255) NOT NULL,
  `notifiable_type` varchar(255) NOT NULL,
  `notifiable_id` bigint(20) unsigned NOT NULL,
  `data` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`),
  KEY `notifications_notifiable_type_notifiable_id_read_at_index` (`notifiable_type`,`notifiable_id`,`read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop orders
DROP TABLE IF EXISTS `orders`;
--@create orders
CREATE TABLE `orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(32) NOT NULL,
  `customer_id` bigint(20) unsigned NOT NULL,
  `delivery_address_id` bigint(20) unsigned NOT NULL,
  `billing_address_id` bigint(20) unsigned NOT NULL,
  `status` varchar(24) NOT NULL DEFAULT 'DRAFT',
  `vehicle_id` bigint(20) unsigned DEFAULT NULL,
  `vehicle_label` varchar(255) DEFAULT NULL,
  `vehicle_make` varchar(255) DEFAULT NULL,
  `vehicle_hsn` varchar(4) DEFAULT NULL,
  `vehicle_tsn` varchar(3) DEFAULT NULL,
  `vehicle_vsn` varchar(16) DEFAULT NULL,
  `subtotal_cents` int(10) unsigned NOT NULL DEFAULT 0,
  `shipping_cents` int(10) unsigned NOT NULL DEFAULT 0,
  `tax_cents` int(10) unsigned NOT NULL DEFAULT 0,
  `total_cents` int(10) unsigned NOT NULL DEFAULT 0,
  `refunded_cents` int(10) unsigned NOT NULL DEFAULT 0,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `payment_method` varchar(32) DEFAULT NULL,
  `payment_flag` varchar(255) DEFAULT NULL COMMENT 'why the order is held back from fulfilment, e.g. an amount that does not match',
  `payment_error` varchar(255) DEFAULT NULL COMMENT 'the provider''s last refusal, in its words',
  `stock_reserved` tinyint(1) NOT NULL DEFAULT 0,
  `shipping_method` varchar(32) DEFAULT NULL,
  `stripe_session_id` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `placed_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL COMMENT 'unpaid past this, the order expires and its stock is released',
  `paid_at` timestamp NULL DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `review_invited_at` timestamp NULL DEFAULT NULL,
  `tracking_code` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  `origin` varchar(16) NOT NULL DEFAULT 'checkout' COMMENT 'checkout: a person placed it through the checkout · seeded: a seeder wrote it, nobody is behind it; fixed at insert',
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_unique` (`order_number`),
  UNIQUE KEY `orders_stripe_session_id_unique` (`stripe_session_id`),
  UNIQUE KEY `orders_demo_ref_unique` (`demo_ref`),
  KEY `orders_customer_id_foreign` (`customer_id`),
  KEY `orders_delivery_address_id_foreign` (`delivery_address_id`),
  KEY `orders_billing_address_id_foreign` (`billing_address_id`),
  KEY `idx_order_status` (`status`,`placed_at`),
  KEY `idx_order_vehicle` (`vehicle_id`),
  KEY `idx_order_keys` (`vehicle_hsn`,`vehicle_tsn`),
  KEY `idx_order_placed` (`placed_at`),
  KEY `idx_order_total` (`total_cents`),
  KEY `idx_order_payment_method` (`payment_method`),
  KEY `idx_order_shipping_method` (`shipping_method`),
  KEY `orders_is_demo_index` (`is_demo`),
  KEY `orders_status_expires_at_index` (`status`,`expires_at`),
  CONSTRAINT `orders_billing_address_id_foreign` FOREIGN KEY (`billing_address_id`) REFERENCES `addresses` (`id`),
  CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `orders_delivery_address_id_foreign` FOREIGN KEY (`delivery_address_id`) REFERENCES `addresses` (`id`),
  CONSTRAINT `chk_order_currency` CHECK (`currency` = ucase(`currency`)),
  CONSTRAINT `chk_order_hsn` CHECK (`vehicle_hsn` is null or `vehicle_hsn` regexp '(?-i)^[0-9A-Z]{4}$'),
  CONSTRAINT `chk_ord_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null),
  CONSTRAINT `chk_orders_status` CHECK (`status` in ('DRAFT','PENDING_PAYMENT','PROCESSING','PAID','IN_FULFILMENT','SHIPPED','COMPLETED','FAILED','EXPIRED','CANCELLED','PARTIALLY_REFUNDED','REFUNDED')),
  CONSTRAINT `chk_order_refunded` CHECK (`refunded_cents` <= `total_cents`),
  CONSTRAINT `chk_ord_origin` CHECK (`origin` in ('checkout','seeded'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger orders trg_ord_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_ord_demo_fixed
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@trigger orders trg_ord_origin_fixed
DELIMITER ;;
CREATE TRIGGER trg_ord_origin_fixed
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NOT (NEW.origin <=> OLD.origin) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'origin is fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop order_lines
DROP TABLE IF EXISTS `order_lines`;
--@create order_lines
CREATE TABLE `order_lines` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `kind` varchar(16) NOT NULL,
  `wheel_config_id` bigint(20) unsigned DEFAULT NULL,
  `tyre_variant_id` bigint(20) unsigned DEFAULT NULL,
  `balance_weight_colour_id` bigint(20) unsigned DEFAULT NULL,
  `tpms_sensor_price_id` bigint(20) unsigned DEFAULT NULL,
  `package_group` smallint(5) unsigned DEFAULT NULL,
  `axle` varchar(5) DEFAULT NULL COMMENT 'FRONT or REAR on a Mischbereifung line',
  `label` varchar(255) NOT NULL COMMENT 'frozen description as shown at purchase',
  `quantity` smallint(5) unsigned NOT NULL,
  `unit_price_cents` int(10) unsigned NOT NULL,
  `line_total_cents` int(10) unsigned NOT NULL,
  `tax_rate_bp` smallint(5) unsigned NOT NULL DEFAULT 1900,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_lines_demo_ref_unique` (`demo_ref`),
  KEY `idx_order_line_package` (`order_id`,`package_group`),
  KEY `idx_order_line_weight_colour` (`balance_weight_colour_id`),
  KEY `idx_order_line_tpms` (`tpms_sensor_price_id`),
  KEY `order_lines_is_demo_index` (`is_demo`),
  CONSTRAINT `order_lines_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_order_lines_kind` CHECK (`kind` in ('WHEEL','TYRE','PACKAGE','SERVICE','ACCESSORY')),
  CONSTRAINT `chk_order_line_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_oli_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null),
  CONSTRAINT `chk_order_line_axle` CHECK (`axle` is null or `axle` in ('FRONT','REAR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger order_lines trg_oli_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_oli_demo_fixed
BEFORE UPDATE ON order_lines
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop order_line_fitments
DROP TABLE IF EXISTS `order_line_fitments`;
--@create order_line_fitments
CREATE TABLE `order_line_fitments` (
  `order_line_id` bigint(20) unsigned NOT NULL,
  `vehicle_id` bigint(20) unsigned NOT NULL,
  `wheel_config_id` bigint(20) unsigned NOT NULL,
  `fitment_id` bigint(20) unsigned NOT NULL,
  `approval_document_id` bigint(20) unsigned NOT NULL,
  `document_revision` int(10) unsigned NOT NULL,
  `verdict` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'the full FitmentVerdict, as rendered' CHECK (json_valid(`verdict`)),
  `verdict_status` varchar(16) NOT NULL COMMENT 'lifted out for indexing and reporting',
  `requires_entry` tinyint(1) NOT NULL,
  `pdf_sha256` varchar(64) DEFAULT NULL,
  `engine_version` varchar(32) NOT NULL,
  `computed_at` timestamp NOT NULL,
  `has_conditions` tinyint(1) GENERATED ALWAYS AS (coalesce(json_length(`verdict`,'$.conditions'),0) > 0) STORED COMMENT 'derived from the frozen verdict; never written',
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`order_line_id`),
  UNIQUE KEY `order_line_fitments_demo_ref_unique` (`demo_ref`),
  KEY `idx_olf_status` (`verdict_status`),
  KEY `idx_olf_fitment` (`fitment_id`),
  KEY `idx_olf_document` (`approval_document_id`,`document_revision`),
  KEY `idx_olf_has_conditions` (`has_conditions`),
  KEY `order_line_fitments_is_demo_index` (`is_demo`),
  CONSTRAINT `order_line_fitments_order_line_id_foreign` FOREIGN KEY (`order_line_id`) REFERENCES `order_lines` (`id`),
  CONSTRAINT `chk_olf_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger order_line_fitments trg_olf_no_delete
DELIMITER ;;
CREATE TRIGGER trg_olf_no_delete
BEFORE DELETE ON order_line_fitments
FOR EACH ROW
BEGIN
    IF NOT (OLD.is_demo = 1 AND OLD.demo_ref IS NOT NULL) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'order_line_fitments is append-only';
    END IF;
END;;
DELIMITER ;
--@trigger order_line_fitments trg_olf_no_update
DELIMITER ;;
CREATE TRIGGER trg_olf_no_update
    BEFORE UPDATE ON order_line_fitments
    FOR EACH ROW
    BEGIN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'order_line_fitments is append-only';
    END;;
DELIMITER ;
--@drop pages
DROP TABLE IF EXISTS `pages`;
--@create pages
CREATE TABLE `pages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `locale` char(2) NOT NULL DEFAULT 'de',
  `kind` varchar(16) NOT NULL COMMENT 'marketing | faq | legal | guide',
  `title` varchar(255) NOT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `status` varchar(16) NOT NULL DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `draft` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`draft`)),
  `draft_updated_at` timestamp NULL DEFAULT NULL,
  `draft_author_email` varchar(255) DEFAULT NULL,
  `lawyer_reviewed` tinyint(1) NOT NULL DEFAULT 0,
  `is_placeholder` tinyint(1) NOT NULL DEFAULT 1,
  `team_edited_at` timestamp NULL DEFAULT NULL,
  `content_version` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pages_slug_unique` (`slug`),
  KEY `idx_page_status` (`status`,`kind`),
  CONSTRAINT `chk_pages_kind` CHECK (`kind` in ('marketing','faq','legal','guide')),
  CONSTRAINT `chk_pages_status` CHECK (`status` in ('draft','published','archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows pages
INSERT INTO `pages` (`id`, `slug`, `locale`, `kind`, `title`, `meta_title`, `meta_description`, `status`, `published_at`, `draft`, `draft_updated_at`, `draft_author_email`, `lawyer_reviewed`, `is_placeholder`, `team_edited_at`, `content_version`, `created_at`, `updated_at`, `deleted_at`) VALUES (1, 'startseite', 'de', 'marketing', 'Startseite', NULL, NULL, 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (2, 'faq', 'de', 'faq', 'Häufige Fragen', NULL, NULL, 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (3, 'kontakt', 'de', 'marketing', 'Kontakt', NULL, NULL, 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (4, 'impressum', 'de', 'legal', 'Impressum', NULL, NULL, 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (5, 'datenschutz', 'de', 'legal', 'Datenschutz', NULL, NULL, 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (6, 'agb', 'de', 'legal', 'AGB', NULL, NULL, 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (7, 'widerrufsbelehrung', 'de', 'legal', 'Widerrufsbelehrung', NULL, NULL, 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (8, 'versand', 'de', 'legal', 'Versand', NULL, NULL, 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (9, 'hsn-und-tsn-finden', 'de', 'guide', 'HSN und TSN finden', NULL, 'HSN und TSN stehen in der Zulassungsbescheinigung Teil I, Felder 2.1 und 2.2. Wo du sie findest, was sie bedeuten und was du bei mehreren Treffern tust.', 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (10, 'abe-teilegutachten-ece', 'de', 'guide', 'ABE, Teilegutachten, ECE – der Unterschied', NULL, 'ABE, Teilegutachten und ECE-Genehmigung: Was die drei Dokumente für Felgen unterscheidet, was Auflagen und Eintragung bedeuten und was beim Kauf zählt.', 'draft', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL), (11, 'einpresstiefe-et-erklaert', 'de', 'guide', 'Einpresstiefe (ET) verständlich erklärt', NULL, 'Einpresstiefe (ET) erklärt: Was der Wert in Millimetern bedeutet, was eine kleinere oder größere ET bewirkt und warum das Gutachten entscheidet.', 'published', '2026-10-04 00:00:00', NULL, NULL, NULL, 0, 1, NULL, 0, '2026-10-04 00:00:00', '2026-10-04 00:00:00', NULL);
--@drop page_blocks
DROP TABLE IF EXISTS `page_blocks`;
--@create page_blocks
CREATE TABLE `page_blocks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `page_id` bigint(20) unsigned NOT NULL,
  `type` varchar(32) NOT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'validated per type on write' CHECK (json_valid(`data`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_block_order` (`page_id`,`sort_order`),
  CONSTRAINT `page_blocks_page_id_foreign` FOREIGN KEY (`page_id`) REFERENCES `pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows page_blocks
INSERT INTO `page_blocks` (`id`, `page_id`, `type`, `sort_order`, `data`, `created_at`, `updated_at`) VALUES (1, 1, 'hero', 10, '{\"headline\":\"Felgen, die an dein Auto dürfen.\",\"sub\":\"Wir zeigen dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen und allen Auflagen. Du gibst dein Auto an, wir prüfen den Rest.\",\"sub_mobile\":\"Nur Felgen, deren Gutachten dein Fahrzeug nennt – mit Reifengrößen und Auflagen.\",\"foto\":\"borbet-db8gt2-schwarz-matt\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (2, 1, 'promise_row', 15, '{\"items\":[{\"icon\":\"check\",\"title\":\"Nur Felgen mit Freigabe\",\"text\":\"Jede Felge, die wir dir zeigen, steht mit deinem Fahrzeug im Gutachten.\"},{\"icon\":\"document\",\"title\":\"Gutachten zu jeder Felge\",\"text\":\"Bei jeder Felge siehst du, welches Gutachten sie für dein Fahrzeug freigibt.\"},{\"icon\":\"wrench\",\"title\":\"Montiert und gewuchtet\",\"text\":\"So kommt jedes Komplettrad bei dir an.\"},{\"icon\":\"truck\",\"title\":\"Versand aus Deutschland\",\"text\":\"Wir versenden direkt aus Deutschland.\"}]}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (3, 2, 'faq_list', 10, '{\"heading\":\"Häufige Fragen\",\"search_placeholder\":\"Suchen\",\"groups\":[\"KOMPATIBILITÄT & FREIGABE\",\"BESTELLUNG & VERSAND\"]}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (4, 4, 'legal_body', 10, '{\"heading\":\"Impressum\",\"text\":\"[Rechtstext folgt von der Kanzlei — Abschnitt: Impressum]\",\"placeholder\":true}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (5, 5, 'legal_body', 10, '{\"heading\":\"Datenschutz\",\"text\":\"[Rechtstext folgt von der Kanzlei — Abschnitt: Datenschutz]\",\"placeholder\":true}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (6, 6, 'legal_body', 10, '{\"heading\":\"AGB\",\"text\":\"[Rechtstext folgt von der Kanzlei — Abschnitt: AGB]\",\"placeholder\":true}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (7, 7, 'legal_body', 10, '{\"heading\":\"Widerrufsbelehrung\",\"text\":\"[Rechtstext folgt von der Kanzlei — Abschnitt: Widerrufsbelehrung]\",\"placeholder\":true}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (8, 8, 'legal_body', 10, '{\"heading\":\"Versand\",\"text\":\"[Rechtstext folgt von der Kanzlei — Abschnitt: Versand]\",\"placeholder\":true}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (9, 9, 'guide_lead', 0, '{\"teaser\":\"Mit zwei kurzen Nummern aus der Zulassungsbescheinigung Teil I findest du dein Fahrzeug bei uns. Wo sie stehen und was sie bedeuten.\",\"minutes\":3}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (10, 9, 'prose', 10, '{\"heading\":\"Zwei Nummern, ein Fahrzeugtyp\",\"text\":\"Die HSN ist die Herstellerschl\\u00fcsselnummer. Sie hat vier Zeichen und steht f\\u00fcr den Hersteller deines Fahrzeugs. Die TSN ist die Typschl\\u00fcsselnummer. Sie hat drei Zeichen und steht f\\u00fcr den Fahrzeugtyp.\\n\\nZusammen beschreiben die beiden Nummern dein Fahrzeug genauer als Marke und Modellname. Ein \\u201eGolf\\u201c kann viele Motoren, Karosserien und Baujahre meinen. HSN und TSN grenzen das ein. Deshalb fragen wir zuerst nach diesen beiden Nummern und nicht nach dem Modell.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (11, 9, 'prose', 20, '{\"heading\":\"Wo sie in der Zulassungsbescheinigung Teil I stehen\",\"text\":\"Die Zulassungsbescheinigung Teil I ist das Dokument, das fr\\u00fcher Fahrzeugschein hie\\u00df. Ihre Felder sind nummeriert; du suchst die Felder 2.1 und 2.2.\\n\\nFeld 2.1 enth\\u00e4lt die HSN, also vier Zeichen. Feld 2.2 enth\\u00e4lt die TSN und dahinter weitere Zeichen. F\\u00fcr die Fahrzeugauswahl z\\u00e4hlen nur die ersten drei Zeichen aus Feld 2.2. Der Rest ist eine Erg\\u00e4nzung, die du bei uns nicht brauchst.\\n\\nEin Beispiel: Steht in Feld 2.1 \\u201e0005\\u201c und beginnt Feld 2.2 mit \\u201e582\\u201c, dann ist die HSN 0005 und die TSN 582. Die f\\u00fchrende Null geh\\u00f6rt zur HSN dazu.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (12, 9, 'prose', 30, '{\"heading\":\"Im alten Fahrzeugschein\",\"text\":\"Hast du noch den alten Fahrzeugschein, gibt es dort keine Felder 2.1 und 2.2. Die Nummern stehen unter \\u201ezu 2\\u201c und \\u201ezu 3\\u201c: die HSN bei \\u201ezu 2\\u201c, die TSN bei \\u201ezu 3\\u201c. Die Bedeutung ist dieselbe, nur die Beschriftung ist eine andere.\\n\\nAuch hier gilt: Die HSN hat vier Zeichen, die TSN drei. Stehen hinter der TSN noch weitere Zeichen, lass sie weg.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (13, 9, 'prose', 40, '{\"heading\":\"So gibst du die Nummern bei uns ein\",\"text\":\"In der Fahrzeugauswahl gibt es ein Feld f\\u00fcr die HSN und eines f\\u00fcr die TSN. Tipp die Zeichen so ein, wie sie im Dokument stehen, mit allen f\\u00fchrenden Nullen. Ob du Gro\\u00df- oder Kleinbuchstaben nimmst, spielt keine Rolle.\\n\\nDanach zeigen wir dir, welches Fahrzeug zu den Nummern geh\\u00f6rt. Pr\\u00fcf kurz, ob das dein Auto ist. Erst dann geht es weiter zu den Felgen, und ab da siehst du nur noch Felgen, f\\u00fcr die ein Gutachten genau dieses Fahrzeug nennt.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (14, 9, 'prose', 50, '{\"heading\":\"Wenn mehrere Fahrzeuge angezeigt werden\",\"text\":\"Das kommt vor und ist kein Fehler. Eine Kombination aus HSN und TSN kann mehrere Varianten umfassen, die sich zum Beispiel im Bauzeitraum, in der H\\u00f6chstgeschwindigkeit oder in der zul\\u00e4ssigen Achslast unterscheiden.\\n\\nF\\u00fcr Felgen und Reifen sind genau diese Unterschiede wichtig. Achslast und H\\u00f6chstgeschwindigkeit entscheiden mit dar\\u00fcber, welche Tragf\\u00e4higkeit und welches Geschwindigkeitssymbol die Reifen brauchen und was das Gutachten f\\u00fcr dein Fahrzeug freigibt. Deshalb fragen wir in diesem Fall nach, statt zu raten. W\\u00e4hle die Variante, die zu deinen Papieren passt. Hilfreich sind dabei das Datum der Erstzulassung, die H\\u00f6chstgeschwindigkeit und die zul\\u00e4ssigen Achslasten; alles steht ebenfalls in der Zulassungsbescheinigung.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (15, 9, 'prose', 60, '{\"heading\":\"Wenn wir dein Fahrzeug nicht finden\",\"text\":\"Oft ist es nur ein Tippfehler oder eine verwechselte Zeile. Pr\\u00fcf zuerst, ob du wirklich Feld 2.1 und die ersten drei Zeichen aus Feld 2.2 genommen hast, ob eine f\\u00fchrende Null fehlt und ob du den Buchstaben O und die Ziffer 0 auseinandergehalten hast.\\n\\nFindest du das Fahrzeug trotzdem nicht, kannst du es \\u00fcber Marke und Modell ausw\\u00e4hlen. Oder du schreibst uns eine E-Mail, am besten mit HSN, TSN und Modell. Die Adresse findest du auf der Kontaktseite. Wir sagen dir dann, was wir zu deinem Fahrzeug haben. Und wenn wir nichts haben, sagen wir dir auch das \\u2013 lieber eine ehrliche Auskunft als eine Felge, die nicht freigegeben ist.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (16, 10, 'guide_lead', 0, '{\"teaser\":\"Ob eine Felge an dein Auto darf, steht in einem Dokument. Wie sich ABE, Teilegutachten und ECE-Genehmigung unterscheiden.\",\"minutes\":3}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (17, 10, 'prose', 10, '{\"heading\":\"Warum es \\u00fcberhaupt ein Dokument braucht\",\"text\":\"Eine Felge ist nicht deshalb f\\u00fcr dein Auto freigegeben, weil sie sich anschrauben l\\u00e4sst. Lochkreis und Mittenlochbohrung k\\u00f6nnen stimmen, und trotzdem fehlt die Freigabe. Freigegeben ist eine Kombination aus Felge und Fahrzeug dann, wenn ein Dokument sie nennt: mit der Felgenbreite, der Einpresstiefe, den erlaubten Reifengr\\u00f6\\u00dfen und, falls n\\u00f6tig, mit Auflagen.\\n\\nF\\u00fcr Felgen gibt es daf\\u00fcr drei Arten von Dokumenten: die ABE, das Teilegutachten und die ECE-Genehmigung. Alle drei beantworten dieselbe Frage. Sie unterscheiden sich darin, wer sie ausstellt und was du nach dem Anschrauben noch tun musst.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (18, 10, 'prose', 20, '{\"heading\":\"Die ABE \\u2013 Allgemeine Betriebserlaubnis\",\"text\":\"ABE steht f\\u00fcr Allgemeine Betriebserlaubnis. F\\u00fcr Felgen wird sie vom Kraftfahrt-Bundesamt erteilt. Sie gilt f\\u00fcr eine bestimmte Felge in einer bestimmten Gr\\u00f6\\u00dfe und listet die Fahrzeuge auf, f\\u00fcr die diese Felge freigegeben ist \\u2013 jeweils mit den erlaubten Reifengr\\u00f6\\u00dfen und den Auflagen, die dabei gelten.\\n\\nIn vielen F\\u00e4llen reicht es, die ABE im Fahrzeug mitzuf\\u00fchren und die Auflagen einzuhalten. Ob das bei deinem Fahrzeug so ist, steht in der ABE selbst: Sie nennt f\\u00fcr jedes Fahrzeug, ob eine Abnahme durch eine Pr\\u00fcfstelle und eine Eintragung in die Fahrzeugpapiere n\\u00f6tig sind. Lies deshalb den Abschnitt zu deinem Fahrzeug, nicht nur das Deckblatt.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (19, 10, 'prose', 30, '{\"heading\":\"Das Teilegutachten\",\"text\":\"Ein Teilegutachten stellt ein Pr\\u00fcflabor oder ein technischer Dienst aus. Es beschreibt, an welchen Fahrzeugen die Felge in welcher Gr\\u00f6\\u00dfe verwendet werden kann und unter welchen Auflagen. Anders als die ABE ist es allein noch keine Erlaubnis.\\n\\nMit einem Teilegutachten muss die \\u00c4nderung an deinem Fahrzeug von einer Pr\\u00fcfstelle abgenommen werden. Der Pr\\u00fcfer schaut, ob die Kombination dem Gutachten entspricht und die Auflagen erf\\u00fcllt sind. Danach wird die \\u00c4nderung in die Fahrzeugpapiere eingetragen. Erst dann ist die Felge an deinem Fahrzeug freigegeben. Vor der Abnahme solltest du mit der Felge nicht auf \\u00f6ffentlichen Stra\\u00dfen unterwegs sein.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (20, 10, 'prose', 40, '{\"heading\":\"Die ECE-Genehmigung\",\"text\":\"Die ECE-Genehmigung ist eine internationale Genehmigung nach den Regelungen der Wirtschaftskommission der Vereinten Nationen f\\u00fcr Europa. Eine Felge mit ECE-Genehmigung tr\\u00e4gt ein eingepr\\u00e4gtes Pr\\u00fcfzeichen. Auch hier geh\\u00f6rt ein Dokument dazu, das die Fahrzeuge und Gr\\u00f6\\u00dfen nennt, f\\u00fcr die die Genehmigung gilt.\\n\\nF\\u00fcr dich ist wichtig: Die ECE-Genehmigung wird in Deutschland anerkannt, sie gilt aber nur f\\u00fcr die Fahrzeuge und Gr\\u00f6\\u00dfen, die im zugeh\\u00f6rigen Dokument stehen. Ob eine Eintragung n\\u00f6tig ist, h\\u00e4ngt wie bei der ABE von den Angaben und den Auflagen im Dokument ab. Was dort steht, gilt.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (21, 10, 'prose', 50, '{\"heading\":\"Auflagen und Eintragung\",\"text\":\"Auflagen sind Bedingungen, die das Dokument an die Freigabe kn\\u00fcpft. Im Gutachten stehen sie oft als K\\u00fcrzel; wir zeigen sie dir immer als ganzen Satz. Typische Auflagen betreffen die Reifengr\\u00f6\\u00dfe, den Abstand zur Karosserie oder Bauteile, die angepasst werden m\\u00fcssen. Manche Auflagen sind mit wenig Aufwand erf\\u00fcllt, andere bedeuten Arbeit in der Werkstatt.\\n\\nEintragung hei\\u00dft: Die \\u00c4nderung wird in die Zulassungsbescheinigung Teil I aufgenommen. Daf\\u00fcr nimmt eine Pr\\u00fcfstelle die \\u00c4nderung ab und stellt eine Bescheinigung aus, mit der du zur Zulassungsstelle gehst. Ob das bei einer Felge n\\u00f6tig ist, sagt dir das Dokument. Wir weisen dich darauf hin, bevor du die Felge in den Warenkorb legst.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (22, 10, 'prose', 60, '{\"heading\":\"Was das beim Kauf f\\u00fcr dich hei\\u00dft\",\"text\":\"Bei RIMIFY w\\u00e4hlst du zuerst dein Fahrzeug. Danach zeigen wir dir nur Felgen, f\\u00fcr die ein Dokument die Freigabe f\\u00fcr genau dieses Fahrzeug nennt. Welches Dokument das ist, siehst du bei der Felge, ebenso die Auflagen und ob eine Eintragung n\\u00f6tig ist.\\n\\nUnd wenn wir es nicht sicher wissen, sagen wir dir das. Eine Felge, f\\u00fcr die uns kein Dokument zu deinem Fahrzeug vorliegt, zeigen wir dir f\\u00fcr dieses Fahrzeug nicht an. Lieber ein Kauf weniger als eine falsche Auskunft.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (23, 11, 'guide_lead', 0, '{\"teaser\":\"Die Einpresstiefe legt fest, wie weit die Felge im Radhaus sitzt. Was der Wert bedeutet, wie du ihn liest und was das Gutachten dazu sagt.\",\"minutes\":3}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (24, 11, 'prose', 10, '{\"heading\":\"Was die Einpresstiefe ist\",\"text\":\"Die Einpresstiefe, kurz ET, ist ein Ma\\u00df in Millimetern. Sie beschreibt den Abstand zwischen der Mittelebene der Felge und ihrer Anlagefl\\u00e4che, also der Fl\\u00e4che, mit der die Felge an der Radnabe anliegt.\\n\\nLiegt die Anlagefl\\u00e4che weiter au\\u00dfen als die Felgenmitte, also n\\u00e4her an der Fahrzeugau\\u00dfenseite, ist die ET positiv. Bei Pkw ist das der Normalfall. Eine ET von 35 hei\\u00dft also: Die Anlagefl\\u00e4che liegt 35\\u202fmm au\\u00dferhalb der Felgenmitte. Bei ET 0 liegen beide genau \\u00fcbereinander. Eine negative ET, bei der die Anlagefl\\u00e4che innen liegt, kommt bei Pkw selten vor.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (25, 11, 'prose', 20, '{\"heading\":\"Wo du den Wert findest\",\"text\":\"Die ET ist auf der Felge selbst angegeben, meist eingegossen oder eingepr\\u00e4gt auf der R\\u00fcckseite oder innen an den Speichen. Die Schreibweise ist \\u201eET 35\\u201c oder kurz \\u201eET35\\u201c.\\n\\nIn der vollst\\u00e4ndigen Gr\\u00f6\\u00dfenangabe steht die ET hinter Breite und Durchmesser, zum Beispiel 8,5J \\u00d7 18 \\u00b7 ET 35. Das bedeutet: 8,5\\u202fZoll Felgenbreite (gemessen zwischen den Felgenh\\u00f6rnern), 18\\u202fZoll Durchmesser, Einpresstiefe 35\\u202fmm. Bei uns steht diese Angabe bei jeder Felge, und im Gutachten steht sie bei jeder freigegebenen Kombination.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (26, 11, 'prose', 30, '{\"heading\":\"Was eine kleinere oder gr\\u00f6\\u00dfere ET bewirkt\",\"text\":\"Je kleiner die ET, desto weiter r\\u00fcckt die Felge nach au\\u00dfen. Je gr\\u00f6\\u00dfer die ET, desto weiter sitzt sie innen im Radhaus. Ein Beispiel: Tauschst du eine Felge mit ET 45 gegen eine gleich breite Felge mit ET 35, wandert das Rad um 10\\u202fmm nach au\\u00dfen. Auf beiden Seiten zusammen wird die Spur damit um 20\\u202fmm breiter.\\n\\nNach au\\u00dfen wird der Abstand zum Kotfl\\u00fcgel kleiner. Beim Einfedern oder beim Lenken kann die Reifenflanke streifen. Nach innen wird der Platz zu Bremse, Federbein und Querlenker knapper. Beides sind keine Kleinigkeiten, und beides h\\u00e4ngt am konkreten Fahrzeug. Genau deshalb steht in jedem Gutachten, welche ET f\\u00fcr welches Fahrzeug freigegeben ist.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (27, 11, 'prose', 40, '{\"heading\":\"Breite und ET geh\\u00f6ren zusammen\",\"text\":\"Die ET allein sagt noch nicht, wo die Felge endet. Eine breitere Felge mit gleicher ET w\\u00e4chst nach beiden Seiten. Ein Zoll mehr Breite entspricht 25,4\\u202fmm. Bei gleicher ET r\\u00fcckt die Au\\u00dfenkante dann um 12,7\\u202fmm nach au\\u00dfen und die Innenkante um 12,7\\u202fmm nach innen.\\n\\nWer also von 8J auf 9J geht und die ET gleich l\\u00e4sst, hat au\\u00dfen und innen je 12,7\\u202fmm weniger Platz. Wer die ET dabei um 10\\u202fmm senkt, hat au\\u00dfen 22,7\\u202fmm weniger Platz und innen immer noch 2,7\\u202fmm weniger. Deshalb nennt das Gutachten Breite, ET und Reifengr\\u00f6\\u00dfe immer zusammen \\u2013 die Werte geh\\u00f6ren zueinander und lassen sich nicht einzeln tauschen.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (28, 11, 'prose', 50, '{\"heading\":\"Was das Gutachten dazu sagt\",\"text\":\"Mit Gutachten meinen wir hier jedes dieser Dokumente: ABE, Teiletypgenehmigung, Teilegutachten oder ECE-Genehmigung.\\n\\nEin Gutachten nennt f\\u00fcr jedes Fahrzeug, welche Felgenbreite mit welcher ET und welcher Reifengr\\u00f6\\u00dfe freigegeben ist, manchmal mit Auflagen. Eine ET, die dort nicht steht, ist f\\u00fcr dieses Fahrzeug nicht freigegeben, auch wenn sie nur wenige Millimeter abweicht. Einen Toleranzbereich, den du selbst festlegen k\\u00f6nntest, gibt es nicht.\\n\\nDas gilt auch f\\u00fcr Distanzscheiben. Sie ver\\u00e4ndern die wirksame ET, und ob sie zusammen mit einer bestimmten Felge verwendet werden d\\u00fcrfen, muss ebenfalls in einem Dokument stehen. Was das Dokument sagt, gilt \\u2013 nicht die Erfahrung mit einem \\u00e4hnlichen Fahrzeug.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (29, 11, 'prose', 60, '{\"heading\":\"Wie wir die ET bei RIMIFY pr\\u00fcfen\",\"text\":\"Du musst die ET nicht selbst ausrechnen. Sobald du dein Fahrzeug gew\\u00e4hlt hast, vergleichen wir jede Felge mit dem Gutachten: Felgenbreite, ET, zul\\u00e4ssige Reifengr\\u00f6\\u00dfen und Auflagen. Was dir angezeigt wird, steht mit genau diesen Werten im Dokument. Willst du eine bestimmte Kombination pr\\u00fcfen, kannst du das jederzeit \\u00fcber den RIMIFY-Check tun.\"}', '2026-10-04 00:00:00', '2026-10-04 00:00:00');
--@drop page_revisions
DROP TABLE IF EXISTS `page_revisions`;
--@create page_revisions
CREATE TABLE `page_revisions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `page_id` bigint(20) unsigned NOT NULL,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'title, meta_description and blocks, as published' CHECK (json_valid(`snapshot`)),
  `note` varchar(200) DEFAULT NULL,
  `author_id` bigint(20) unsigned DEFAULT NULL,
  `author_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_page_revision_page` (`page_id`,`id`),
  CONSTRAINT `page_revisions_page_id_foreign` FOREIGN KEY (`page_id`) REFERENCES `pages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop password_reset_tokens
DROP TABLE IF EXISTS `password_reset_tokens`;
--@create password_reset_tokens
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop payment_events
DROP TABLE IF EXISTS `payment_events`;
--@create payment_events
CREATE TABLE `payment_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `provider` varchar(16) NOT NULL,
  `event_id` varchar(255) NOT NULL,
  `type` varchar(80) NOT NULL,
  `livemode` tinyint(1) NOT NULL DEFAULT 0,
  `payload` longtext NOT NULL COMMENT 'the body exactly as it arrived, signature verified',
  `order_id` bigint(20) unsigned DEFAULT NULL,
  `received_at` timestamp NOT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `outcome` varchar(64) DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_event` (`provider`,`event_id`),
  KEY `payment_events_order_id_foreign` (`order_id`),
  KEY `payment_events_type_received_at_index` (`type`,`received_at`),
  CONSTRAINT `payment_events_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger payment_events trg_payment_events_no_delete
DELIMITER ;;
CREATE TRIGGER trg_payment_events_no_delete
    BEFORE DELETE ON payment_events
    FOR EACH ROW
    BEGIN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'payment_events is append-only';
    END;;
DELIMITER ;
--@trigger payment_events trg_payment_events_raw_fixed
DELIMITER ;;
CREATE TRIGGER trg_payment_events_raw_fixed
    BEFORE UPDATE ON payment_events
    FOR EACH ROW
    BEGIN
        IF NOT (NEW.payload <=> OLD.payload) OR NOT (NEW.event_id <=> OLD.event_id) OR NOT (NEW.provider <=> OLD.provider) OR NOT (NEW.type <=> OLD.type) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'payment_events keeps the event as it arrived';
        END IF;
    END;;
DELIMITER ;
--@drop payment_settings
DROP TABLE IF EXISTS `payment_settings`;
--@create payment_settings
CREATE TABLE `payment_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `mode` varchar(8) NOT NULL DEFAULT 'test',
  `publishable_key` text DEFAULT NULL,
  `secret_key` text DEFAULT NULL,
  `webhook_secret` text DEFAULT NULL,
  `publishable_last4` char(4) DEFAULT NULL,
  `secret_last4` char(4) DEFAULT NULL,
  `webhook_last4` char(4) DEFAULT NULL,
  `last_test` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'the last „Verbindung testen“: account name, country, currency, methods — or the error' CHECK (json_valid(`last_test`)),
  `tested_at` timestamp NULL DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_settings_updated_by_foreign` (`updated_by`),
  CONSTRAINT `payment_settings_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_payment_settings_mode` CHECK (`mode` in ('test','live'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop permissions
DROP TABLE IF EXISTS `permissions`;
--@create permissions
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop refunds
DROP TABLE IF EXISTS `refunds`;
--@create refunds
CREATE TABLE `refunds` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `provider` varchar(16) NOT NULL,
  `provider_refund_id` varchar(255) DEFAULT NULL,
  `amount_cents` int(10) unsigned NOT NULL,
  `currency` char(3) NOT NULL,
  `reason` varchar(500) NOT NULL,
  `status` varchar(16) NOT NULL,
  `requested_by` bigint(20) unsigned DEFAULT NULL,
  `event_id` varchar(255) DEFAULT NULL,
  `credit_note_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refunds_provider_refund_id_unique` (`provider_refund_id`),
  KEY `refunds_order_id_foreign` (`order_id`),
  KEY `refunds_requested_by_foreign` (`requested_by`),
  KEY `refunds_credit_note_id_foreign` (`credit_note_id`),
  CONSTRAINT `refunds_credit_note_id_foreign` FOREIGN KEY (`credit_note_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `refunds_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `refunds_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_refund_amount` CHECK (`amount_cents` > 0),
  CONSTRAINT `chk_refund_status` CHECK (`status` in ('pending','succeeded','failed','canceled','requires_action'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop reviews
DROP TABLE IF EXISTS `reviews`;
--@create reviews
CREATE TABLE `reviews` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `order_line_id` bigint(20) unsigned NOT NULL,
  `wheel_model_id` bigint(20) unsigned NOT NULL,
  `rating` tinyint(3) unsigned NOT NULL,
  `body` varchar(1000) DEFAULT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'written through the order''s own signed link',
  `hidden_at` timestamp NULL DEFAULT NULL,
  `hidden_reason` varchar(500) DEFAULT NULL,
  `hidden_by` bigint(20) unsigned DEFAULT NULL,
  `reply` varchar(1000) DEFAULT NULL,
  `replied_at` timestamp NULL DEFAULT NULL,
  `replied_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_order_line_id_unique` (`order_line_id`),
  KEY `reviews_order_id_foreign` (`order_id`),
  KEY `reviews_hidden_by_foreign` (`hidden_by`),
  KEY `reviews_replied_by_foreign` (`replied_by`),
  KEY `idx_reviews_model_visible` (`wheel_model_id`,`hidden_at`),
  CONSTRAINT `reviews_hidden_by_foreign` FOREIGN KEY (`hidden_by`) REFERENCES `admin_users` (`id`),
  CONSTRAINT `reviews_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `reviews_order_line_id_foreign` FOREIGN KEY (`order_line_id`) REFERENCES `order_lines` (`id`),
  CONSTRAINT `reviews_replied_by_foreign` FOREIGN KEY (`replied_by`) REFERENCES `admin_users` (`id`),
  CONSTRAINT `reviews_wheel_model_id_foreign` FOREIGN KEY (`wheel_model_id`) REFERENCES `wheel_models` (`id`),
  CONSTRAINT `chk_review_rating` CHECK (`rating` between 1 and 5),
  CONSTRAINT `chk_review_hidden_reason` CHECK (`hidden_at` is null = (`hidden_reason` is null))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop review_feedback
DROP TABLE IF EXISTS `review_feedback`;
--@create review_feedback
CREATE TABLE `review_feedback` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `admin_user_id` bigint(20) unsigned DEFAULT NULL,
  `type` varchar(16) NOT NULL COMMENT 'fehler | design | text | wunsch',
  `sentence` text NOT NULL,
  `url` varchar(500) NOT NULL,
  `screen` varchar(120) NOT NULL COMMENT 'the page as the rail names it',
  `viewport` varchar(32) NOT NULL,
  `browser` varchar(120) NOT NULL,
  `role` varchar(120) DEFAULT NULL,
  `screenshot_path` varchar(200) DEFAULT NULL COMMENT 'private disk; served only to the panel',
  `status` varchar(16) NOT NULL DEFAULT 'neu' COMMENT 'neu | angenommen | erledigt | abgelehnt',
  `answer` text DEFAULT NULL COMMENT 'our answer; the reason, when refused',
  `assignee_id` bigint(20) unsigned DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `review_feedback_admin_user_id_foreign` (`admin_user_id`),
  KEY `review_feedback_assignee_id_foreign` (`assignee_id`),
  KEY `idx_review_feedback_status` (`status`,`created_at`),
  KEY `idx_review_feedback_screen` (`screen`),
  CONSTRAINT `review_feedback_admin_user_id_foreign` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `review_feedback_assignee_id_foreign` FOREIGN KEY (`assignee_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_review_feedback_type` CHECK (`type` in ('fehler','design','text','wunsch')),
  CONSTRAINT `chk_review_feedback_status` CHECK (`status` in ('neu','angenommen','erledigt','abgelehnt'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop roles
DROP TABLE IF EXISTS `roles`;
--@create roles
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `label_de` varchar(255) DEFAULT NULL,
  `description_de` text DEFAULT NULL,
  `cloned_from_id` bigint(20) unsigned DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`),
  KEY `roles_cloned_from_id_foreign` (`cloned_from_id`),
  CONSTRAINT `roles_cloned_from_id_foreign` FOREIGN KEY (`cloned_from_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows roles
INSERT INTO `roles` (`id`, `name`, `guard_name`, `label_de`, `description_de`, `cloned_from_id`, `is_system`, `created_at`, `updated_at`) VALUES (1, 'super-admin', 'admin', 'Super-Admin', 'Inhaber', NULL, 1, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (2, 'catalogue-manager', 'admin', 'Katalog', 'Einkauf und Produktleitung', NULL, 1, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (3, 'compliance-editor', 'admin', 'Gutachten', 'Verantwortung für die Gutachten', NULL, 1, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (4, 'order-manager', 'admin', 'Bestellungen', 'Versand und Abwicklung', NULL, 1, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (5, 'content-editor', 'admin', 'Inhalte', 'Marketing', NULL, 1, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (6, 'support-agent', 'admin', 'Support', 'Kundenbetreuung', NULL, 1, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (7, 'accountant', 'admin', 'Buchhaltung', 'Buchhaltung', NULL, 1, '2026-10-04 00:00:00', '2026-10-04 00:00:00');
--@drop role_has_permissions
DROP TABLE IF EXISTS `role_has_permissions`;
--@create role_has_permissions
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop role_permissions
DROP TABLE IF EXISTS `role_permissions`;
--@create role_permissions
CREATE TABLE `role_permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint(20) unsigned NOT NULL,
  `module` varchar(32) NOT NULL,
  `action` varchar(16) NOT NULL,
  `allowed` tinyint(1) NOT NULL DEFAULT 0,
  `constraints` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`constraints`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_permission` (`role_id`,`module`,`action`),
  KEY `idx_role_permission_cell` (`module`,`action`),
  CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_role_permissions_module` CHECK (`module` in ('catalogue','vehicles','approvals','orders','customers','content','media','roles','imports','reports','settings','audit_log')),
  CONSTRAINT `chk_role_permissions_action` CHECK (`action` in ('view','create','edit','delete','publish','export'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows role_permissions
INSERT INTO `role_permissions` (`id`, `role_id`, `module`, `action`, `allowed`, `constraints`, `created_at`, `updated_at`) VALUES (1, 1, 'catalogue', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (2, 1, 'catalogue', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (3, 1, 'catalogue', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (4, 1, 'catalogue', 'delete', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (5, 1, 'catalogue', 'publish', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (6, 1, 'vehicles', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (7, 1, 'vehicles', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (8, 1, 'vehicles', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (9, 1, 'approvals', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (10, 1, 'approvals', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (11, 1, 'approvals', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (12, 1, 'approvals', 'publish', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (13, 1, 'orders', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (14, 1, 'orders', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (15, 1, 'orders', 'export', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (16, 1, 'customers', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (17, 1, 'content', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (18, 1, 'content', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (19, 1, 'content', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (20, 1, 'content', 'delete', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (21, 1, 'content', 'publish', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (22, 1, 'roles', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (23, 1, 'roles', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (24, 1, 'roles', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (25, 1, 'roles', 'delete', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (26, 1, 'imports', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (27, 1, 'imports', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (28, 1, 'reports', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (29, 1, 'reports', 'export', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (30, 1, 'settings', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (31, 1, 'settings', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (32, 1, 'audit_log', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (33, 1, 'audit_log', 'export', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (34, 2, 'catalogue', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (35, 2, 'catalogue', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (36, 2, 'catalogue', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (37, 2, 'catalogue', 'delete', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (38, 2, 'catalogue', 'publish', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (39, 2, 'vehicles', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (40, 2, 'vehicles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (41, 2, 'vehicles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (42, 2, 'approvals', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (43, 2, 'approvals', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (44, 2, 'approvals', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (45, 2, 'approvals', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (46, 2, 'orders', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (47, 2, 'orders', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (48, 2, 'orders', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (49, 2, 'customers', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (50, 2, 'content', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (51, 2, 'content', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (52, 2, 'content', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (53, 2, 'content', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (54, 2, 'content', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (55, 2, 'roles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (56, 2, 'roles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (57, 2, 'roles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (58, 2, 'roles', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (59, 2, 'imports', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (60, 2, 'imports', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (61, 2, 'reports', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (62, 2, 'reports', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (63, 2, 'settings', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (64, 2, 'settings', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (65, 2, 'audit_log', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (66, 2, 'audit_log', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (67, 3, 'catalogue', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (68, 3, 'catalogue', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (69, 3, 'catalogue', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (70, 3, 'catalogue', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (71, 3, 'catalogue', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (72, 3, 'vehicles', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (73, 3, 'vehicles', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (74, 3, 'vehicles', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (75, 3, 'approvals', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (76, 3, 'approvals', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (77, 3, 'approvals', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (78, 3, 'approvals', 'publish', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (79, 3, 'orders', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (80, 3, 'orders', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (81, 3, 'orders', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (82, 3, 'customers', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (83, 3, 'content', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (84, 3, 'content', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (85, 3, 'content', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (86, 3, 'content', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (87, 3, 'content', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (88, 3, 'roles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (89, 3, 'roles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (90, 3, 'roles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (91, 3, 'roles', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (92, 3, 'imports', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (93, 3, 'imports', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (94, 3, 'reports', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (95, 3, 'reports', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (96, 3, 'settings', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (97, 3, 'settings', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (98, 3, 'audit_log', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (99, 3, 'audit_log', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (100, 4, 'catalogue', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (101, 4, 'catalogue', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (102, 4, 'catalogue', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (103, 4, 'catalogue', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (104, 4, 'catalogue', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (105, 4, 'vehicles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (106, 4, 'vehicles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (107, 4, 'vehicles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (108, 4, 'approvals', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (109, 4, 'approvals', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (110, 4, 'approvals', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (111, 4, 'approvals', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (112, 4, 'orders', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (113, 4, 'orders', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (114, 4, 'orders', 'export', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (115, 4, 'customers', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (116, 4, 'content', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (117, 4, 'content', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (118, 4, 'content', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (119, 4, 'content', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (120, 4, 'content', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (121, 4, 'roles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (122, 4, 'roles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (123, 4, 'roles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (124, 4, 'roles', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (125, 4, 'imports', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (126, 4, 'imports', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (127, 4, 'reports', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (128, 4, 'reports', 'export', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (129, 4, 'settings', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (130, 4, 'settings', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (131, 4, 'audit_log', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (132, 4, 'audit_log', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (133, 5, 'catalogue', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (134, 5, 'catalogue', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (135, 5, 'catalogue', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (136, 5, 'catalogue', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (137, 5, 'catalogue', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (138, 5, 'vehicles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (139, 5, 'vehicles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (140, 5, 'vehicles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (141, 5, 'approvals', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (142, 5, 'approvals', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (143, 5, 'approvals', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (144, 5, 'approvals', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (145, 5, 'orders', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (146, 5, 'orders', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (147, 5, 'orders', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (148, 5, 'customers', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (149, 5, 'content', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (150, 5, 'content', 'create', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (151, 5, 'content', 'edit', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (152, 5, 'content', 'delete', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (153, 5, 'content', 'publish', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (154, 5, 'roles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (155, 5, 'roles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (156, 5, 'roles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (157, 5, 'roles', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (158, 5, 'imports', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (159, 5, 'imports', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (160, 5, 'reports', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (161, 5, 'reports', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (162, 5, 'settings', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (163, 5, 'settings', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (164, 5, 'audit_log', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (165, 5, 'audit_log', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (166, 6, 'catalogue', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (167, 6, 'catalogue', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (168, 6, 'catalogue', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (169, 6, 'catalogue', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (170, 6, 'catalogue', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (171, 6, 'vehicles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (172, 6, 'vehicles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (173, 6, 'vehicles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (174, 6, 'approvals', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (175, 6, 'approvals', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (176, 6, 'approvals', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (177, 6, 'approvals', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (178, 6, 'orders', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (179, 6, 'orders', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (180, 6, 'orders', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (181, 6, 'customers', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (182, 6, 'content', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (183, 6, 'content', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (184, 6, 'content', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (185, 6, 'content', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (186, 6, 'content', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (187, 6, 'roles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (188, 6, 'roles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (189, 6, 'roles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (190, 6, 'roles', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (191, 6, 'imports', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (192, 6, 'imports', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (193, 6, 'reports', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (194, 6, 'reports', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (195, 6, 'settings', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (196, 6, 'settings', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (197, 6, 'audit_log', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (198, 6, 'audit_log', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (199, 7, 'catalogue', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (200, 7, 'catalogue', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (201, 7, 'catalogue', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (202, 7, 'catalogue', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (203, 7, 'catalogue', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (204, 7, 'vehicles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (205, 7, 'vehicles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (206, 7, 'vehicles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (207, 7, 'approvals', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (208, 7, 'approvals', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (209, 7, 'approvals', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (210, 7, 'approvals', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (211, 7, 'orders', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (212, 7, 'orders', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (213, 7, 'orders', 'export', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (214, 7, 'customers', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (215, 7, 'content', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (216, 7, 'content', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (217, 7, 'content', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (218, 7, 'content', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (219, 7, 'content', 'publish', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (220, 7, 'roles', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (221, 7, 'roles', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (222, 7, 'roles', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (223, 7, 'roles', 'delete', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (224, 7, 'imports', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (225, 7, 'imports', 'create', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (226, 7, 'reports', 'view', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (227, 7, 'reports', 'export', 1, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (228, 7, 'settings', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (229, 7, 'settings', 'edit', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (230, 7, 'audit_log', 'view', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00'), (231, 7, 'audit_log', 'export', 0, NULL, '2026-10-04 00:00:00', '2026-10-04 00:00:00');
--@drop saved_views
DROP TABLE IF EXISTS `saved_views`;
--@create saved_views
CREATE TABLE `saved_views` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `admin_user_id` bigint(20) unsigned NOT NULL,
  `list` varchar(32) NOT NULL,
  `name` varchar(60) NOT NULL,
  `query` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`query`)),
  `stores_columns` tinyint(1) NOT NULL DEFAULT 0,
  `columns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`columns`)),
  `role_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `saved_views_admin_user_id_foreign` (`admin_user_id`),
  KEY `saved_views_role_id_foreign` (`role_id`),
  KEY `saved_views_list_admin_user_id_index` (`list`,`admin_user_id`),
  KEY `saved_views_list_role_id_index` (`list`,`role_id`),
  CONSTRAINT `saved_views_admin_user_id_foreign` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `saved_views_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop search_misses
DROP TABLE IF EXISTS `search_misses`;
--@create search_misses
CREATE TABLE `search_misses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `query` varchar(120) NOT NULL,
  `misses` int(10) unsigned NOT NULL DEFAULT 1,
  `last_missed_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `search_misses_query_unique` (`query`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop sessions
DROP TABLE IF EXISTS `sessions`;
--@create sessions
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop settings
DROP TABLE IF EXISTS `settings`;
--@create settings
CREATE TABLE `settings` (
  `key` varchar(64) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows settings
INSERT INTO `settings` (`key`, `value`, `created_at`, `updated_at`) VALUES ('release_seed_version', '10', '2026-10-04 00:00:00', '2026-10-04 00:00:00');
--@drop speed_symbol_table
DROP TABLE IF EXISTS `speed_symbol_table`;
--@create speed_symbol_table
CREATE TABLE `speed_symbol_table` (
  `symbol` varchar(3) NOT NULL,
  `speed_rank` smallint(5) unsigned NOT NULL,
  `max_kmh` smallint(5) unsigned DEFAULT NULL,
  PRIMARY KEY (`symbol`),
  UNIQUE KEY `speed_symbol_table_speed_rank_unique` (`speed_rank`),
  CONSTRAINT `chk_speed_rank` CHECK (`speed_rank` > 0),
  CONSTRAINT `chk_speed_max` CHECK (`max_kmh` is null or `max_kmh` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@rows speed_symbol_table
INSERT INTO `speed_symbol_table` (`symbol`, `speed_rank`, `max_kmh`) VALUES ('(Y)', 14, NULL), ('H', 10, 210), ('L', 1, 120), ('M', 2, 130), ('N', 3, 140), ('P', 4, 150), ('Q', 5, 160), ('R', 6, 170), ('S', 7, 180), ('T', 8, 190), ('U', 9, 200), ('V', 11, 240), ('W', 12, 270), ('Y', 13, 300);
--@drop storage_settings
DROP TABLE IF EXISTS `storage_settings`;
--@create storage_settings
CREATE TABLE `storage_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `state` varchar(8) NOT NULL,
  `provider` varchar(16) NOT NULL DEFAULT 's3',
  `region` varchar(32) NOT NULL DEFAULT 'eu-north-1',
  `bucket` varchar(63) DEFAULT NULL,
  `endpoint` varchar(255) DEFAULT NULL,
  `path_style` tinyint(1) NOT NULL DEFAULT 0,
  `public_url` varchar(255) DEFAULT NULL,
  `access_key` text DEFAULT NULL,
  `secret` text DEFAULT NULL,
  `key_last4` char(4) DEFAULT NULL,
  `secret_last4` char(4) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `last_test` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`last_test`)),
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `storage_settings_state_unique` (`state`),
  KEY `storage_settings_updated_by_foreign` (`updated_by`),
  CONSTRAINT `storage_settings_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_storage_state` CHECK (`state` in ('active','pending'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop stripe_events
DROP TABLE IF EXISTS `stripe_events`;
--@create stripe_events
CREATE TABLE `stripe_events` (
  `id` varchar(64) NOT NULL,
  `type` varchar(64) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stripe_event_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop telescope_entries
DROP TABLE IF EXISTS `telescope_entries`;
--@create telescope_entries
CREATE TABLE `telescope_entries` (
  `sequence` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `batch_id` char(36) NOT NULL,
  `family_hash` varchar(255) DEFAULT NULL,
  `should_display_on_index` tinyint(1) NOT NULL DEFAULT 1,
  `type` varchar(20) NOT NULL,
  `content` longtext NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`sequence`),
  UNIQUE KEY `telescope_entries_uuid_unique` (`uuid`),
  KEY `telescope_entries_batch_id_index` (`batch_id`),
  KEY `telescope_entries_family_hash_index` (`family_hash`),
  KEY `telescope_entries_created_at_index` (`created_at`),
  KEY `telescope_entries_type_should_display_on_index_index` (`type`,`should_display_on_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop telescope_entries_tags
DROP TABLE IF EXISTS `telescope_entries_tags`;
--@create telescope_entries_tags
CREATE TABLE `telescope_entries_tags` (
  `entry_uuid` char(36) NOT NULL,
  `tag` varchar(255) NOT NULL,
  PRIMARY KEY (`entry_uuid`,`tag`),
  KEY `telescope_entries_tags_tag_index` (`tag`),
  CONSTRAINT `telescope_entries_tags_entry_uuid_foreign` FOREIGN KEY (`entry_uuid`) REFERENCES `telescope_entries` (`uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop telescope_monitoring
DROP TABLE IF EXISTS `telescope_monitoring`;
--@create telescope_monitoring
CREATE TABLE `telescope_monitoring` (
  `tag` varchar(255) NOT NULL,
  PRIMARY KEY (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop tpms_sensor_prices
DROP TABLE IF EXISTS `tpms_sensor_prices`;
--@create tpms_sensor_prices
CREATE TABLE `tpms_sensor_prices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `make_key` varchar(64) NOT NULL,
  `make_label_de` varchar(64) NOT NULL COMMENT 'Volkswagen',
  `price_cents` int(10) unsigned NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpms_make` (`make_key`),
  UNIQUE KEY `tpms_sensor_prices_demo_ref_unique` (`demo_ref`),
  KEY `idx_tpms_active` (`active`,`make_key`),
  KEY `tpms_sensor_prices_is_demo_index` (`is_demo`),
  CONSTRAINT `chk_tpms_price` CHECK (`price_cents` > 0),
  CONSTRAINT `chk_tpms_currency` CHECK (`currency` regexp '(?-i)^[A-Z]{3}$'),
  CONSTRAINT `chk_tpms_make_key` CHECK (`make_key` regexp '(?-i)^[a-z0-9][a-z0-9-]{0,63}$'),
  CONSTRAINT `chk_tps_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger tpms_sensor_prices trg_tps_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_tps_demo_fixed
BEFORE UPDATE ON tpms_sensor_prices
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop tyre_variants
DROP TABLE IF EXISTS `tyre_variants`;
--@create tyre_variants
CREATE TABLE `tyre_variants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `brand_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `season` varchar(16) NOT NULL COMMENT 'sommer | winter | ganzjahres',
  `width_mm` smallint(5) unsigned NOT NULL COMMENT '245',
  `aspect` smallint(5) unsigned NOT NULL COMMENT '45',
  `diameter_in` decimal(4,1) NOT NULL COMMENT '18.0',
  `load_index` smallint(5) unsigned NOT NULL,
  `speed_symbol` varchar(3) NOT NULL COMMENT 'display only',
  `speed_rank` smallint(5) unsigned NOT NULL,
  `eu_fuel_class` char(1) DEFAULT NULL,
  `eu_wet_grip_class` char(1) DEFAULT NULL,
  `eu_noise_db` smallint(5) unsigned DEFAULT NULL,
  `eu_noise_class` char(1) DEFAULT NULL COMMENT 'A | B | C',
  `eu_snow_grip` tinyint(1) DEFAULT NULL COMMENT 'EU label: snow grip pictogram (3PMSF); NULL = not on record',
  `eu_ice_grip` tinyint(1) DEFAULT NULL COMMENT 'EU label: ice grip pictogram; NULL = not on record',
  `eprel_id` varchar(32) DEFAULT NULL COMMENT 'EU product database entry',
  `price_cents` int(10) unsigned NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `stock_qty` int(10) unsigned NOT NULL DEFAULT 0,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'seeded demo row, never real stock',
  `available` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'verfügbar / nicht verfügbar (D-301); stock_qty is kept and no longer read',
  `demo_ref` varchar(48) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tyre_variants_demo_ref_unique` (`demo_ref`),
  KEY `tyre_variants_brand_id_foreign` (`brand_id`),
  KEY `idx_tyre_lookup` (`width_mm`,`aspect`,`diameter_in`,`load_index`,`speed_rank`),
  KEY `idx_tyre_season` (`season`,`stock_qty`),
  CONSTRAINT `tyre_variants_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `chk_tyre_width` CHECK (`width_mm` > 0),
  CONSTRAINT `chk_tyre_aspect` CHECK (`aspect` > 0),
  CONSTRAINT `chk_tyre_load_index` CHECK (`load_index` > 0),
  CONSTRAINT `chk_tyre_speed_rank` CHECK (`speed_rank` > 0),
  CONSTRAINT `chk_tyre_variants_season` CHECK (`season` in ('sommer','winter','ganzjahres')),
  CONSTRAINT `chk_tyre_variants_eu_fuel_class` CHECK (`eu_fuel_class` in ('A','B','C','D','E')),
  CONSTRAINT `chk_tyre_variants_eu_wet_grip_class` CHECK (`eu_wet_grip_class` in ('A','B','C','D','E')),
  CONSTRAINT `chk_tyre_variants_eu_noise_class` CHECK (`eu_noise_class` in ('A','B','C'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop users
DROP TABLE IF EXISTS `users`;
--@create users
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop vehicles
DROP TABLE IF EXISTS `vehicles`;
--@create vehicles
CREATE TABLE `vehicles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `source_vehicle_id` int(10) unsigned DEFAULT NULL COMMENT 'fahrzeug_id from the export; NULL for a car typed from a Gutachten or by hand',
  `source` varchar(48) NOT NULL DEFAULT 'entwicklung',
  `source_document_id` bigint(20) unsigned DEFAULT NULL,
  `source_page` smallint(5) unsigned DEFAULT NULL,
  `hsn` varchar(4) DEFAULT NULL,
  `tsn` varchar(3) DEFAULT NULL,
  `vsn` varchar(16) DEFAULT NULL COMMENT 'the third key — separates identical HSN/TSN pairs',
  `make` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  `variant` varchar(255) NOT NULL,
  `type_designation` varchar(255) DEFAULT NULL COMMENT 'B9 — how a Gutachten names it',
  `eg_nummer_raw` varchar(255) DEFAULT NULL,
  `eg_nummer_norm` varchar(64) DEFAULT NULL,
  `body_form` varchar(32) DEFAULT NULL COMMENT 'Kombi | Limousine | Cabrio | Coupe | Schrägheck',
  `drive_axle` varchar(16) DEFAULT NULL COMMENT 'matters for mixed fitment',
  `build_from` date DEFAULT NULL,
  `build_to` date DEFAULT NULL,
  `axle_load_front_kg` int(10) unsigned DEFAULT NULL,
  `axle_load_rear_kg` int(10) unsigned DEFAULT NULL,
  `max_speed_kmh` int(10) unsigned DEFAULT NULL,
  `power_kw` int(10) unsigned DEFAULT NULL,
  `power_ps` int(10) unsigned DEFAULT NULL,
  `displacement_ccm` int(10) unsigned DEFAULT NULL,
  `doors` tinyint(3) unsigned DEFAULT NULL,
  `seats` tinyint(3) unsigned DEFAULT NULL,
  `needs_review` tinyint(1) NOT NULL DEFAULT 0,
  `raw` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`raw`)),
  `imported_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicles_demo_ref_unique` (`demo_ref`),
  UNIQUE KEY `uq_vehicle_source_number` (`source`,`source_vehicle_id`),
  KEY `idx_vehicle_keys` (`hsn`,`tsn`,`deleted_at`),
  KEY `idx_vehicle_tree` (`make`,`model`,`variant`,`deleted_at`),
  KEY `idx_vehicle_window` (`build_from`,`build_to`),
  KEY `idx_vehicle_eg` (`eg_nummer_norm`),
  KEY `idx_vehicle_needs_review` (`needs_review`),
  KEY `vehicles_source_index` (`source`),
  KEY `vehicles_is_demo_index` (`is_demo`),
  KEY `vehicles_source_document_id_foreign` (`source_document_id`),
  CONSTRAINT `vehicles_source_document_id_foreign` FOREIGN KEY (`source_document_id`) REFERENCES `approval_documents` (`id`),
  CONSTRAINT `chk_vehicles_hsn` CHECK (`hsn` regexp '(?-i)^[0-9A-Z]{4}$'),
  CONSTRAINT `chk_vehicles_tsn` CHECK (`tsn` regexp '(?-i)^[0-9A-Z]{1,3}$'),
  CONSTRAINT `chk_vehicles_axle_front` CHECK (`axle_load_front_kg` is null or `axle_load_front_kg` > 0),
  CONSTRAINT `chk_vehicles_axle_rear` CHECK (`axle_load_rear_kg` is null or `axle_load_rear_kg` > 0),
  CONSTRAINT `chk_vehicles_max_speed` CHECK (`max_speed_kmh` is null or `max_speed_kmh` > 0),
  CONSTRAINT `chk_vehicles_build_window` CHECK (`build_from` is null or `build_to` is null or `build_from` <= `build_to`),
  CONSTRAINT `chk_veh_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null),
  CONSTRAINT `chk_vehicles_source` CHECK (`source` in ('import_kba','import_tecdoc','import_dat','gutachten','manuell_geprueft','entwicklung')),
  CONSTRAINT `chk_veh_source_document` CHECK (`source` <> 'gutachten' or `source_document_id` is not null),
  CONSTRAINT `chk_veh_keys_paired` CHECK (`hsn` is null = (`tsn` is null)),
  CONSTRAINT `chk_veh_keys_from_source` CHECK (`hsn` is not null or `source` in ('gutachten','manuell_geprueft')),
  CONSTRAINT `chk_veh_export_id_from_source` CHECK (`source_vehicle_id` is not null or `source` in ('gutachten','manuell_geprueft'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger vehicles trg_veh_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_veh_demo_fixed
BEFORE UPDATE ON vehicles
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop vehicle_imports
DROP TABLE IF EXISTS `vehicle_imports`;
--@create vehicle_imports
CREATE TABLE `vehicle_imports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `admin_user_id` bigint(20) unsigned DEFAULT NULL,
  `file_name` varchar(200) NOT NULL,
  `file_format` varchar(8) NOT NULL COMMENT 'csv | xlsx',
  `file_sha256` char(64) NOT NULL,
  `source` varchar(24) NOT NULL COMMENT 'import_kba | import_tecdoc | import_dat: what every car it creates is stamped with',
  `status` varchar(16) NOT NULL DEFAULT 'previewed' COMMENT 'previewed | applied',
  `file` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'the headers and the cells as read' CHECK (json_valid(`file`)),
  `mapping` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'field => column header' CHECK (json_valid(`mapping`)),
  `rows` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'the rows after mapping, the contract fields as typed' CHECK (json_valid(`rows`)),
  `plan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'per row: create | update | unchanged | merge | kept | refused, and why' CHECK (json_valid(`plan`)),
  `summary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'counts per outcome' CHECK (json_valid(`summary`)),
  `applied_at` timestamp NULL DEFAULT NULL,
  `applied_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicle_imports_admin_user_id_foreign` (`admin_user_id`),
  KEY `vehicle_imports_applied_by_foreign` (`applied_by`),
  KEY `idx_vehicle_import_status` (`status`,`created_at`),
  CONSTRAINT `vehicle_imports_admin_user_id_foreign` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vehicle_imports_applied_by_foreign` FOREIGN KEY (`applied_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop verdict_tallies
DROP TABLE IF EXISTS `verdict_tallies`;
--@create verdict_tallies
CREATE TABLE `verdict_tallies` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `day` date NOT NULL,
  `surface` varchar(16) NOT NULL,
  `status` varchar(16) NOT NULL,
  `n` int(10) unsigned NOT NULL DEFAULT 0,
  `is_demo` tinyint(1) NOT NULL DEFAULT 0,
  `demo_ref` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_verdict_tally` (`day`,`surface`,`status`),
  UNIQUE KEY `verdict_tallies_demo_ref_unique` (`demo_ref`),
  KEY `verdict_tallies_is_demo_index` (`is_demo`),
  CONSTRAINT `chk_verdict_tallies_status` CHECK (`status` in ('PERMITTED','CONDITIONAL','NOT_PERMITTED','UNKNOWN')),
  CONSTRAINT `chk_vt_demo` CHECK (`is_demo` = 0 and `demo_ref` is null or `is_demo` = 1 and `demo_ref` is not null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@trigger verdict_tallies trg_vt_demo_fixed
DELIMITER ;;
CREATE TRIGGER trg_vt_demo_fixed
BEFORE UPDATE ON verdict_tallies
FOR EACH ROW
BEGIN
    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
    END IF;
END;;
DELIMITER ;
--@drop wheel_configs
DROP TABLE IF EXISTS `wheel_configs`;
--@create wheel_configs
CREATE TABLE `wheel_configs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `wheel_model_id` bigint(20) unsigned NOT NULL,
  `wheel_finish_id` bigint(20) unsigned NOT NULL,
  `diameter_in` decimal(4,1) NOT NULL COMMENT '18.0',
  `width_in` decimal(4,2) NOT NULL COMMENT '8.50 — rendered 8,5J',
  `et_mm` smallint(6) NOT NULL COMMENT 'Einpresstiefe — can be negative',
  `bolt_holes` tinyint(3) unsigned NOT NULL,
  `bolt_circle_mm` decimal(5,1) NOT NULL COMMENT 'Lochkreis — 112.0',
  `centre_bore_mm` decimal(5,2) NOT NULL COMMENT 'Mittenlochbohrung — 66.60',
  `hump` varchar(16) DEFAULT NULL,
  `bead_profile` varchar(16) DEFAULT NULL,
  `kba_number` varchar(32) DEFAULT NULL,
  `ean` varchar(14) DEFAULT NULL,
  `sku` varchar(255) NOT NULL,
  `price_cents` int(10) unsigned NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `stock_qty` int(10) unsigned NOT NULL DEFAULT 0,
  `available` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'verfügbar / nicht verfügbar (D-299); stock_qty is kept and no longer read',
  `weight_g` int(10) unsigned DEFAULT NULL,
  `max_load_kg` smallint(5) unsigned DEFAULT NULL COMMENT 'Radlast from the wheel''s approval; NULL = not verified, not shown',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wheel_config` (`wheel_model_id`,`wheel_finish_id`,`diameter_in`,`width_in`,`et_mm`,`bolt_circle_mm`),
  UNIQUE KEY `wheel_configs_sku_unique` (`sku`),
  KEY `wheel_configs_wheel_finish_id_foreign` (`wheel_finish_id`),
  KEY `idx_config_lookup` (`wheel_model_id`,`wheel_finish_id`,`diameter_in`,`width_in`,`et_mm`),
  KEY `idx_config_size` (`diameter_in`,`width_in`,`et_mm`),
  CONSTRAINT `wheel_configs_wheel_finish_id_foreign` FOREIGN KEY (`wheel_finish_id`) REFERENCES `wheel_finishes` (`id`),
  CONSTRAINT `wheel_configs_wheel_model_id_foreign` FOREIGN KEY (`wheel_model_id`) REFERENCES `wheel_models` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_wheel_configs_diameter` CHECK (`diameter_in` > 0),
  CONSTRAINT `chk_wheel_configs_width` CHECK (`width_in` > 0),
  CONSTRAINT `chk_wheel_configs_bolts` CHECK (`bolt_holes` > 0),
  CONSTRAINT `chk_wheel_configs_bore` CHECK (`centre_bore_mm` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop wheel_finishes
DROP TABLE IF EXISTS `wheel_finishes`;
--@create wheel_finishes
CREATE TABLE `wheel_finishes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `wheel_model_id` bigint(20) unsigned NOT NULL,
  `name_de` varchar(255) NOT NULL COMMENT 'Graphite matt',
  `name_en` varchar(255) DEFAULT NULL,
  `hex` varchar(7) DEFAULT NULL,
  `art_finish` varchar(16) NOT NULL DEFAULT 'graphite',
  `image_manifest` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Picture manifest of the cut-out; NULL = no photograph' CHECK (json_valid(`image_manifest`)),
  `image_alt_de` varchar(200) DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_finish_model_name` (`wheel_model_id`,`name_de`),
  CONSTRAINT `wheel_finishes_wheel_model_id_foreign` FOREIGN KEY (`wheel_model_id`) REFERENCES `wheel_models` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_wheel_finishes_art_finish` CHECK (`art_finish` in ('graphite','silver','black','bronze','polished'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop wheel_finish_images
DROP TABLE IF EXISTS `wheel_finish_images`;
--@create wheel_finish_images
CREATE TABLE `wheel_finish_images` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `wheel_finish_id` bigint(20) unsigned NOT NULL,
  `position` smallint(5) unsigned NOT NULL,
  `manifest` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`manifest`)),
  `alt_de` varchar(200) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wheel_finish_images_wheel_finish_id_position_index` (`wheel_finish_id`,`position`),
  CONSTRAINT `wheel_finish_images_wheel_finish_id_foreign` FOREIGN KEY (`wheel_finish_id`) REFERENCES `wheel_finishes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@drop wheel_models
DROP TABLE IF EXISTS `wheel_models`;
--@create wheel_models
CREATE TABLE `wheel_models` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `brand_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Havanna',
  `type_designation` varchar(255) DEFAULT NULL COMMENT 'as printed on the Gutachten',
  `title` varchar(160) DEFAULT NULL COMMENT 'the name in the shop as typed; NULL = brand + model + Radtypenbezeichnung (WheelTitle)',
  `spoke_count` tinyint(3) unsigned NOT NULL DEFAULT 5,
  `rating` decimal(2,1) DEFAULT NULL,
  `rating_count` int(10) unsigned NOT NULL DEFAULT 0,
  `stated_rating` decimal(2,1) DEFAULT NULL COMMENT 'stars typed in the admin (#19, D-344); never the buyers'' rating, never in the structured data',
  `stated_rating_count` int(10) unsigned DEFAULT NULL COMMENT 'the number of reviews behind stated_rating, as typed',
  `slug` varchar(255) NOT NULL,
  `description_de` text DEFAULT NULL,
  `seo_title` varchar(70) DEFAULT NULL,
  `seo_description` varchar(170) DEFAULT NULL,
  `internal_note` varchar(500) DEFAULT NULL COMMENT 'admin only, never shown in the shop',
  `status` varchar(16) NOT NULL DEFAULT 'draft',
  `is_demo` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'seeded demo row, never real stock',
  `demo_ref` varchar(48) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wheel_models_slug_unique` (`slug`),
  UNIQUE KEY `wheel_models_demo_ref_unique` (`demo_ref`),
  KEY `wheel_models_brand_id_foreign` (`brand_id`),
  KEY `idx_wheel_model_status` (`status`,`brand_id`),
  FULLTEXT KEY `ft_wheel` (`name`,`type_designation`),
  CONSTRAINT `wheel_models_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `chk_wheel_models_status` CHECK (`status` in ('draft','published','archived')),
  CONSTRAINT `chk_wheel_model_rating` CHECK (`rating` is null or `rating` >= 1.0 and `rating` <= 5.0),
  CONSTRAINT `chk_wheel_model_spokes` CHECK (`spoke_count` in (5,6,7,10,20)),
  CONSTRAINT `wheel_models_demo_never_published` CHECK (`is_demo` = 0 or `status` <> 'published' or coalesce(`demo_ref`,'') like 'abnahme:%'),
  CONSTRAINT `chk_wheel_model_stated_rating` CHECK (`stated_rating` is null and `stated_rating_count` is null or `stated_rating` is not null and `stated_rating_count` is not null and `stated_rating` >= 1.0 and `stated_rating` <= 5.0 and `stated_rating_count` >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
--@footer
SET FOREIGN_KEY_CHECKS = 1;
--@end {"tables":{"addresses":{"rows":0,"auto_increment":null,"triggers":1},"admin_invitations":{"rows":0,"auto_increment":null,"triggers":0},"admin_users":{"rows":3,"auto_increment":null,"triggers":1},"approval_documents":{"rows":0,"auto_increment":null,"triggers":2},"audit_logs":{"rows":0,"auto_increment":null,"triggers":2},"balance_weight_colours":{"rows":0,"auto_increment":null,"triggers":1},"brands":{"rows":0,"auto_increment":null,"triggers":1},"cache":{"rows":0,"auto_increment":null,"triggers":0},"cache_locks":{"rows":0,"auto_increment":null,"triggers":0},"catalogue_gap_events":{"rows":0,"auto_increment":null,"triggers":1},"catalogue_imports":{"rows":0,"auto_increment":null,"triggers":0},"check_results":{"rows":0,"auto_increment":null,"triggers":1},"contact_messages":{"rows":0,"auto_increment":null,"triggers":0},"customers":{"rows":0,"auto_increment":null,"triggers":1},"customer_accounts":{"rows":0,"auto_increment":null,"triggers":0},"demand_marks":{"rows":0,"auto_increment":null,"triggers":0},"disputes":{"rows":0,"auto_increment":null,"triggers":0},"document_conditions":{"rows":0,"auto_increment":null,"triggers":0},"document_condition_reworks":{"rows":0,"auto_increment":null,"triggers":0},"document_fasteners":{"rows":0,"auto_increment":null,"triggers":0},"document_notices":{"rows":0,"auto_increment":null,"triggers":0},"document_speed_deratings":{"rows":0,"auto_increment":null,"triggers":0},"document_tyre_combinations":{"rows":0,"auto_increment":null,"triggers":0},"failed_jobs":{"rows":0,"auto_increment":null,"triggers":0},"faq_entries":{"rows":8,"auto_increment":null,"triggers":0},"fitments":{"rows":0,"auto_increment":null,"triggers":0},"fitment_conditions":{"rows":0,"auto_increment":null,"triggers":0},"fitment_conflicts":{"rows":0,"auto_increment":null,"triggers":0},"fitment_subscriptions":{"rows":0,"auto_increment":null,"triggers":0},"fitment_tyre_sizes":{"rows":0,"auto_increment":null,"triggers":0},"fitment_tyre_size_conditions":{"rows":0,"auto_increment":null,"triggers":0},"invoices":{"rows":0,"auto_increment":null,"triggers":3},"invoice_sequences":{"rows":0,"auto_increment":null,"triggers":3},"jobs":{"rows":0,"auto_increment":null,"triggers":0},"job_batches":{"rows":0,"auto_increment":null,"triggers":0},"load_index_table":{"rows":51,"auto_increment":null,"triggers":0},"mail_settings":{"rows":0,"auto_increment":null,"triggers":0},"mail_suppressions":{"rows":0,"auto_increment":null,"triggers":0},"media":{"rows":0,"auto_increment":null,"triggers":0},"migrations":{"rows":100,"auto_increment":null,"triggers":0},"model_has_permissions":{"rows":0,"auto_increment":null,"triggers":0},"model_has_roles":{"rows":3,"auto_increment":null,"triggers":0},"nav_items":{"rows":21,"auto_increment":null,"triggers":0},"notifications":{"rows":0,"auto_increment":null,"triggers":0},"orders":{"rows":0,"auto_increment":null,"triggers":2},"order_lines":{"rows":0,"auto_increment":null,"triggers":1},"order_line_fitments":{"rows":0,"auto_increment":null,"triggers":2},"pages":{"rows":11,"auto_increment":null,"triggers":0},"page_blocks":{"rows":29,"auto_increment":null,"triggers":0},"page_revisions":{"rows":0,"auto_increment":null,"triggers":0},"password_reset_tokens":{"rows":0,"auto_increment":null,"triggers":0},"payment_events":{"rows":0,"auto_increment":null,"triggers":2},"payment_settings":{"rows":0,"auto_increment":null,"triggers":0},"permissions":{"rows":0,"auto_increment":null,"triggers":0},"refunds":{"rows":0,"auto_increment":null,"triggers":0},"reviews":{"rows":0,"auto_increment":null,"triggers":0},"review_feedback":{"rows":0,"auto_increment":null,"triggers":0},"roles":{"rows":7,"auto_increment":null,"triggers":0},"role_has_permissions":{"rows":0,"auto_increment":null,"triggers":0},"role_permissions":{"rows":231,"auto_increment":null,"triggers":0},"saved_views":{"rows":0,"auto_increment":null,"triggers":0},"search_misses":{"rows":0,"auto_increment":null,"triggers":0},"sessions":{"rows":0,"auto_increment":null,"triggers":0},"settings":{"rows":1,"auto_increment":null,"triggers":0},"speed_symbol_table":{"rows":14,"auto_increment":null,"triggers":0},"storage_settings":{"rows":0,"auto_increment":null,"triggers":0},"stripe_events":{"rows":0,"auto_increment":null,"triggers":0},"telescope_entries":{"rows":0,"auto_increment":null,"triggers":0},"telescope_entries_tags":{"rows":0,"auto_increment":null,"triggers":0},"telescope_monitoring":{"rows":0,"auto_increment":null,"triggers":0},"tpms_sensor_prices":{"rows":0,"auto_increment":null,"triggers":1},"tyre_variants":{"rows":0,"auto_increment":null,"triggers":0},"users":{"rows":0,"auto_increment":null,"triggers":0},"vehicles":{"rows":0,"auto_increment":null,"triggers":1},"vehicle_imports":{"rows":0,"auto_increment":null,"triggers":0},"verdict_tallies":{"rows":0,"auto_increment":null,"triggers":1},"wheel_configs":{"rows":0,"auto_increment":null,"triggers":0},"wheel_finishes":{"rows":0,"auto_increment":null,"triggers":0},"wheel_finish_images":{"rows":0,"auto_increment":null,"triggers":0},"wheel_models":{"rows":0,"auto_increment":null,"triggers":0}},"triggers":27}
