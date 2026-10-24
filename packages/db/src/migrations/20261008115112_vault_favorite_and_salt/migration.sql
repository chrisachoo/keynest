ALTER TABLE `user` ADD `vault_salt` text;--> statement-breakpoint
ALTER TABLE `vault_item` ADD `favorite` integer DEFAULT false NOT NULL;