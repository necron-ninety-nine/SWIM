import socketlib from "socketlib";
import { api } from './api.js';
import { register_settings } from './settings.js';
import { swim_buttons } from './buttons.js';
import { gm_relay } from './gm_relay.js';
import { shape_changer_gm } from './swim_modules/shape_changer.js';
import { summoner_gm, summoner_dismiss } from './swim_modules/mighty-summoner.js';
import { heal_other_gm } from './swim_modules/personal_health_centre.js';
import { common_bond_gm } from './swim_modules/common_bond.js';
import { effect_builder_gm } from './swim_modules/effect_builder.js';
import { craft_campfire_gm } from './swim_modules/craft_campfire.js';
import { open_swim_actor_config, open_swim_item_config } from "./swim_document_config.js";
import { v10_migration, v11_migration } from "./migrations.js";
import { effect_hooks } from "./hooks/effect_hooks.js";
import { actor_hooks } from "./hooks/actor_hooks.js";
import { combat_hooks } from "./hooks/combat_hooks.js";
import { brsw_hooks } from "./hooks/brsw_hooks.js";
import { brsw_actions_setup } from "./helpers/brsw_actions_setup.js";
import { raise_calculator } from './helpers/raise-calculator.js';
import { tester_gm } from './swim_modules/tester.js';

export let socket;

Hooks.once("socketlib.ready", () => {
  socket = socketlib.registerModule("swim");

  // Core SWIM features
  socket.register("effectBuilder",      effect_builder_gm);
  socket.register("shapeChanger",       shape_changer_gm);
  socket.register("summoner",           summoner_gm);
  socket.register("summonerDismiss",    summoner_dismiss);
  socket.register("healOther",          heal_other_gm);
  socket.register("commonBond",         common_bond_gm);
  socket.register("craftCampfire",      craft_campfire_gm);
  socket.register("tester",             tester_gm);

  // GM‑relay utilities (formerly WarpGate watches)
  socket.register("deleteActor",             gm_relay.gmDeleteActor);
  socket.register("updateCombat-previousTurn", gm_relay.combat_previousTurn);
  socket.register("updateCombat-nextTurn",     gm_relay.combat_nextTurn);
  socket.register("updateCombat-currentTurn",  gm_relay.combat_currentTurn);
});
