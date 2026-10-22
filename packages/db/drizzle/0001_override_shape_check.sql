PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_occurrence_overrides` (
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
	CONSTRAINT "overrides_skipped_chk" CHECK("skipped" IN (0, 1)),
	CONSTRAINT "overrides_shape_chk" CHECK(("amount_minor" IS NULL AND "skipped" = 1) OR ("amount_minor" IS NOT NULL AND "skipped" = 0))
);
--> statement-breakpoint
INSERT INTO `__new_occurrence_overrides`("id", "item_id", "month", "amount_minor", "skipped", "note", "created_at", "updated_at") SELECT "id", "item_id", "month", "amount_minor", "skipped", "note", "created_at", "updated_at" FROM `occurrence_overrides`;--> statement-breakpoint
DROP TABLE `occurrence_overrides`;--> statement-breakpoint
ALTER TABLE `__new_occurrence_overrides` RENAME TO `occurrence_overrides`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `overrides_item_month_uq` ON `occurrence_overrides` (`item_id`,`month`);--> statement-breakpoint
CREATE INDEX `overrides_month_idx` ON `occurrence_overrides` (`month`);