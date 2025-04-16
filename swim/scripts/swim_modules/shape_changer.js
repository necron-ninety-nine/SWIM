/*******************************************
 * SWADE Immersive Macros (SWIM) proudly presents:
 * Shape Changer
 * Handles the Power “Shape Change” by delegating
 * to the SWADE Shape Changer macro pack.
 *
 * v.2.1.0
 * By SalieriC
 ******************************************/
import * as SWIM from '../constants.js';
import { socket } from "../init.js";

export async function shape_changer_script(data) {
  // Gather token & actor
  const { speaker, character, actor, token, item } = await swim.get_data_variables(data, false);
  if (!token || canvas.tokens.controlled.length > 1) {
    ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
    return;
  }

  // Make sure the Shape Changer macro is imported into the world
  const macro = game.macros.find(m => m.name === "SWADE Shape Changer");
  if (!macro) {
    ui.notifications.error("Please install & import the SWADE Shape Changer macro pack.");
    return;
  }

  // Prompt the user for the form to change into
  const presets = swim.get_folder_content("Shape Changer Forms")
    .filter(p => p.permission >= 1);
  const options = presets.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  const content = `
    <p>${game.i18n.localize("SWIM.dialogue-shapeChangerPrompt")}</p>
    <div class="form-group">
      <label for="scForm">${game.i18n.localize("SWIM.label-SelectForm")}:</label>
      <select id="scForm">${options}</select>
    </div>
  `;

  new Dialog({
    title: game.i18n.localize("SWIM.dialogue-shapeChangerTitle"),
    content,
    buttons: {
      one: {
        icon: '<i class="fas fa-exchange-alt"></i>',
        label: game.i18n.localize("SWIM.button-ChangeShape"),
        callback: async (html) => {
          const formID = html.find('#scForm')[0].value;
          // Execute the Shape Changer macro, passing token & form actor ID
          await macro.execute({
            token: token,
            targetActorId: formID
          });
        }
      }
    },
    default: "one"
  }).render(true);
}

export async function shape_changer_gm(data) {
  // No GM‐side logic needed; the macro handles everything.
}
