const currentOriginalJSON = null;

async function extractEntities() {
  const graphJson = exportGraphToJson(gNodes, gLinks); // assumes this function exists

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

    const entries = [];

    // ➕ Extract playerData
    if (result.playerData) {
      entries.push({
        name: result.playerData.name || "Player",
        prompt: result.playerData.description || "No description.",
        type: "Player",
      });
    }

    // Extract level entities
    if (Array.isArray(result.levelList)) {
      result.levelList.forEach((level) => {
        const entity = level.entity;

        // NPCs
        if (entity && Array.isArray(entity.NPCList)) {
          entity.NPCList.forEach((npc) => {
            entries.push({
              name: npc.NPCName,
              prompt: npc.description,
              type: "NPC",
            });
          });
        }

        // Items
        if (entity && Array.isArray(entity.itemList)) {
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
  } catch (err) {
    console.error("Request failed:", err);

    $("#errorModalMessage").text(
      "Failed to connect to entity generation service."
    );
    $("#errorModal").modal("show");

    return null;
  }
}

const spriteMap = {};

function displayCharacters(characters) {
  const charactersList = $("#charactersList");
  charactersList.empty();

  const seenCharacters = new Set();

  characters.forEach((character) => {
    const key = `${character.type}:${character.name}:${character.prompt}`; // prompt = description

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
            <p>${character.prompt}</p>
            <button class="btn btn-primary generateSprite" 
              data-prompt="${character.prompt}" 
              data-name="${character.name}" 
              data-type="${character.type}" 
              data-description="${character.prompt}">Generate Sprite</button>
            <button class="btn btn-success regenerateSprite" style="display:none;">Regenerate Sprite</button>
            <img src="" alt="${
              character.name
            } sprite" style="display:none; width: 150px; height: 150px;" class="sprite-image">
            <i class="fa-solid fa-spinner loading-icon" style="display:none; font-size: 24px; color: #00ADB5;"></i>
          </div>
        </div>
      </div>
    `);

    charactersList.append(characterCard);
  });

  $(".generateSprite").click(function () {
    const prompt = $(this).data("prompt");
    const name = $(this).data("name");
    const type = $(this).data("type");
    const desc = $(this).data("description");
    generateSprite(this, prompt, type, name, desc);
  });

  $(".regenerateSprite").click(function () {
    const button = $(this).siblings(".generateSprite");
    const prompt = button.data("prompt");
    const name = button.data("name");
    const type = button.data("type");
    const desc = button.data("description");
    generateSprite(this, prompt, type, name, desc);
  });

  $("#generateGame").show();
}

function generateSprite(button, prompt, type, name, description) {
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
        player.spriteUrl = spriteMap[key];
      }
    }

    // ✅ Inject NPC and Item sprites
    for (const level of originalJson.levelList) {
      const entity = level.entity;

      if (entity && Array.isArray(entity.NPCList)) {
        entity.NPCList.forEach((npc) => {
          const key = `NPC:${npc.NPCName}:${npc.description}`;
          if (spriteMap[key]) {
            npc.spriteUrl = spriteMap[key];
          }
        });
      }

      if (entity && Array.isArray(entity.itemList)) {
        entity.itemList.forEach((item) => {
          const key = `Item:${item.itemName}:${item.description}`;
          if (spriteMap[key]) {
            item.spriteUrl = spriteMap[key];
          }
        });
      }
    }

    return originalJson;
  }

  throw new Error("Not initialized!");
}
