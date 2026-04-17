/**
 * THE EXERCISE LIBRARY
 *
 * A canonical repertoire of strength, hypertrophy, calisthenics, carry,
 * isometric, and cardio exercises. Each entry has a slug (the canonical
 * key), a display name, a measurement category, a movement pattern, a
 * primary muscle group, and a list of aliases that Gemini and our matcher
 * can use to resolve variations.
 *
 * The category determines what fields a set may contain (weight×reps,
 * timed hold, distance, etc.) and how the UI renders it.
 *
 * VARIATIONS are preserved separately on the Exercise row (e.g.,
 * "paused", "tempo 3-1-1", "close-grip"). Two sets of paused bench and
 * touch-and-go bench both have canonical "bench_press"; their progression
 * groups together for the lift, but variation is visible per session.
 */

export type ExerciseCategory =
  | "weighted_reps"      // bench, squat, deadlift, curl, pulldown — weight × reps
  | "bodyweight_reps"    // pull-up, push-up, dip — reps with bodyweight (optional added weight)
  | "timed_hold"         // plank, deadhang, L-sit — duration
  | "carry"              // farmer carry, prowler — load × distance (and/or time)
  | "distance_time"      // sled drag, sprints — distance & time, no load tracked
  | "cardio_distance"    // run, row, bike — distance + duration + optional pace
  | "reps_only"          // jumping jack, burpee, mountain climber — reps without weight tracking
  ;

export type MovementPattern =
  | "horizontal_push" | "vertical_push"
  | "horizontal_pull" | "vertical_pull"
  | "squat" | "hinge" | "lunge" | "single_leg"
  | "carry" | "rotation" | "anti_rotation"
  | "isolation" | "core" | "cardio";

export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "quads" | "hamstrings" | "glutes" | "calves"
  | "core" | "full_body" | "cardio" | "other";

export type CanonicalExercise = {
  slug: string;
  display: string;
  category: ExerciseCategory;
  pattern: MovementPattern;
  primaryMuscle: MuscleGroup;
  aliases: string[];
};

