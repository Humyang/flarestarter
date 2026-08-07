CREATE TABLE `refunded_purchase` (
	`payment_intent_id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`refund_event_id` text NOT NULL,
	`refunded_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refunded_purchase_refund_event_id_unique` ON `refunded_purchase` (`refund_event_id`);--> statement-breakpoint
CREATE INDEX `refunded_purchase_customer_id_idx` ON `refunded_purchase` (`customer_id`);