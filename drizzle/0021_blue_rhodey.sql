ALTER TABLE `render_job` ADD `agent_claim_expires_at` integer;--> statement-breakpoint
ALTER TABLE `render_job` ADD `agent_attempt_count` integer DEFAULT 0 NOT NULL;