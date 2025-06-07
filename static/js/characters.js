// Global variable to hold the fetched entity-enriched structure
let currentOriginalJSON = null;

async function fetchEntityData(retry = 10) {
  const graphJson = exportGraphToJson(gNodes, gLinks);

  try {
    const response = await fetch("/generate_entities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphJson),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server returned an error:", errorData);
      const message =
        errorData.error || response.statusText || "Unknown error occurred.";
      $("#errorModalMessage").text(message);
      $("#errorModal").modal("show");
      return null;
    }

    const result = await response.json();
    currentOriginalJSON = result;

    console.log("Received entity-enriched structure:", result);

    // Check for bad doorList and retry if needed
    if (
      retry &&
      Array.isArray(result.levelList) &&
      result.levelList.length > 0 &&
      result.levelList[0].entity &&
      Array.isArray(result.levelList[0].entity.doorList) &&
      result.levelList[0].entity.doorList.length > 0 &&
      (result.levelList[0].entity.doorList[0].index === -1 ||
        result.levelList[0].entity.doorList[0].index === 0)
    ) {
      console.warn(
        "First level doorList is empty or invalid. Regenerating entities..."
      );
      return await fetchEntityData(retry - 1);
    }

    // Validate door indices
    const levelIndexSet = new Set(result.levelList.map((l) => l.levelIndex));
    for (const level of result.levelList) {
      if (level.entity.doorList && level.entity.doorList.length > 0) {
        for (const door of level.entity.doorList) {
          if (door.index !== -1) {
            if (
              !levelIndexSet.has(door.index) ||
              door.index === level.levelIndex
            ) {
              console.warn(
                `Invalid door index ${door.index} on level ${level.levelIndex}. Setting to -1.`
              );
              door.index = -1;
            }
          }
        }
      }
    }

    return result;
  } catch (err) {
    console.error("Request failed:", err);
    $("#errorModalMessage").text(
      "Failed to connect to entity generation service."
    );
    $("#errorModal").modal("show");
    return null;
  }
}

function extractEntitiesFromResult() {
  const entries = [];
  const result = currentOriginalJSON;
  if (!result) return entries;

  console.log("playerData", result.playerData);

  if (result.playerData) {
    entries.push({
      name: result.playerData.name || "Player",
      prompt: result.playerData.description || "No description.",
      type: "Player",
    });
  }

  if (Array.isArray(result.levelList)) {
    result.levelList.forEach((level) => {
      const entity = level.entity;
      if (!entity) return;

      if (Array.isArray(entity.NPCList)) {
        entity.NPCList.forEach((npc) => {
          entries.push({
            name: npc.NPCName,
            prompt: npc.description,
            type: "NPC",
          });
        });
      }

      if (Array.isArray(entity.itemList)) {
        entity.itemList.forEach((item) => {
          entries.push({
            name: item.itemName,
            prompt: item.description,
            type: "Item",
          });
        });
      }
    });
  }

  return entries;
}

const spriteMap = {};

function displayCharacters(characters) {
  const charactersList = $("#charactersList");
  charactersList.empty();

  const seenCharacters = new Set();

  characters.forEach((character) => {
    const key = `${character.type}:${character.name}:${character.description}`;

    if (seenCharacters.has(key)) return;
    seenCharacters.add(key);

    const typeIcons = {
      Player: "fa-solid fa-chess-knight",
      NPC: "fa-solid fa-user-ninja",
      Item: "fa-solid fa-gem",
    };

    const characterCard = $(`
  <div class="col-md-4 mb-4">
    <div class="card" style="background-color: #393E46; color: #EEEEEE;">
      <div class="card-body">
        <h5 class="card-title d-flex align-items-center justify-content-between">
          ${character.name}
          <span class="badge bg-secondary text-light">
            <i class="${
              typeIcons[character.type] || "fa-solid fa-question"
            } me-1"></i> 
            ${character.type}
          </span>
        </h5>

        <div class="form-group">
          <label class="form-label">Prompt</label>
          <textarea
            class="form-control custom-input mb-3 character-prompt-input"
            style="background-color: #222831; color: #EEEEEE; border: 1px solid #00ADB5; overflow:hidden; resize:none;"
            oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';"
          >${character.prompt}
          </textarea>
        </div>

        <button class="btn btn-primary generateSprite sprite-button" 
          data-name="${character.name}" 
          data-type="${character.type}" 
          data-prompt="${character.prompt}"
          data-description="${character.prompt}"
          >
          Generate Sprite
        </button>

        <button class="btn btn-success regenerateSprite" style="display:none;">Regenerate Sprite</button>

        <img src="" alt="${character.name} sprite" 
          style="display:none; width: 150px; height: 150px;" 
          class="sprite-image">

        <i class="fa-solid fa-spinner loading-icon" 
          style="display:none; font-size: 24px; color: #00ADB5;"></i>
      </div>
    </div>
  </div>
`);

    // Bind the onChange event to update the button's data-prompt attribute
    characterCard.find(".character-prompt-input").on("input", function () {
      const newPrompt = $(this).val();
      const cardBody = $(this).closest(".card-body");
      cardBody.find(".sprite-button").attr("data-prompt", newPrompt);
    });

    charactersList.append(characterCard);
    debugV.charactersList = charactersList;
  });

  $(".generateSprite").click(function () {
    const prompt = $(this)[0].dataset.prompt;
    const name = $(this)[0].dataset.name;
    const type = $(this)[0].dataset.type;
    const desc = $(this)[0].dataset.description;
    generateSprite(this, prompt, type, name, desc);
  });

  $(".regenerateSprite").click(function () {
    const button = $(this).siblings(".generateSprite");
    const prompt = button[0].dataset.prompt;
    const name = button[0].dataset.name;
    const type = button[0].dataset.type;
    const desc = button[0].dataset.description;
    generateSprite(this, prompt, type, name, desc);
  });

  $("#generateGame").show();
}

