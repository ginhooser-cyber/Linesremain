// ─── Survival Constants ───

// ─── Health ───
export const MAX_HEALTH = 100;
export const HEALTH_REGEN_RATE = 0.5; // HP per second when hunger > 80% and thirst > 50%
export const HEALTH_REGEN_HUNGER_THRESHOLD = 0.8; // fraction of max hunger
export const HEALTH_REGEN_THIRST_THRESHOLD = 0.5; // fraction of max thirst

// ─── Hunger ───
export const MAX_HUNGER = 500;
export const HUNGER_DRAIN_RATE = 0.8; // per second (idle)
export const HUNGER_DRAIN_SPRINT_MULT = 2.0; // multiplier when sprinting
export const HUNGER_DRAIN_SWIM_MULT = 1.5; // multiplier when swimming
export const HUNGER_STARVING_THRESHOLD = 0; // when hunger reaches 0
export const HUNGER_STARVING_DAMAGE = 2.0; // HP per second when starving

// ─── Thirst ───
export const MAX_THIRST = 250;
export const THIRST_DRAIN_RATE = 1.0; // per second (idle)
export const THIRST_DRAIN_SPRINT_MULT = 2.0; // multiplier when sprinting
export const THIRST_DRAIN_HOT_MULT = 1.5; // multiplier in hot biomes
export const THIRST_DEHYDRATED_THRESHOLD = 0; // when thirst reaches 0
export const THIRST_DEHYDRATED_DAMAGE = 3.0; // HP per second when dehydrated

// ─── Temperature ───
export const NORMAL_BODY_TEMP = 37.0; // °C
export const COLD_THRESHOLD = 15.0; // ambient °C below which cold effects start
export const FREEZING_THRESHOLD = 0.0; // ambient °C below which freezing damage starts
export const HEAT_THRESHOLD = 40.0; // ambient °C above which heat effects start
export const SCORCHING_THRESHOLD = 50.0; // ambient °C above which heat damage starts
export const COLD_DAMAGE_RATE = 1.5; // HP per second when freezing
export const HEAT_DAMAGE_RATE = 1.0; // HP per second when scorching
export const CAMPFIRE_WARMTH_RADIUS = 5.0; // blocks
export const CAMPFIRE_WARMTH_BONUS = 20.0; // °C added near campfire

// ─── Night Effects ───
export const NIGHT_TEMPERATURE_DROP = 15.0; // °C drop at night

// ─── Food Poisoning ───
export const RAW_MEAT_POISON_CHANCE = 0.5; // 50% chance of food poisoning from raw meat
export const FOOD_POISON_DAMAGE_RATE = 1.0; // HP per second during poisoning
export const FOOD_POISON_DURATION_SECONDS = 30;
export const FOOD_POISON_HUNGER_DRAIN_MULT = 3.0; // hunger drains 3x faster during poisoning

// ─── Drowning ───
export const MAX_BREATH_SECONDS = 15;
export const DROWNING_DAMAGE_RATE = 10.0; // HP per second when out of breath underwater

// ─── Spawn Defaults ───
export const SPAWN_HEALTH = MAX_HEALTH;
export const SPAWN_HUNGER = MAX_HUNGER * 0.5; // spawn at 50% hunger
export const SPAWN_THIRST = MAX_THIRST * 0.5; // spawn at 50% thirst