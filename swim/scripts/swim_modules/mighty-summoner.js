/*******************************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * The Mighty Summoner.
 * This macro tries to handle everything relevant to the
 * Summon power in SWADE. It is in early stages,
 * so bugs may occur. Please create a ticket on the
 * gitHub if you find any problems with it:
 * https://github.com/SalieriC/SWADE-Immersive-Macros/issues/new
 *
 * The Macro natively supports Sound Effects and if you
 * are using the Sequencer module by Wasp
 * (https://foundryvtt.com/packages/sequencer), you can
 * also play a visual effect. SFX and VFX are configured
 * in the module settings of SWIM.
 * 
 * v. 2.0.2
 * By SalieriC
 ******************************************************/
import { Portal } from "portal-lib";
import { socket } from "../init.js";

function generate_id(length = 16) {
  let result = 'SWIM-';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function summoner_script(data) {
  const { speaker, character, _, token, item } = await swim.get_data_variables(data, false);
  const mainFolder = game.folders.getName("[SWIM] Summon Creature");
  if (!mainFolder) {
    ui.notifications.error(game.i18n.localize("SWIM.notification.setupSWIMSummonCreature"));
    return;
  }
  if (!token || canvas.tokens.controlled.length > 1) {
    ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
    return;
  }
  const actor = token.actor ?? token.actorData;
  const maintID = generate_id();
  const officialClass = await swim.get_official_class();

  let presets = swim.get_folder_content("Summon Creature Presets").filter(i => i.permission >= 1);
  let duration = item?.system.swid === 'zombie' ? 600 : 5;
  const conc = actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-concentration").toLowerCase() && i.type === "edge");
  const summoner = actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-summoner-fc").toLowerCase() && i.type === "edge");
  const druid   = actor.items.find(i => i.name.toLowerCase() === game.i18n.localize("SWIM.edge-druid-fc").toLowerCase()    && i.type === "edge");
  if (summoner) duration *= 10;
  else if (druid) duration = 600;
  if (conc) duration *= 2;
  const noPP = game.settings.get("swim", "noPowerPoints");
  if (noPP) duration = -1;

  async function main() {
    // Build options
    let scOptions = presets.map(p => `<option value="${p.id}">${p.name}</option>`).join("")
                  + `<option value="mirror">${game.i18n.localize("SWIM.power-mirrorSelf")}</option>`;

    let content = `
      ${officialClass}
      <p>${game.i18n.localize("SWIM.dialogue-summonPrompt")}</p>
      <div class="form-group">
        <label for="selected_sc">Creature:</label>
        <select id="selected_sc">${scOptions}</select>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="raise"> Cast with a raise</label>
      </div>
    `;
    if (!noPP) {
      content += `
        <div class="form-group">
          <label>${game.i18n.localize("SWIM.dialogue-duration")}</label>
          <input type="number" id="duration" value="${duration}">
        </div>
      `;
    } else {
      // build skill selector for noPP
      let skillOptions = actor.items
        .filter(p => p.type === "power")
        .map(p => `<option value="${p.system.actions.skill}">${p.system.actions.skill}</option>`)
        .join("");
      if (!skillOptions) {
        skillOptions = actor.items
          .filter(s => s.type === "skill")
          .map(s => `<option value="${s.name}">${s.name}</option>`)
          .join("");
      }
      content += `
        <div class="form-group">
          <label for="skillSelection">${game.i18n.localize("SWIM.dialogue-summonSkill")}</label>
          <select id="skillSelection">${skillOptions}</select>
        </div>
      `;
    }

    new Dialog({
      title: 'Mighty Summoner',
      content,
      buttons: {
        one: {
          label: `<i class="fas fa-paw"></i> ${game.i18n.localize("SWIM.button-summon")}`,
          callback: async (html) => {
            // collect form data
            const scID = html.find('#selected_sc')[0].value === 'mirror'
                       ? actor.id
                       : html.find('#selected_sc')[0].value;
            const raise = html.find('#raise')[0].checked;
            const scActor = game.actors.get(scID);
            const updates = {
              token: { name: `${token.name}'s ${scActor.prototypeToken.name}`, disposition: token.document.disposition, actorLink: false },
              actor: {}
            };
            if (raise) {
              updates.actor["system.wounds.max"] = scActor.system.wounds.max + 1;
            }
            if (noPP) {
              // no duration setting needed
            } else {
              duration = Number(html.find('#duration')[0].value);
            }
            // Set up and run Portal.spawn
            const portal = new Portal()
              .addCreature(scActor, { count: 1 })
              .color(game.user.color.css)
              .texture(scActor.prototypeToken.texture.src)
              .origin(token)
              .range(token.actor.system.attributes.smarts.die.sides);
            const [spawned] = await portal.spawn(updates);
            await play_sfx([spawned]);

            // Apply ActiveEffect to the summoner
            let aeRounds  = duration < 0 ? Number.MAX_SAFE_INTEGER : duration;
            let aeSeconds = duration < 0 ? Number.MAX_SAFE_INTEGER : duration * 6;
            let aeData = {
              changes: [],
              img: "modules/swim/assets/icons/effects/0-summoned.svg",
              name: game.i18n.localize("SWIM.label-summonedEntity", { name: scActor.name }),
              duration: { rounds: aeRounds, seconds: aeSeconds },
              flags: {
                swade:   { expiration: 3 },
                swim:    { maintainedSummon: true, maintenanceID: maintID, owner: true, isSummonedCreature: false }
              }
            };
            if (noPP) {
              const skillName = html.find('#skillSelection')[0].value;
              aeData.changes.push({ key: `@Skill{${skillName}}[system.die.modifier]`, mode: 2, value: -1 });
            }
            if (actor.system.additionalStats?.maintainedPowers) {
              aeData.changes.push({ key: `system.additionalStats.maintainedPowers.value`, mode: 2, value: 1 });
            }
            await actor.createEmbeddedDocuments('ActiveEffect', [aeData]);

            // Finally notify GM to tie off bookkeeping
            await socket.executeAsGM(summoner_gm, {
              summonerID: token.id,
              scID,
              tokenID: spawned.id,
              maintID,
              duration,
              mirror: scID === actor.id,
              mainFolderID: mainFolder.id,
              raise,
              flags: aeData.flags.swim
            });
          }
        }
      }
    }).render(true);
  }

  async function dismiss() {
    new Dialog({
      title: 'Mighty Summoner: Dismiss',
      content: game.i18n.format("SWIM.dialogue-dismiss", { officialClass, name: token.name }),
      buttons: {
        one: {
          label: `<i class="fas fa-paw"></i> ${game.i18n.localize("SWIM.button-dismiss")}`,
          callback: async () => {
            const maintEffect = actor.effects.find(e => e.flags?.swim?.isSummonedCreature);
            const maintenanceID = maintEffect?.flags.swim.maintenanceID;
            await play_sfx([token.id]);
            await swim.wait("200");
            await socket.executeAsGM(summoner_dismiss, { tokenID: token.id, sceneID: game.scenes.current.id });
            // Remove the AE from any summoned tokens
            for (let tk of canvas.tokens.placeables) {
              if (tk.actor.effects.find(e => e.flags?.swim?.maintenanceID === maintenanceID)) {
                await tk.actor.deleteEmbeddedDocuments('ActiveEffect', [e.id]);
              }
            }
            // If a mirror‐actor was created, delete it
            const mirror = game.actors.find(a => a.flags?.swim?.maintenanceID === maintenanceID);
            if (mirror) await mirror.delete();
          }
        }
      }
    }).render(true);
  }

  if (token.document.flags?.swim?.isSummonedCreature && (game.user.isGM || game.user.id === token.document.flags.swim.userId)) {
    dismiss();
  } else {
    main();
  }

  async function play_sfx(spawnData) {
    const sfx = game.settings.get('swim','shapeShiftSFX');
    const vfx = game.settings.get('swim','shapeShiftVFX');
    await swim.wait("100");
    if (sfx) swim.play_sfx(sfx);
    if (game.modules.get("sequencer")?.active && vfx) {
      let sequence = new Sequence()
        .effect()
        .file(vfx)
        .atLocation(spawnData[0])
        .scale(1);
      sequence.play();
      await swim.wait("800");
    }
  }
}

export async function summoner_gm(data) {
  const token = canvas.tokens.get(data.tokenID).document;
  // …keep all your GM‐side actor duplication, mirror logic, combat update, AE application, etc. unchanged…
}

export async function summoner_dismiss({ tokenID, sceneID }) {
  const scene = game.scenes.get(sceneID);
  const tk = scene.tokens.get(tokenID);
  await tk.delete();
}