export const LIBRARY: CanonicalExercise[] = [
  /* ─────────── HORIZONTAL PUSH ─────────── */
  { slug: "bench_press", display: "Bench Press", category: "weighted_reps", pattern: "horizontal_push", primaryMuscle: "chest",
    aliases: ["bp", "bench", "benches", "flat bench", "barbell bench", "barbell bench press", "bb bench press", "flat barbell bench", "benchpress", "bench presses"] },
  { slug: "incline_bench_press", display: "Incline Bench Press", category: "weighted_reps", pattern: "horizontal_push", primaryMuscle: "chest",
    aliases: ["incline bench", "inc bp", "incline bp", "incline barbell bench"] },
  { slug: "decline_bench_press", display: "Decline Bench Press", category: "weighted_reps", pattern: "horizontal_push", primaryMuscle: "chest",
    aliases: ["decline bench", "dec bp"] },
  { slug: "close_grip_bench_press", display: "Close-Grip Bench Press", category: "weighted_reps", pattern: "horizontal_push", primaryMuscle: "triceps",
    aliases: ["cgbp", "close grip bench", "narrow bench"] },
  { slug: "dumbbell_bench_press", display: "Dumbbell Bench Press", category: "weighted_reps", pattern: "horizontal_push", primaryMuscle: "chest",
    aliases: ["db bench", "db bench press", "dumbbell flat bench"] },
  { slug: "incline_dumbbell_press", display: "Incline Dumbbell Press", category: "weighted_reps", pattern: "horizontal_push", primaryMuscle: "chest",
    aliases: ["incline db press", "inc db", "incline db bench"] },
  { slug: "dumbbell_fly", display: "Dumbbell Fly", category: "weighted_reps", pattern: "isolation", primaryMuscle: "chest",
    aliases: ["db fly", "db flye", "dumbbell flye", "chest fly"] },
  { slug: "cable_fly", display: "Cable Fly", category: "weighted_reps", pattern: "isolation", primaryMuscle: "chest",
    aliases: ["cable crossover", "pec fly", "cable chest fly"] },
  { slug: "pec_deck", display: "Pec Deck", category: "weighted_reps", pattern: "isolation", primaryMuscle: "chest",
    aliases: ["machine fly", "pec deck fly"] },
  { slug: "push_up", display: "Push-up", category: "bodyweight_reps", pattern: "horizontal_push", primaryMuscle: "chest",
    aliases: ["pushup", "push ups", "press up", "press ups"] },
  { slug: "diamond_push_up", display: "Diamond Push-up", category: "bodyweight_reps", pattern: "horizontal_push", primaryMuscle: "triceps",
    aliases: ["close push up", "triangle push up"] },
  { slug: "dip", display: "Dip", category: "bodyweight_reps", pattern: "vertical_push", primaryMuscle: "chest",
    aliases: ["dips", "parallel bar dip", "tricep dip", "chest dip", "ring dip", "weighted dip"] },

  /* ─────────── VERTICAL PUSH ─────────── */
  { slug: "overhead_press", display: "Overhead Press", category: "weighted_reps", pattern: "vertical_push", primaryMuscle: "shoulders",
    aliases: ["ohp", "press", "standing press", "military press", "strict press", "barbell ohp"] },
  { slug: "push_press", display: "Push Press", category: "weighted_reps", pattern: "vertical_push", primaryMuscle: "shoulders",
    aliases: ["pp"] },
  { slug: "dumbbell_shoulder_press", display: "Dumbbell Shoulder Press", category: "weighted_reps", pattern: "vertical_push", primaryMuscle: "shoulders",
    aliases: ["db shoulder press", "db ohp", "seated db press", "dumbbell ohp"] },
  { slug: "arnold_press", display: "Arnold Press", category: "weighted_reps", pattern: "vertical_push", primaryMuscle: "shoulders",
    aliases: ["arnold"] },
  { slug: "landmine_press", display: "Landmine Press", category: "weighted_reps", pattern: "vertical_push", primaryMuscle: "shoulders",
    aliases: ["landmine"] },
  { slug: "handstand_push_up", display: "Handstand Push-up", category: "bodyweight_reps", pattern: "vertical_push", primaryMuscle: "shoulders",
    aliases: ["hspu", "wall hspu", "freestanding hspu"] },

  /* ─────────── SHOULDER ISOLATION ─────────── */
  { slug: "lateral_raise", display: "Lateral Raise", category: "weighted_reps", pattern: "isolation", primaryMuscle: "shoulders",
    aliases: ["db lateral raise", "side raise", "lat raise", "side lateral", "cable lateral raise", "lu raise", "lu raises", "lateral raises"] },
  { slug: "front_raise", display: "Front Raise", category: "weighted_reps", pattern: "isolation", primaryMuscle: "shoulders",
    aliases: ["db front raise", "plate front raise"] },
  { slug: "rear_delt_fly", display: "Rear Delt Fly", category: "weighted_reps", pattern: "isolation", primaryMuscle: "shoulders",
    aliases: ["reverse fly", "rear fly", "bent over rear delt", "reverse pec deck"] },
  { slug: "band_pull_apart", display: "Band Pull-Apart", category: "bodyweight_reps", pattern: "horizontal_pull", primaryMuscle: "shoulders",
    aliases: ["band pull apart", "band pull aparts", "banded pull apart", "banded pull aparts", "bpa", "band pull-apart", "band pullapart"] },
  { slug: "face_pull", display: "Face Pull", category: "weighted_reps", pattern: "horizontal_pull", primaryMuscle: "shoulders",
    aliases: ["cable face pull"] },
  { slug: "shrug", display: "Shrug", category: "weighted_reps", pattern: "isolation", primaryMuscle: "shoulders",
    aliases: ["barbell shrug", "db shrug", "trap shrug"] },
  { slug: "upright_row", display: "Upright Row", category: "weighted_reps", pattern: "vertical_pull", primaryMuscle: "shoulders",
    aliases: ["bb upright row"] },

  /* ─────────── TRICEPS ─────────── */
  { slug: "triceps_pushdown", display: "Triceps Pushdown", category: "weighted_reps", pattern: "isolation", primaryMuscle: "triceps",
    aliases: ["pushdown", "tricep pushdown", "rope pushdown", "cable pushdown"] },
  { slug: "overhead_triceps_extension", display: "Overhead Triceps Extension", category: "weighted_reps", pattern: "isolation", primaryMuscle: "triceps",
    aliases: ["overhead extension", "french press", "db overhead extension", "ez overhead extension"] },
  { slug: "skull_crusher", display: "Skull Crusher", category: "weighted_reps", pattern: "isolation", primaryMuscle: "triceps",
    aliases: ["lying tricep extension", "ez skull crusher", "lying ext"] },
  { slug: "tricep_kickback", display: "Tricep Kickback", category: "weighted_reps", pattern: "isolation", primaryMuscle: "triceps",
    aliases: ["db kickback", "kickback"] },

  /* ─────────── HORIZONTAL PULL ─────────── */
  { slug: "barbell_row", display: "Barbell Row", category: "weighted_reps", pattern: "horizontal_pull", primaryMuscle: "back",
    aliases: ["bb row", "bent over row", "bent-over row", "yates row", "barbell bent row", "barbell rows", "barbell bentover row", "barbell bentover rows", "bent over rows"] },
  { slug: "pendlay_row", display: "Pendlay Row", category: "weighted_reps", pattern: "horizontal_pull", primaryMuscle: "back",
    aliases: ["pendlay"] },
  { slug: "dumbbell_row", display: "Dumbbell Row", category: "weighted_reps", pattern: "horizontal_pull", primaryMuscle: "back",
    aliases: ["db row", "one arm db row", "single arm db row", "1-arm row"] },
  { slug: "seal_row", display: "Seal Row", category: "weighted_reps", pattern: "horizontal_pull", primaryMuscle: "back",
    aliases: ["chest supported row", "csr"] },
  { slug: "t_bar_row", display: "T-Bar Row", category: "weighted_reps", pattern: "horizontal_pull", primaryMuscle: "back",
    aliases: ["t bar row", "tbar row", "t-bar"] },
  { slug: "cable_row", display: "Cable Row", category: "weighted_reps", pattern: "horizontal_pull", primaryMuscle: "back",
    aliases: ["seated cable row", "low cable row", "machine row", "neutral grip row"] },
  { slug: "inverted_row", display: "Inverted Row", category: "bodyweight_reps", pattern: "horizontal_pull", primaryMuscle: "back",
    aliases: ["body row", "australian pullup", "trx row"] },
  { slug: "meadows_row", display: "Meadows Row", category: "weighted_reps", pattern: "horizontal_pull", primaryMuscle: "back",
    aliases: ["meadows"] },

  /* ─────────── VERTICAL PULL ─────────── */
  { slug: "pull_up", display: "Pull-up", category: "bodyweight_reps", pattern: "vertical_pull", primaryMuscle: "back",
    aliases: ["pullup", "pull ups", "weighted pull up", "wide grip pull up", "neutral grip pull up"] },
  { slug: "chin_up", display: "Chin-up", category: "bodyweight_reps", pattern: "vertical_pull", primaryMuscle: "back",
    aliases: ["chinup", "chin ups", "weighted chin"] },
  { slug: "lat_pulldown", display: "Lat Pulldown", category: "weighted_reps", pattern: "vertical_pull", primaryMuscle: "back",
    aliases: ["pulldown", "wide grip pulldown", "neutral pulldown", "close grip pulldown", "v-bar pulldown"] },
  { slug: "straight_arm_pulldown", display: "Straight-Arm Pulldown", category: "weighted_reps", pattern: "isolation", primaryMuscle: "back",
    aliases: ["stiff arm pulldown", "pull over cable"] },
  { slug: "dumbbell_pullover", display: "Dumbbell Pullover", category: "weighted_reps", pattern: "isolation", primaryMuscle: "back",
    aliases: ["db pullover", "pullover"] },

  /* ─────────── BICEPS ─────────── */
  { slug: "barbell_curl", display: "Barbell Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "biceps",
    aliases: ["bb curl", "ez curl", "ez bar curl", "ez bar curls", "ez-bar curl", "straight bar curl", "ezbar curl", "barbell curls", "ez curls"] },
  { slug: "dumbbell_curl", display: "Dumbbell Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "biceps",
    aliases: ["db curl", "alternating db curl", "incline db curl"] },
  { slug: "hammer_curl", display: "Hammer Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "biceps",
    aliases: ["db hammer curl", "rope hammer curl", "cross body hammer"] },
  { slug: "preacher_curl", display: "Preacher Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "biceps",
    aliases: ["scott curl", "ez preacher", "machine preacher"] },
  { slug: "incline_dumbbell_curl", display: "Incline Dumbbell Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "biceps",
    aliases: ["incline db curl", "incline curl", "inc db curl"] },
  { slug: "concentration_curl", display: "Concentration Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "biceps",
    aliases: ["conc curl"] },
  { slug: "cable_curl", display: "Cable Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "biceps",
    aliases: ["rope curl", "bar cable curl"] },
  { slug: "reverse_curl", display: "Reverse Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "forearms",
    aliases: ["bb reverse curl", "ez reverse curl"] },
  { slug: "wrist_curl", display: "Wrist Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "forearms",
    aliases: ["bb wrist curl", "db wrist curl"] },

  /* ─────────── HINGE / DEADLIFT ─────────── */
  { slug: "deadlift", display: "Deadlift", category: "weighted_reps", pattern: "hinge", primaryMuscle: "back",
    aliases: ["dl", "conventional deadlift", "conv deadlift", "barbell deadlift"] },
  { slug: "sumo_deadlift", display: "Sumo Deadlift", category: "weighted_reps", pattern: "hinge", primaryMuscle: "back",
    aliases: ["sumo dl", "sumo"] },
  { slug: "romanian_deadlift", display: "Romanian Deadlift", category: "weighted_reps", pattern: "hinge", primaryMuscle: "hamstrings",
    aliases: ["rdl", "barbell rdl", "db rdl"] },
  { slug: "stiff_leg_deadlift", display: "Stiff-Leg Deadlift", category: "weighted_reps", pattern: "hinge", primaryMuscle: "hamstrings",
    aliases: ["sldl", "stiff leg dl"] },
  { slug: "deficit_deadlift", display: "Deficit Deadlift", category: "weighted_reps", pattern: "hinge", primaryMuscle: "back",
    aliases: ["deficit dl"] },
  { slug: "trap_bar_deadlift", display: "Trap Bar Deadlift", category: "weighted_reps", pattern: "hinge", primaryMuscle: "back",
    aliases: ["hex bar deadlift", "trap bar dl"] },
  { slug: "block_pull", display: "Block Pull", category: "weighted_reps", pattern: "hinge", primaryMuscle: "back",
    aliases: ["rack pull", "blocks", "rack deadlift"] },
  { slug: "good_morning", display: "Good Morning", category: "weighted_reps", pattern: "hinge", primaryMuscle: "hamstrings",
    aliases: ["bb good morning", "gm"] },
  { slug: "kettlebell_swing", display: "Kettlebell Swing", category: "weighted_reps", pattern: "hinge", primaryMuscle: "glutes",
    aliases: ["kb swing", "swing", "russian swing", "american swing"] },

  /* ─────────── SQUAT ─────────── */
  { slug: "back_squat", display: "Back Squat", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["squat", "high bar squat", "hbbs", "barbell squat", "back sq"] },
  { slug: "low_bar_squat", display: "Low Bar Squat", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["lbbs", "low bar back squat"] },
  { slug: "front_squat", display: "Front Squat", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["fs", "front sq"] },
  { slug: "safety_bar_squat", display: "Safety Bar Squat", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["sbs", "ssb squat"] },
  { slug: "box_squat", display: "Box Squat", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["box sq"] },
  { slug: "paused_squat", display: "Paused Squat", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["pause squat"] },
  { slug: "goblet_squat", display: "Goblet Squat", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["db goblet", "kb goblet"] },
  { slug: "leg_press", display: "Leg Press", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["lp", "machine leg press", "45 leg press"] },
  { slug: "hack_squat", display: "Hack Squat", category: "weighted_reps", pattern: "squat", primaryMuscle: "quads",
    aliases: ["machine hack squat"] },
  { slug: "pistol_squat", display: "Pistol Squat", category: "bodyweight_reps", pattern: "single_leg", primaryMuscle: "quads",
    aliases: ["one leg squat", "single leg squat"] },

  /* ─────────── LUNGE / SINGLE LEG ─────────── */
  { slug: "lunge", display: "Lunge", category: "weighted_reps", pattern: "lunge", primaryMuscle: "quads",
    aliases: ["bb lunge", "db lunge", "walking lunge", "reverse lunge", "front lunge", "alternating lunge"] },
  { slug: "bulgarian_split_squat", display: "Bulgarian Split Squat", category: "weighted_reps", pattern: "single_leg", primaryMuscle: "quads",
    aliases: ["bss", "rear foot elevated split squat", "rfess", "bulgarian"] },
  { slug: "split_squat", display: "Split Squat", category: "weighted_reps", pattern: "single_leg", primaryMuscle: "quads",
    aliases: ["static lunge"] },
  { slug: "step_up", display: "Step-up", category: "weighted_reps", pattern: "single_leg", primaryMuscle: "quads",
    aliases: ["bb step up", "db step up", "weighted step up"] },

  /* ─────────── HAMSTRINGS / GLUTES ─────────── */
  { slug: "leg_curl", display: "Leg Curl", category: "weighted_reps", pattern: "isolation", primaryMuscle: "hamstrings",
    aliases: ["lying leg curl", "seated leg curl", "machine leg curl", "hamstring curl"] },
  { slug: "nordic_curl", display: "Nordic Curl", category: "bodyweight_reps", pattern: "isolation", primaryMuscle: "hamstrings",
    aliases: ["nordic", "nordic hamstring curl"] },
  { slug: "leg_extension", display: "Leg Extension", category: "weighted_reps", pattern: "isolation", primaryMuscle: "quads",
    aliases: ["leg ext", "machine leg extension", "quad extension"] },
  { slug: "hip_thrust", display: "Hip Thrust", category: "weighted_reps", pattern: "hinge", primaryMuscle: "glutes",
    aliases: ["barbell hip thrust", "bb hip thrust", "hip thruster", "ht"] },
  { slug: "single_leg_hip_thrust", display: "Single-Leg Hip Thrust", category: "weighted_reps", pattern: "hinge", primaryMuscle: "glutes",
    aliases: ["single leg ht", "1-leg hip thrust"] },
  { slug: "glute_bridge", display: "Glute Bridge", category: "weighted_reps", pattern: "hinge", primaryMuscle: "glutes",
    aliases: ["bridge", "barbell glute bridge"] },
  { slug: "glute_kickback", display: "Glute Kickback", category: "weighted_reps", pattern: "isolation", primaryMuscle: "glutes",
    aliases: ["cable kickback", "machine kickback"] },
  { slug: "abduction", display: "Hip Abduction", category: "weighted_reps", pattern: "isolation", primaryMuscle: "glutes",
    aliases: ["abductor machine", "hip abduction machine", "cable abduction", "glute medius abduction"] },

  /* ─────────── CALVES ─────────── */
  { slug: "standing_calf_raise", display: "Standing Calf Raise", category: "weighted_reps", pattern: "isolation", primaryMuscle: "calves",
    aliases: ["calf raise", "machine calf raise", "smith calf raise", "bb calf raise"] },
  { slug: "seated_calf_raise", display: "Seated Calf Raise", category: "weighted_reps", pattern: "isolation", primaryMuscle: "calves",
    aliases: ["seated calf"] },
  { slug: "donkey_calf_raise", display: "Donkey Calf Raise", category: "weighted_reps", pattern: "isolation", primaryMuscle: "calves",
    aliases: ["donkey calf"] },

  /* ─────────── CORE ─────────── */
  { slug: "plank", display: "Plank", category: "timed_hold", pattern: "anti_rotation", primaryMuscle: "core",
    aliases: ["front plank", "rkc plank", "plank hold"] },
  { slug: "side_plank", display: "Side Plank", category: "timed_hold", pattern: "anti_rotation", primaryMuscle: "core",
    aliases: ["side plank hold"] },
  { slug: "hollow_body_hold", display: "Hollow Body Hold", category: "timed_hold", pattern: "anti_rotation", primaryMuscle: "core",
    aliases: ["hollow hold", "hollow body"] },
  { slug: "l_sit", display: "L-Sit", category: "timed_hold", pattern: "anti_rotation", primaryMuscle: "core",
    aliases: ["l sit", "lsit", "tuck sit"] },
  { slug: "v_sit", display: "V-Sit", category: "timed_hold", pattern: "core", primaryMuscle: "core",
    aliases: ["v sit"] },
  { slug: "hanging_leg_raise", display: "Hanging Leg Raise", category: "bodyweight_reps", pattern: "core", primaryMuscle: "core",
    aliases: ["hlr", "hanging knee raise", "toes to bar", "ttb"] },
  { slug: "ab_wheel_rollout", display: "Ab Wheel Rollout", category: "bodyweight_reps", pattern: "anti_rotation", primaryMuscle: "core",
    aliases: ["ab rollout", "ab wheel", "rollout"] },
  { slug: "sit_up", display: "Sit-up", category: "bodyweight_reps", pattern: "core", primaryMuscle: "core",
    aliases: ["situp", "sit ups", "weighted sit up"] },
  { slug: "crunch", display: "Crunch", category: "bodyweight_reps", pattern: "core", primaryMuscle: "core",
    aliases: ["bicycle crunch", "cable crunch", "weighted crunch"] },
  { slug: "russian_twist", display: "Russian Twist", category: "weighted_reps", pattern: "rotation", primaryMuscle: "core",
    aliases: ["russian twists", "weighted russian twist"] },
  { slug: "pallof_press", display: "Pallof Press", category: "weighted_reps", pattern: "anti_rotation", primaryMuscle: "core",
    aliases: ["pallof", "anti rotation press"] },

  /* ─────────── ISOMETRIC HOLDS / GRIP ─────────── */
  { slug: "dead_hang", display: "Dead Hang", category: "timed_hold", pattern: "vertical_pull", primaryMuscle: "forearms",
    aliases: ["deadhang", "deadhangs", "dead hangs", "bar hang", "passive hang", "hanging"] },
  { slug: "active_hang", display: "Active Hang", category: "timed_hold", pattern: "vertical_pull", primaryMuscle: "back",
    aliases: ["scapular hang"] },
  { slug: "wall_sit", display: "Wall Sit", category: "timed_hold", pattern: "squat", primaryMuscle: "quads",
    aliases: ["wall squat hold"] },

  /* ─────────── CARRY ─────────── */
  { slug: "farmers_carry", display: "Farmer's Carry", category: "carry", pattern: "carry", primaryMuscle: "forearms",
    aliases: ["farmer carry", "farmer walk", "farmers walk", "trap bar carry"] },
  { slug: "suitcase_carry", display: "Suitcase Carry", category: "carry", pattern: "carry", primaryMuscle: "core",
    aliases: ["one arm carry", "single arm carry"] },
  { slug: "overhead_carry", display: "Overhead Carry", category: "carry", pattern: "carry", primaryMuscle: "shoulders",
    aliases: ["waiter walk"] },
  { slug: "yoke_carry", display: "Yoke Carry", category: "carry", pattern: "carry", primaryMuscle: "full_body",
    aliases: ["yoke walk"] },

  /* ─────────── SLED / DISTANCE-TIME ─────────── */
  { slug: "prowler_push", display: "Prowler Push", category: "distance_time", pattern: "carry", primaryMuscle: "full_body",
    aliases: ["prowler", "sled push"] },
  { slug: "sled_drag", display: "Sled Drag", category: "distance_time", pattern: "carry", primaryMuscle: "full_body",
    aliases: ["sled pull", "reverse sled drag"] },

  /* ─────────── CARDIO ─────────── */
  { slug: "run", display: "Run", category: "cardio_distance", pattern: "cardio", primaryMuscle: "cardio",
    aliases: ["running", "jog", "treadmill run", "outdoor run", "easy run"] },
  { slug: "row_erg", display: "Row (Erg)", category: "cardio_distance", pattern: "cardio", primaryMuscle: "cardio",
    aliases: ["rowing", "rower", "erg row", "concept2"] },
  { slug: "bike", display: "Bike", category: "cardio_distance", pattern: "cardio", primaryMuscle: "cardio",
    aliases: ["cycling", "stationary bike", "assault bike", "echo bike", "bike ride"] },
  { slug: "ski_erg", display: "Ski Erg", category: "cardio_distance", pattern: "cardio", primaryMuscle: "cardio",
    aliases: ["skierg", "ski"] },
  { slug: "swim", display: "Swim", category: "cardio_distance", pattern: "cardio", primaryMuscle: "cardio",
    aliases: ["swimming", "lap swim"] },

  /* ─────────── METCON / REPS ONLY ─────────── */
  { slug: "burpee", display: "Burpee", category: "reps_only", pattern: "cardio", primaryMuscle: "full_body",
    aliases: ["burpees"] },
  { slug: "jumping_jack", display: "Jumping Jack", category: "reps_only", pattern: "cardio", primaryMuscle: "cardio",
    aliases: ["jacks"] },
  { slug: "mountain_climber", display: "Mountain Climber", category: "reps_only", pattern: "core", primaryMuscle: "core",
    aliases: ["mountain climbers"] },
  { slug: "box_jump", display: "Box Jump", category: "reps_only", pattern: "squat", primaryMuscle: "quads",
    aliases: ["box jumps", "bj"] },
  { slug: "broad_jump", display: "Broad Jump", category: "reps_only", pattern: "squat", primaryMuscle: "quads",
    aliases: ["standing long jump"] },

  /* ─────────── OLYMPIC ─────────── */
  { slug: "clean", display: "Clean", category: "weighted_reps", pattern: "hinge", primaryMuscle: "full_body",
    aliases: ["power clean", "hang clean", "squat clean", "muscle clean"] },
  { slug: "snatch", display: "Snatch", category: "weighted_reps", pattern: "hinge", primaryMuscle: "full_body",
    aliases: ["power snatch", "hang snatch", "squat snatch", "muscle snatch"] },
  { slug: "clean_and_jerk", display: "Clean & Jerk", category: "weighted_reps", pattern: "hinge", primaryMuscle: "full_body",
    aliases: ["c&j", "cj", "clean and jerk"] },
  { slug: "high_pull", display: "High Pull", category: "weighted_reps", pattern: "hinge", primaryMuscle: "back",
    aliases: ["snatch grip high pull", "clean grip high pull"] },
  { slug: "thruster", display: "Thruster", category: "weighted_reps", pattern: "squat", primaryMuscle: "full_body",
    aliases: ["thrusters"] },
];

