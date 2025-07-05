CREATE TABLE "buddy_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" text,
	"partner_id" text,
	"from_address" text,
	"to_address" text,
	"from_lat" numeric(10, 8),
	"from_lng" numeric(11, 8),
	"to_lat" numeric(10, 8),
	"to_lng" numeric(11, 8),
	"travel_time" timestamp,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"buddy_request_id" integer,
	"sender_id" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safety_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"stop_id" text NOT NULL,
	"stop_name" text,
	"rating" integer NOT NULL,
	"comment" text,
	"incident_type" text,
	"lat" numeric(10, 8),
	"lng" numeric(11, 8),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"university" text,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "buddy_requests" ADD CONSTRAINT "buddy_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buddy_requests" ADD CONSTRAINT "buddy_requests_partner_id_users_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_buddy_request_id_buddy_requests_id_fk" FOREIGN KEY ("buddy_request_id") REFERENCES "public"."buddy_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_reports" ADD CONSTRAINT "safety_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;