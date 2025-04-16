/*******************************************
 * Personal Health Centre
 * v.6.3.1
 * By SalieriC#8263; fixing bugs supported by FloRad#2142.
 * Potion usage inspired by grendel111111#1603;
 * asynchronous playback of sfx by Freeze#2689.
 ******************************************/
import { socket } from "../init.js";

export async function personal_health_centre_script() {
  const { speaker, _, __, token } = await swim.get_macro_variables();
  const target = Array.from(game.user.targets)[0];

  // Check selection / targeting
  if (!token || canvas.tokens.controlled.length > 1 || game.user.targets.size > 1) {
    ui.notifications.error(game.i18n.localize("SWIM.notification-selectOrTargetOneOrMoreTokens"));
    return;
  }
  const officialClass = await swim.get_official_class();

  // Present the “Heal Other” dialog
  if (token && target) {
    new Dialog({
      title: game.i18n.localize("SWIM.dialogue-healOther"),
      content: game.i18n.format("SWIM.dialogue.healOtherContent", { officialClass }),
      buttons: {
        one: {
          icon: '<i class="fas fa-heart"></i>',
          label: game.i18n.localize("SWIM.button-healOther"),
          callback: async (html) => {
            const method         = html.find("#method")[0].value;
            const combatHealing  = html.find("#combatHealing")[0].checked;
            const rating         = Number(html.find("#rating")[0].value) || 0;
            const data = {
              tokenID: token.id,
              targetID: target.id,
              method,
              rating,
              combatHealing
            };
            // ▶️ Replace WarpGate with socket
            await socket.executeAsGM(heal_other_gm, data);
          }
        }
      },
      default: "one"
    }).render(true);

  // Present the “Heal Self” dialog
  } else {
    new Dialog({
      title: game.i18n.localize("SWIM.dialogue-healSelf"),
      content: game.i18n.format("SWIM.dialogue.healSelfContent", { officialClass }),
      buttons: {
        one: {
          label: game.i18n.localize("SWIM.dialogue-healMyself"),
          callback: async () => healSelf(token, speaker)
        }
      },
      default: "one"
    }).render(true);
  }
}

export async function heal_other_gm(data) {
  const target    = canvas.tokens.get(data.targetID);
  const token     = canvas.tokens.get(data.tokenID);
  const tActor    = target.actor;
  const rating    = data.rating;
  const method    = data.method;
  const combat    = data.combatHealing;

  // (Your existing GM‑side healing logic continues unchanged…)

  // e.g.:
  await tActor.applyHealing(rating, { method, combat });
  ChatMessage.create({
    user: game.user.id,
    content: game.i18n.format("SWIM.chatMessage-healOtherSuccess", {
      tokenName: token.name, targetName: target.name, rating
    })
  });
}

export async function healSelf(token, speaker) {
  const rating = Math.max(token.actor.system.stats.toughness.roll().total, 1);
  await socket.executeAsGM(heal_self_gm, { tokenID: token.id, rating });
}

export async function heal_self_gm({ tokenID, rating }) {
  const token = canvas.tokens.get(tokenID);
  const actor = token.actor;
  await actor.applyHealing(rating, {});
  ChatMessage.create({
    user: game.user.id,
    content: game.i18n.format("SWIM.chatMessage-healSelf", {
      targetName: token.name, rating
    })
  });
}
