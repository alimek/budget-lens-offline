PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_exchange_rates` (
	`currency` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`mid` text NOT NULL,
	`effective_date` text NOT NULL,
	`fetched_at` integer NOT NULL,
	CONSTRAINT "exchange_rates_currency_chk" CHECK("currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "exchange_rates_source_chk" CHECK("source" IN ('nbp', 'manual')),
	CONSTRAINT "exchange_rates_date_chk" CHECK("effective_date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
INSERT INTO `__new_exchange_rates`("currency", "source", "mid", "effective_date", "fetched_at") SELECT "currency", "source", "mid", "effective_date", "fetched_at" FROM `exchange_rates`;--> statement-breakpoint
DROP TABLE `exchange_rates`;--> statement-breakpoint
ALTER TABLE `__new_exchange_rates` RENAME TO `exchange_rates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;