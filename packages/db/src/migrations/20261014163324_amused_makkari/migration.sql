CREATE TABLE `recovery_code` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_recovery_code_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `user` ADD `totp_secret` text;--> statement-breakpoint
ALTER TABLE `user` ADD `totp_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `recovery_code_userId_idx` ON `recovery_code` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_value_idx` ON `verification` (`value`);--> statement-breakpoint
UPDATE `user` SET `email_verified` = 1;