/* ═══════════════════════════════════════════════════════════════
   Lookup utilities
   ═══════════════════════════════════════════════════════════════ */

const SLUG_INDEX: Map<string, CanonicalExercise> = new Map(
  LIBRARY.map((e) => [e.slug, e]),
);

const ALIAS_INDEX: Map<string, CanonicalExercise> = (() => {
  const map = new Map<string, CanonicalExercise>();

  /** Add an alias key for entry e (only if not already mapped to a different
   * entry — first definition wins, prevents one library entry from
   * overriding another). */
  const add = (key: string, e: CanonicalExercise) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, e);
  };

  for (const e of LIBRARY) {
    const bases = [e.display, e.slug.replace(/_/g, " "), ...e.aliases];
    for (const base of bases) {
      const norm = normalize(base);
      if (!norm) continue;

      const tokens = norm.split(" ").filter(Boolean);
      const dep = tokens.map(depluralize);

      // exact + depluralized
      add(tokens.join(" "), e);
      add(dep.join(" "), e);

      if (tokens.length >= 2) {
        // fully concatenated: "back squat" → "backsquat"
        add(tokens.join(""), e);
        add(dep.join(""), e);
        // hyphenated: "back-squat"
        add(tokens.join("-"), e);
        add(dep.join("-"), e);
        // adjacent-pair concatenation: "bent over rows" → "bentover rows"
        for (let i = 0; i < tokens.length - 1; i++) {
          const merged = [
            ...tokens.slice(0, i),
            tokens[i] + tokens[i + 1],
            ...tokens.slice(i + 2),
          ];
          add(merged.join(" "), e);
          add(merged.map(depluralize).join(" "), e);
        }
      }
    }
  }
  return map;
})();

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Display-side cleanup of a parsed exercise name. Strips trailing
 * uncertainty markers like "?", collapses repeated whitespace, and
 * fixes obvious capitalisation glitches. Run at SAVE time so the
 * stored name reads cleanly in lists, charts, and titles.
 */
