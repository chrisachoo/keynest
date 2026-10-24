ALTER TABLE `user` ADD `kdf_memory` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `kdf_iterations` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `kdf_parallelism` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `wrapped_key` text;--> statement-breakpoint
ALTER TABLE `user` ADD `wrapped_key_nonce` text;--> statement-breakpoint
ALTER TABLE `user` ADD `key_check` text;--> statement-breakpoint
ALTER TABLE `user` ADD `key_check_nonce` text;--> statement-breakpoint
ALTER TABLE `user` ADD `recovery_wrapped_key` text;--> statement-breakpoint
ALTER TABLE `user` ADD `recovery_wrapped_key_nonce` text;--> statement-breakpoint
ALTER TABLE `user` ADD `recovery_salt` text;--> statement-breakpoint
ALTER TABLE `user` ADD `recovery_verifier` text;