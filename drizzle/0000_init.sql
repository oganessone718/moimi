CREATE TYPE "public"."comment_target" AS ENUM('DATE', 'PLACE');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('OPEN', 'CLOSED', 'CONFIRMED');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('DATE', 'PLACE', 'DATE_PLACE');--> statement-breakpoint
CREATE TYPE "public"."vote_value" AS ENUM('YES', 'MAYBE', 'NO');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"target" "comment_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "date_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "date_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_option_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"vote" "vote_value" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"reporter_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"admin_pin_hash" text,
	"title" text NOT NULL,
	"description" text,
	"type" "meeting_type" NOT NULL,
	"status" "meeting_status" DEFAULT 'OPEN' NOT NULL,
	"timezone" text DEFAULT 'Asia/Seoul' NOT NULL,
	"share_token" text NOT NULL,
	"allow_guest_add_place" boolean DEFAULT true NOT NULL,
	"anonymous_vote" boolean DEFAULT false NOT NULL,
	"deadline" timestamp with time zone,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"confirmed_slot_id" uuid,
	"confirmed_place_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" text NOT NULL,
	"guest_key" text,
	"edit_pin_hash" text,
	"departure_lat" double precision,
	"departure_lng" double precision,
	"departure_label" text,
	"submitted" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"category" text,
	"link" text,
	"og_image" text,
	"og_color" text,
	"og_emoji" text,
	"added_by_participant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"display_name" text,
	"avatar_url" text,
	"provider" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_options" ADD CONSTRAINT "date_options_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_votes" ADD CONSTRAINT "date_votes_date_option_id_date_options_id_fk" FOREIGN KEY ("date_option_id") REFERENCES "public"."date_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_votes" ADD CONSTRAINT "date_votes_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_reporter_user_id_profiles_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_owner_user_id_profiles_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_votes" ADD CONSTRAINT "place_votes_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_votes" ADD CONSTRAINT "place_votes_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_added_by_participant_id_participants_id_fk" FOREIGN KEY ("added_by_participant_id") REFERENCES "public"."participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_meeting_idx" ON "comments" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "date_options_meeting_idx" ON "date_options" USING btree ("meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "date_options_meeting_date_uq" ON "date_options" USING btree ("meeting_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "date_votes_option_participant_uq" ON "date_votes" USING btree ("date_option_id","participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meetings_share_token_uq" ON "meetings" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "meetings_owner_idx" ON "meetings" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "meetings_expires_idx" ON "meetings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "participants_meeting_idx" ON "participants" USING btree ("meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_meeting_guestkey_uq" ON "participants" USING btree ("meeting_id","guest_key") WHERE "participants"."guest_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "place_votes_place_participant_uq" ON "place_votes" USING btree ("place_id","participant_id");--> statement-breakpoint
CREATE INDEX "places_meeting_idx" ON "places" USING btree ("meeting_id");