CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `closed_occurrences` (
	`month` text NOT NULL,
	`item_id` text NOT NULL,
	`kind` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`rate_mid` text,
	`rate_source` text,
	`rate_effective_date` text,
	`base_amount_minor` integer NOT NULL,
	`settled` integer NOT NULL,
	PRIMARY KEY(`month`, `item_id`),
	FOREIGN KEY (`month`) REFERENCES `months`(`month`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "closed_occurrences_kind_chk" CHECK("kind" IN ('expense', 'income')),
	CONSTRAINT "closed_occurrences_currency_chk" CHECK("currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "closed_occurrences_amount_chk" CHECK("amount_minor" >= 0 AND "base_amount_minor" >= 0),
	CONSTRAINT "closed_occurrences_rate_chk" CHECK(("rate_mid" IS NULL AND "rate_source" IS NULL AND "rate_effective_date" IS NULL) OR ("rate_mid" IS NOT NULL AND "rate_source" IN ('nbp', 'manual') AND "rate_effective_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
	CONSTRAINT "closed_occurrences_settled_chk" CHECK("settled" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `closed_occurrences_item_idx` ON `closed_occurrences` (`item_id`);--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`currency` text NOT NULL,
	`source` text NOT NULL,
	`mid` text NOT NULL,
	`effective_date` text NOT NULL,
	`fetched_at` integer NOT NULL,
	PRIMARY KEY(`currency`, `source`),
	CONSTRAINT "exchange_rates_currency_chk" CHECK("currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "exchange_rates_source_chk" CHECK("source" IN ('nbp', 'manual')),
	CONSTRAINT "exchange_rates_date_chk" CHECK("effective_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE TABLE `item_rule_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`effective_from` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`interval_months` integer,
	`anchor_month` text,
	`target_month` text,
	`day_of_month` integer,
	`end_month` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "rule_versions_shape_chk" CHECK(("interval_months" IS NULL AND "target_month" IS NOT NULL) OR ("interval_months" >= 1 AND "anchor_month" IS NOT NULL AND "target_month" IS NULL)),
	CONSTRAINT "rule_versions_amount_chk" CHECK("amount_minor" >= 0),
	CONSTRAINT "rule_versions_day_chk" CHECK("day_of_month" IS NULL OR "day_of_month" BETWEEN 1 AND 31),
	CONSTRAINT "rule_versions_months_chk" CHECK("effective_from" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]' AND substr("effective_from", 6, 2) BETWEEN '01' AND '12' AND ("anchor_month" IS NULL OR "anchor_month" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]' AND substr("anchor_month", 6, 2) BETWEEN '01' AND '12') AND ("target_month" IS NULL OR "target_month" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]' AND substr("target_month", 6, 2) BETWEEN '01' AND '12') AND ("end_month" IS NULL OR "end_month" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]' AND substr("end_month", 6, 2) BETWEEN '01' AND '12'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rule_versions_item_from_uq` ON `item_rule_versions` (`item_id`,`effective_from`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`currency` text NOT NULL,
	`note` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "items_kind_chk" CHECK("kind" IN ('expense', 'income')),
	CONSTRAINT "items_currency_chk" CHECK("currency" GLOB '[A-Z][A-Z][A-Z]')
);
--> statement-breakpoint
CREATE INDEX `items_kind_archived_idx` ON `items` (`kind`,`archived_at`);--> statement-breakpoint
CREATE TABLE `months` (
	`month` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`opening_balance_minor` integer NOT NULL,
	`closing_balance_minor` integer NOT NULL,
	`total_income_minor` integer NOT NULL,
	`total_expenses_minor` integer NOT NULL,
	`net_change_minor` integer NOT NULL,
	`base_currency` text,
	`closed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "months_month_chk" CHECK("month" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]' AND substr("month", 6, 2) BETWEEN '01' AND '12'),
	CONSTRAINT "months_status_chk" CHECK("status" IN ('active', 'closed')),
	CONSTRAINT "months_closed_chk" CHECK(("status" = 'active' AND "closed_at" IS NULL AND "base_currency" IS NULL) OR ("status" = 'closed' AND "closed_at" IS NOT NULL AND "base_currency" IS NOT NULL AND "base_currency" GLOB '[A-Z][A-Z][A-Z]'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `months_single_active_uq` ON `months` (`status`) WHERE "status" = 'active';--> statement-breakpoint
CREATE TABLE `occurrence_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`month` text NOT NULL,
	`amount_minor` integer,
	`skipped` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "overrides_month_chk" CHECK("month" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]' AND substr("month", 6, 2) BETWEEN '01' AND '12'),
	CONSTRAINT "overrides_amount_chk" CHECK("amount_minor" IS NULL OR "amount_minor" >= 0),
	CONSTRAINT "overrides_skipped_chk" CHECK("skipped" IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `overrides_item_month_uq` ON `occurrence_overrides` (`item_id`,`month`);--> statement-breakpoint
CREATE INDEX `overrides_month_idx` ON `occurrence_overrides` (`month`);--> statement-breakpoint
CREATE TABLE `payment_statuses` (
	`item_id` text NOT NULL,
	`month` text NOT NULL,
	`settled_at` integer NOT NULL,
	PRIMARY KEY(`item_id`, `month`),
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "payment_month_chk" CHECK("month" GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]' AND substr("month", 6, 2) BETWEEN '01' AND '12')
);
--> statement-breakpoint
CREATE INDEX `payment_month_idx` ON `payment_statuses` (`month`);--> statement-breakpoint
CREATE TABLE `savings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`note` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "savings_currency_chk" CHECK("currency" GLOB '[A-Z][A-Z][A-Z]')
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`language` text NOT NULL,
	`base_currency` text NOT NULL,
	`tracked_currencies` text NOT NULL,
	`low_balance_threshold_minor` integer NOT NULL,
	`large_expense_threshold_minor` integer NOT NULL,
	`forecast_horizon_months` integer NOT NULL,
	`rate_max_age_business_days` integer NOT NULL,
	`onboarding_completed_at` integer,
	`updated_at` integer NOT NULL,
	CONSTRAINT "settings_singleton_chk" CHECK("id" = 1),
	CONSTRAINT "settings_base_currency_chk" CHECK("base_currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "settings_thresholds_chk" CHECK("low_balance_threshold_minor" >= 0 AND "large_expense_threshold_minor" >= 0),
	CONSTRAINT "settings_positive_chk" CHECK("forecast_horizon_months" >= 1 AND "rate_max_age_business_days" >= 1)
);
