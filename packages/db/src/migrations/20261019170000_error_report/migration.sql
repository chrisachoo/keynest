CREATE TABLE `error_report` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
