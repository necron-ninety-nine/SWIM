/*******************************************
 * Craft Campfire
 * v.2.0.0
 * By SalieriC#8263
 ******************************************/
import { Portal } from "portal-lib";
import { socket } from "../init.js";

export async function craft_campfire_script() {
  // Get the campfire asset image from settings
  const campfireTextureLit = game.settings.get("swim", "campfireImgOn");

  // Use Portal crosshairs to pick a location
  const portal = await new Portal()
    .color("#ff0000")
    .texture(campfireTextureLit)
    .range(1)
    .pick();

  // Prepare data for the GM hook
  const data = {
    icon: campfireTextureLit,
    position: { x: portal.x, y: portal.y },
    scene: { _id: game.scenes.current._id }
  };

  // Execute the GM-side creation
  await socket.executeAsGM(craft_campfire_gm, data);

  // Notify if Monks Active Tiles is available
  if (game.modules.get("monks-active-tiles")?.active) {
    ui.notifications.notify(game.i18n.localize("SWIM.notification.campfireCreated"));
  }
}

export async function craft_campfire_gm(data) {
  const scene = game.scenes.get(data.scene._id);
  const size = scene.grid.size;
  const campfireTextureLit = game.settings.get("swim", "campfireImgOn");

  // --- Create Ambient Light ---
  const lightData = {
    x: data.position.x,
    y: data.position.y,
    rotation: 0,
    walls: true,
    vision: false,
    config: {
      alpha: 0.4, angle: 360, bright: 4, dim: 4.5,
      color: "#C98A76", coloration: 1, attenuation: 0.5,
      luminosity: 0.5, saturation: 0, contrast: 0, shadows: 0,
      animation: { type: "torch", speed: 5, intensity: 6, reverse: false },
      darkness: { min: 0, max: 1 }
    },
    hidden: false
  };
  const [light] = await scene.createEmbeddedDocuments("AmbientLight", [lightData]);

  // --- Create Ambient Sound ---
  const soundData = {
    path: "modules/swim/assets/sfx/Campfire-sound-altered-Alexander-www.orangefreesounds.com.ogg",
    x: data.position.x, y: data.position.y, radius: 4.5,
    easing: true, walls: true, volume: 0.75,
    darkness: { min: 0, max: 1 }, repeat: false, hidden: false
  };
  const [sound] = await scene.createEmbeddedDocuments("AmbientSound", [soundData]);

  // --- Create the Tile with Monks Active Tiles flags ---
  const mattFlags = {
    active: true, record: false, restriction: "all", controlled: "all",
    trigger: ["", "dblclick"], allowpaused: false, usealpha: true,
    pointer: true, pertoken: false, minrequired: 0, chance: 100,
    fileindex: 0, actions: [
      {
        action: "playsound",
        data: {
          audiofile: "modules/swim/assets/sfx/Fireball-Super-Quick-Whoosh-www.fesliyanstudios.com.ogg",
          audiofor: "all", volume: 1, loop: false, fade: 0,
          scenerestrict: true, prevent: false
        },
        id: randomID(16)
      },
      { action: "delete", data: { entity: { id: "tile", name: "This Tile" }, collection: "tiles" }, id: randomID(16) },
      { action: "delete", data: { entity: { id: `Scene.${data.scene._id}.AmbientLight.${light._id}`, name: `AmbientLight: ${light._id}` }, collection: "tiles" }, id: randomID(16) },
      { action: "delete", data: { entity: { id: `Scene.${data.scene._id}.AmbientSound.${sound._id}`, name: `AmbientSound: ${sound._id}` }, collection: "tiles" }, id: randomID(16) }
    ],
    files: []
  };
  const tileData = {
    texture: { src: campfireTextureLit, scaleX: 1, scaleY: 1, rotation: Math.floor(Math.random()*360) },
    x: data.position.x - (size/2), y: data.position.y - (size/2),
    width: size, height: size, overhead: false, z: 100,
    rotation: Math.floor(Math.random()*360), alpha: 1,
    hidden: false, locked: false, roof: false,
    occlusion: { mode: 1, alpha: 0, radius: null },
    video: { loop: true, autoplay: true, volume: 0 },
    flags: { "monks-active-tiles": mattFlags }
  };
  const [tile] = await scene.createEmbeddedDocuments("Tile", [tileData]);

  // --- Final SFX playback if tile created ---
  if (tile) {
    const volume = game.settings.get("swim", "defaultVolume");
    await swim.play_sfx("modules/swim/assets/sfx/Fireball-Super-Quick-Whoosh-www.fesliyanstudios.com.ogg", volume, true);

    if (!game.modules.get("monks-active-tiles")?.active) {
      ui.notifications.warn(game.i18n.localize("SWIM.notification.monksTileTriggersNotFound"));
      console.warn("SWIM Campfire works best with Monks Active Tiles; without it you must manually delete the tile, light, and sound.");
    }
  }
}
