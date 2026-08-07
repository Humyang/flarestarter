ALTER TABLE `render_job` ADD `agent_claim_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `render_job_agent_claim_token_uidx` ON `render_job` (`agent_claim_token`);