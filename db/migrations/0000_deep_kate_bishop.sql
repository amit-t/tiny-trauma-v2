CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"post_slug" text NOT NULL,
	"post_type" text NOT NULL,
	"subject" text NOT NULL,
	"preheader" text DEFAULT '' NOT NULL,
	"personal_note" text,
	"body_snapshot" text NOT NULL,
	"segment" text DEFAULT 'weekly' NOT NULL,
	"scheduled_for" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscribe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text,
	"campaign_id" text,
	"kind" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"tier" text DEFAULT 'weekly' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"source" text,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribe_events" ADD CONSTRAINT "subscribe_events_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribe_events" ADD CONSTRAINT "subscribe_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_scheduled_idx" ON "campaigns" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "subscribe_events_sub_idx" ON "subscribe_events" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "subscribe_events_campaign_idx" ON "subscribe_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "subscribe_events_kind_idx" ON "subscribe_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "subscribers_status_idx" ON "subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscribers_token_idx" ON "subscribers" USING btree ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");