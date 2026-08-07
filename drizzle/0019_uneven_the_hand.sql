CREATE TABLE `render_asset` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`object_key` text NOT NULL,
	`source_token` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `render_asset_object_key_unique` ON `render_asset` (`object_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `render_asset_source_token_unique` ON `render_asset` (`source_token`);--> statement-breakpoint
CREATE INDEX `render_asset_user_id_idx` ON `render_asset` (`user_id`);--> statement-breakpoint
CREATE TABLE `render_job` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`renderer_task_id` text,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`phase` text,
	`output_key` text,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `render_asset`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `render_job_user_id_idx` ON `render_job` (`user_id`);--> statement-breakpoint
CREATE INDEX `render_job_asset_id_idx` ON `render_job` (`asset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `render_job_renderer_task_id_uidx` ON `render_job` (`renderer_task_id`);