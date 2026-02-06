CREATE TABLE IF NOT EXISTS "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"clan_id" uuid,
	"building_type" varchar(32) NOT NULL,
	"tier" integer DEFAULT 0 NOT NULL,
	"position_x" real NOT NULL,
	"position_y" real NOT NULL,
	"position_z" real NOT NULL,
	"rotation" real DEFAULT 0 NOT NULL,
	"health" real NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lock_code" varchar(8)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clan_members" (
	"clan_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"role" varchar(16) NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clan_members_clan_id_player_id_pk" PRIMARY KEY("clan_id","player_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(32) NOT NULL,
	"leader_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_states" (
	"player_id" uuid PRIMARY KEY NOT NULL,
	"position_x" real DEFAULT 0 NOT NULL,
	"position_y" real DEFAULT 0 NOT NULL,
	"position_z" real DEFAULT 0 NOT NULL,
	"health" real DEFAULT 100 NOT NULL,
	"hunger" real DEFAULT 500 NOT NULL,
	"thirst" real DEFAULT 250 NOT NULL,
	"inventory" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"equipment" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hotbar" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(32) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login" timestamp with time zone,
	"total_playtime_seconds" integer DEFAULT 0 NOT NULL,
	"total_kills" integer DEFAULT 0 NOT NULL,
	"total_deaths" integer DEFAULT 0 NOT NULL,
	"customization" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"learned_blueprints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "players_username_unique" UNIQUE("username"),
	CONSTRAINT "players_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_cupboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"authorized_players" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"radius" real DEFAULT 32 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "world_chunks" (
	"chunk_x" integer NOT NULL,
	"chunk_z" integer NOT NULL,
	"block_data" "bytea" NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "world_chunks_chunk_x_chunk_z_pk" PRIMARY KEY("chunk_x","chunk_z")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "buildings" ADD CONSTRAINT "buildings_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "buildings" ADD CONSTRAINT "buildings_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clan_members" ADD CONSTRAINT "clan_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clans" ADD CONSTRAINT "clans_leader_id_players_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_states" ADD CONSTRAINT "player_states_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_cupboards" ADD CONSTRAINT "tool_cupboards_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "buildings_owner_idx" ON "buildings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "buildings_clan_idx" ON "buildings" USING btree ("clan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "buildings_position_idx" ON "buildings" USING btree ("position_x","position_z");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clan_members_player_idx" ON "clan_members" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clans_name_idx" ON "clans" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "players_email_idx" ON "players" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "players_username_idx" ON "players" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_player_idx" ON "refresh_tokens" USING btree ("player_id");