export function cleanExerciseName(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = raw.trim();
  // strip trailing punctuation that Gemini sometimes emits as uncertainty
  s = s.replace(/[?!]+$/g, "").trim();
  // collapse internal whitespace
  s = s.replace(/\s+/g, " ");
  // fix doubled punctuation like " .. " or "  -  "
  s = s.replace(/\.{2,}/g, "·").replace(/\s*·\s*/g, " · ");
  return s;
}

/** Strip a trailing 's' to handle simple plurals (curls → curl). */
function depluralize(token: string): string {
  // Simple plural rule — handles most English plurals we'll see in lift names.
  if (token.length < 3) return token;
  if (token.endsWith("ies")) return token.slice(0, -3) + "y";
  if (token.endsWith("es") && !token.endsWith("ses")) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

/** Strip an "ed" or "ing" suffix to map "banded" → "band", "rowing" → "row". */
function stemMild(token: string): string {
  if (token.length < 5) return token;
  if (token.endsWith("ed")) return token.slice(0, -2);
  if (token.endsWith("ing")) return token.slice(0, -3);
  return token;
}

/** Tokenize a normalized name into its content words (depluralized + stemmed). */
function tokenize(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter(Boolean)
    .map((t) => depluralize(t))
    .map((t) => stemMild(t));
}

/** Look up a canonical exercise by slug. */
export function bySlug(slug: string): CanonicalExercise | undefined {
  return SLUG_INDEX.get(slug);
}

/**
 * Best-effort lookup by name or any known alias.
 *
 * Walks several strategies in increasing fuzziness:
 *   1. Exact normalized match against display + slug + aliases
 *   2. Plural-stripped match
 *   3. Token-overlap match against the entry's display + aliases
 */
export function findCanonical(name: string | null | undefined): CanonicalExercise | undefined {
  if (!name) return undefined;
  const norm = normalize(name);
  if (!norm) return undefined;

  // 1) exact alias hit
  const direct = ALIAS_INDEX.get(norm);
  if (direct) return direct;

  // 2) plural / singular flip
  if (norm.endsWith("s")) {
    const sing = ALIAS_INDEX.get(norm.slice(0, -1));
    if (sing) return sing;
  } else {
    const plur = ALIAS_INDEX.get(norm + "s");
    if (plur) return plur;
  }

  // 3) tokenized match — try both directions and prefer the more specific.
  //    "Banded pull aparts" → "Band Pull-Apart" via depluralize+stem.
  //    "wide grip bent over BB rows" → "Barbell Row" via candidate-subset
  //    BUT only when the extra input tokens are equipment / grip / stance
  //    qualifiers, not anatomy or new actions ("calf raises" must NOT
  //    fold into "squat").
  const inputTokens = tokenize(name).filter((t) => t.length > 1);
  if (inputTokens.length === 0) return undefined;
  const inputSet = new Set(inputTokens);

  let best: { entry: CanonicalExercise; score: number; tightness: number } | null = null;
  for (const e of LIBRARY) {
    const candidates = [e.display, e.slug.replace(/_/g, " "), ...e.aliases];
    for (const c of candidates) {
      const candTokens = tokenize(c).filter((t) => t.length > 1);
      if (candTokens.length === 0) continue;
      const candSet = new Set(candTokens);

      let matched = false;
      let score = 0;
      let tightness = 0;
      // direction A: every input token is in the candidate (input ⊆ candidate)
      if (inputTokens.every((t) => candSet.has(t))) {
        matched = true;
        score = (inputTokens.length / Math.max(candSet.size, 1)) * 100;
        tightness = candSet.size;
      }
      // direction B: every candidate token is in the input AND every
      // EXTRA input token is a known qualifier (equipment / grip / etc.).
      // Without the qualifier check, "Hack squat calf raises" wrongly
      // collapses to "Hack Squat".
      else if (candTokens.length >= 2 && candTokens.every((t) => inputSet.has(t))) {
        const extras = inputTokens.filter((t) => !candSet.has(t));
        const allExtrasAreQualifiers = extras.every((t) => QUALIFIER_TOKENS.has(t));
        if (allExtrasAreQualifiers) {
          matched = true;
          score = (candSet.size / Math.max(inputSet.size, 1)) * 50;
          tightness = candSet.size;
        }
      }
      if (!matched) continue;
      if (
        !best ||
        score > best.score ||
        (score === best.score && tightness > best.tightness)
      ) {
        best = { entry: e, score, tightness };
      }
    }
  }
  return best?.entry;
}

/**
 * Tokens that don't change the identity of a lift — equipment, grip,
 * stance, tempo modifiers. When ALL the extra words in the input are
 * from this set, direction-B matching is safe ("wide grip bench press"
 * → "Bench Press"). Anatomy words (calf, raise, etc.) are NOT here
 * because they change what the exercise is.
 */
const QUALIFIER_TOKENS: Set<string> = new Set([
  // grip / stance
  "wide", "narrow", "close", "neutral", "reverse", "supinated", "pronated",
  "grip", "hand", "stance",
  // bent over (often appears as separate tokens before "row")
  "bent", "over", "bentover",
  // tempo / pause / range
  "paused", "pause", "tempo", "slow", "fast", "explosive",
  "deficit", "block", "pin",
  "halting", "touch", "go",
  // equipment
  "bb", "db", "kb", "ez", "ezbar", "barbell", "dumbbell", "kettlebell",
  "cable", "machine", "free", "smith", "trap",
  // adjectives
  "regular", "conventional", "standard",
  // articles / fillers
  "the", "a", "an", "with", "no", "without", "and",
]);

/**
 * Aggressive normalization for grouping — used when no library match is found.
 * Lowercases, strips punctuation, collapses whitespace, depluralizes each
 * token. Result: "Bench press " and "BENCH PRESS" and "Bench  press" all map
 * to "bench press" so the same lift across two sloppy spellings groups
 * together even without library coverage.
 */
export function normalizeForGrouping(name: string | null | undefined): string {
  if (!name) return "";
  return tokenize(name).join(" ");
}

/**
 * Resolve any free-form exercise name to its canonical key for grouping.
 *
 * Strategy: the LIBRARY is the source of truth (so updates to the
 * library propagate to existing data on read). If the library doesn't
 * recognise the lift, we use aggressive normalization on the raw name
 * — which depluralises tokens, lowercases, strips punctuation/spaces.
 * This is what makes "Hack squat Calf Raises" and "Hack squat calf
 * raises" fold together even when neither has a library entry.
 *
 * The saved canonicalSlug is only used as a last-resort fallback (e.g.
 * if the name itself is empty for some reason).
 */
export function resolveLiftKey(name: string | null | undefined, canonicalSlug?: string | null): string {
  // 1. Library first — authoritative
  const found = findCanonical(name);
  if (found) return found.slug;
  // 2. Aggressive normalization of the raw name — handles case/spacing/plural
  const normalized = normalizeForGrouping(name);
  if (normalized) return normalized;
  // 3. Last resort: a stale canonicalSlug field
  if (canonicalSlug && canonicalSlug.trim()) return canonicalSlug.trim().toLowerCase();
  return "";
}

/** All categories present in the library, useful for category-driven UI. */
export function allCategories(): ExerciseCategory[] {
  return Array.from(new Set(LIBRARY.map((e) => e.category)));
}

/** A compact summary of the library for inclusion in the Gemini prompt. */
export function librarySummaryForPrompt(): string {
  const lines: string[] = [];
  for (const e of LIBRARY) {
    const aliases = e.aliases.length ? ` [${e.aliases.slice(0, 4).join(", ")}]` : "";
    lines.push(`${e.slug} :: ${e.display} :: ${e.category} :: ${e.primaryMuscle}${aliases}`);
  }
  return lines.join("\n");
}
