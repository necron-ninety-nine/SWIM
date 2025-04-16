/*******************************************
 * Test and Support Macro
 * version v.0.2.1
 * Made and maintained by SalieriC#8263
 * Covered Edges:
 * - Elan
 * - Humiliate
 * - Menacing
 * - Reliable
 * - Retort
 * - Strong Willed
 ******************************************/
import { socket } from "../init.js";

export async function tester_script() {
  let { speaker, _, __, token } = await swim.get_macro_variables();
  const targets = Array.from(game.user.targets);
  const officialClass = await swim.get_official_class();

  if (!token) {
    ui.notifications.error(game.i18n.localize("SWIM.notification-selectSingleToken"));
    return;
  }

  // Present a basic test dialog
  // ... (dialog setup code unchanged) ...

  new Dialog({
    title: game.i18n.localize("SWIM.dialogue-testerTitle"),
    content: /* dialog HTML */,  
    buttons: {
      one: {
        label: game.i18n.localize("SWIM.button-test"),
        callback: async (html) => {
          const data = {
            tokenId: token.id,
            targetId: targets[0]?.id,
            sceneId: game.scenes.current.id,
            action: html.find('#action')[0].value,
            skillId: html.find('#skill')[0].value,
            supportedSkillId: html.find('#support')[0].value,
            roll: Number(html.find('#roll')[0].value),
            rollWithEdge: Number(html.find('#rollWithEdge')[0].value),
            bestRoll: Number(html.find('#bestRoll')[0].value),
            critFail: html.find('#critFail')[0].checked,
            totalBennies: html.find('#bennies')[0].value,
            edgeText: html.find('#edgeText')[0].value,
            selectedResult: html.find('#result')[0].value
          };

          // ▶️ Replace WarpGate notify with socket
          await socket.executeAsGM(tester_gm, data);
        }
      }
    },
    default: "one"
  }).render(true);
}

export async function tester_gm(data) {
  console.log(data);
  const tokenId = data.tokenId;
  const targetId = data.targetId;
  const sceneId = data.sceneId;
  const action = data.action;
  const skillId = data.skillId;
  const supportedSkillId = data.supportedSkillId;
  const roll = data.roll;
  const rollWithEdge = data.rollWithEdge;
  const bestRoll = data.bestRoll;
  const critFail = data.critFail;
  const totalBennies = data.totalBennies;
  const edgeTextToken = data.edgeText;
  const selectedResult = data.selectedResult;

  const scene = game.scenes.get(sceneId);
  const token = scene.tokens.find(t => t.id === tokenId);
  const targetToken = scene.tokens.find(t => t.id === targetId);

  // Execute your test logic here
  // e.g., apply conditions based on selectedResult

  ChatMessage.create({
    user: game.user.id,
    content: `Tester GM received data: <pre>${JSON.stringify(data, null, 2)}</pre>`
  });
}