function generateSprite(button, prompt, type, name, description) {
  console.log("Generating sprite for:", prompt, type, name, description);
  const loadingIcon = $(button).siblings(".loading-icon");
  loadingIcon.show().addClass("fa-spin");

  fetch("/generate_image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Image generation failed: " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      loadingIcon.hide().removeClass("fa-spin");
      if (data.imageUrl) {
        const spriteImage = $(button).siblings(".sprite-image");
        spriteImage.attr("src", `/static/${data.imageUrl}`).show();

        // Unique key using type, name, and description
        const key = `${type}:${name}:${description}`;
        spriteMap[key] = data.imageUrl;

        if (!$(button).hasClass("regenerateSprite")) {
          $(button).hide();
          $(button).siblings(".regenerateSprite").show();
        }
      } else {
        $("#errorModalMessage").text(
          "Image generation failed: No image URL returned."
        );
        $("#errorModal").modal("show");
      }
    })
    .catch((error) => {
      loadingIcon.hide().removeClass("fa-spin");
      console.error("Error:", error);
      $("#errorModalMessage").text("An error occurred: " + error.message);
      $("#errorModal").modal("show");
    });
}

function injectSpritesIntoJson() {
  if (currentOriginalJSON) {
    const originalJson = currentOriginalJSON;

    // ✅ Inject player sprite
    if (originalJson.playerData) {
      const player = originalJson.playerData;
      const key = `Player:${player.name}:${player.description}`;
      if (spriteMap[key]) {
        player.spriteAddress = spriteMap[key];
      }
      if (player.description) {
        delete player.description; // Remove description if it exists
      }

      if (player.name) {
        delete player.name; // Remove name if it exists
      }
    }

    // ✅ Inject NPC and Item sprites
    for (const level of originalJson.levelList) {
      const entity = level.entity;
      level.doorList =
        entity.doorList && entity.doorList.length > 0
          ? entity.doorList
          : [{ index: -1 }];
      for (const door of level.doorList) {
        door.spriteAddress = "Sprites/Door";
      }
      level.tileData = entity.tileData
        ? {
            r: (entity.tileData.r || 0) / 255,
            g: (entity.tileData.g || 0) / 255,
            b: (entity.tileData.b || 0) / 255,
            a: entity.tileData.a || 1,
          }
        : {}; // Ensure tileData exists

      if (entity) {
        if (Array.isArray(entity.NPCList)) {
          level.NPCList = entity.NPCList;
          level.NPCList.forEach((npc) => {
            const key = `NPC:${npc.NPCName}:${npc.description}`;
            if (spriteMap[key]) {
              npc.spriteAddress = spriteMap[key];
            }
          });
        }

        if (Array.isArray(entity.itemList)) {
          level.itemList = entity.itemList;
          level.itemList.forEach((item) => {
            const key = `Item:${item.itemName}:${item.description}`;
            if (spriteMap[key]) {
              item.spriteAddress = spriteMap[key];
            }
          });
        }

        // Optionally delete the entity layer
        delete level.entity;
        if (level.nextLevel) {
          delete level.nextLevel;
        }
        if (level.storyArc) {
          delete level.storyArc;
        }
      }
    }

    return originalJson;
  }

  throw new Error("Not initialized!");
}
