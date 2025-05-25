// const originalModel = {
//   NPCList: [
//     {
//       NPCName: "Grandma",
//       attack: 0,
//       description: "An elderly woman with a kind face...",
//       dialogue: [
//         "Is that you, dear? Come closer!",
//         "I've been waiting for your treats.",
//       ],
//       door: 0,
//       friend: true,
//       hasRangedAttack: false,
//       health: 20,
//     },
//     {
//       NPCName: "Disguised Wolf",
//       attack: 18,
//       description: "A shadowy figure...",
//       dialogue: [
//         "What big eyes you have, dear!",
//         "Come closer, I just want to give you a hug.",
//       ],
//       door: 1,
//       friend: false,
//       hasRangedAttack: false,
//       health: 50,
//     },
//   ],
//   doorList: [{ index: 8 }],
//   itemList: [
//     {
//       attack: 0,
//       description: "An intricately woven basket...",
//       health: 0,
//       itemName: "Basket of Treats",
//       pickable: false,
//     },
//   ],
//   tileData: { a: 1, b: 196, g: 228, r: 255 },
// };

let editedModel;
let onSaveF = null;

function openEditor(nodeEntity, onSave) {
  console.log("Opening editor for node entity:", nodeEntity);
  // Deep copy the model for editing
  editedModel = JSON.parse(JSON.stringify(nodeEntity));
  onSaveF = onSave; // Save reference to edit

  renderEditor();
  $("#nodeDetailsModal").modal("show");
}

function renderEditor() {
  const container = document.getElementById("nodeDetailsModalContent");
  container.innerHTML = "";

  const createInput = (labelText, value, onChange, type = "text") => {
    const div = document.createElement("div");
    div.className = "form-group";

    const label = document.createElement("label");
    label.textContent = labelText;

    let input;
    if (type === "boolean") {
      input = document.createElement("select");
      input.className = "form-control";
      ["true", "false"].forEach((optVal) => {
        const opt = document.createElement("option");
        opt.value = optVal;
        opt.textContent = optVal;
        if (String(value) === optVal) opt.selected = true;
        input.appendChild(opt);
      });
      input.onchange = (e) => onChange(e.target.value === "true");
    } else {
      input = document.createElement("input");
      input.className = "form-control";
      input.type = type;
      input.value = value;
      input.oninput = (e) =>
        onChange(type === "number" ? parseInt(e.target.value) : e.target.value);
    }

    div.appendChild(label);
    div.appendChild(input);
    return div;
  };

  const createListGroupWrapper = (title, onAdd) => {
    const wrapper = document.createElement("div");

    const header = document.createElement("div");
    header.className =
      "list-group-header d-flex justify-content-between align-items-center";
    header.innerHTML = `<span>${title}</span>`;
    if (onAdd) {
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-sm btn-outline-info";
      addBtn.textContent = "+ Add";
      addBtn.onclick = onAdd;
      header.appendChild(addBtn);
    }

    wrapper.appendChild(header);

    const group = document.createElement("ul");
    group.className = "list-group";
    wrapper.appendChild(group);

    return { wrapper, group };
  };

  // --- NPCs ---
  const { wrapper: npcWrapper, group: npcGroup } = createListGroupWrapper(
    "NPC List",
    () => {
      editedModel.NPCList.push({
        NPCName: "",
        attack: 0,
        description: "",
        dialogue: [],
        door: 0,
        friend: false,
        hasRangedAttack: false,
        health: 0,
      });
      renderEditor();
    }
  );

  editedModel.NPCList?.forEach((npc, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item";

    li.appendChild(createInput("Name", npc.NPCName, (v) => (npc.NPCName = v)));
    li.appendChild(
      createInput("Attack", npc.attack, (v) => (npc.attack = v), "number")
    );
    li.appendChild(
      createInput("Description", npc.description, (v) => (npc.description = v))
    );
    li.appendChild(
      createInput("Door", npc.door, (v) => (npc.door = v), "number")
    );
    li.appendChild(
      createInput("Friend", npc.friend, (v) => (npc.friend = v), "boolean")
    );
    li.appendChild(
      createInput(
        "Has Ranged Attack",
        npc.hasRangedAttack,
        (v) => (npc.hasRangedAttack = v),
        "boolean"
      )
    );
    li.appendChild(
      createInput("Health", npc.health, (v) => (npc.health = v), "number")
    );

    const { wrapper: dlgWrap, group: dlgGroup } = createListGroupWrapper(
      "Dialogue",
      () => {
        npc.dialogue.push("");
        renderEditor();
      }
    );
    dlgGroup.classList.add("list-group-scroll");

    npc.dialogue?.forEach((line, j) => {
      const dlgItem = document.createElement("li");
      dlgItem.className =
        "list-group-item d-flex justify-content-between align-items-center";

      const input = document.createElement("input");
      input.className = "form-control";
      input.value = line;
      input.oninput = (e) => (npc.dialogue[j] = e.target.value);

      const del = document.createElement("button");
      del.className = "btn btn-sm btn-danger";
      del.textContent = "Delete";
      del.onclick = () => {
        npc.dialogue.splice(j, 1);
        renderEditor();
      };

      dlgItem.appendChild(input);
      dlgItem.appendChild(del);
      dlgGroup.appendChild(dlgItem);
    });

    li.appendChild(dlgWrap);

    const delNpc = document.createElement("button");
    delNpc.className = "btn btn-sm btn-danger";
    delNpc.textContent = "Delete NPC";
    delNpc.onclick = () => {
      editedModel.NPCList.splice(i, 1);
      renderEditor();
    };
    li.appendChild(delNpc);

    npcGroup.appendChild(li);
  });

  container.appendChild(npcWrapper);

  // --- Items ---
  const { wrapper: itemWrapper, group: itemGroup } = createListGroupWrapper(
    "Item List",
    () => {
      editedModel.itemList.push({
        itemName: "",
        description: "",
        attack: 0,
        health: 0,
        pickable: false,
      });
      renderEditor();
    }
  );

  editedModel.itemList?.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item";

    li.appendChild(
      createInput("Item Name", item.itemName, (v) => (item.itemName = v))
    );
    li.appendChild(
      createInput(
        "Description",
        item.description,
        (v) => (item.description = v)
      )
    );
    li.appendChild(
      createInput("Attack", item.attack, (v) => (item.attack = v), "number")
    );
    li.appendChild(
      createInput("Health", item.health, (v) => (item.health = v), "number")
    );
    li.appendChild(
      createInput(
        "Pickable",
        item.pickable,
        (v) => (item.pickable = v),
        "boolean"
      )
    );

    const delItem = document.createElement("button");
    delItem.className = "btn btn-sm btn-danger";
    delItem.textContent = "Delete Item";
    delItem.onclick = () => {
      editedModel.itemList.splice(i, 1);
      renderEditor();
    };
    li.appendChild(delItem);

    itemGroup.appendChild(li);
  });

  container.appendChild(itemWrapper);

  // --- Doors ---
  const { wrapper: doorWrapper, group: doorGroup } = createListGroupWrapper(
    "Door List",
    () => {
      editedModel.doorList.push({ index: 0 });
      renderEditor();
    }
  );

  editedModel.doorList?.forEach((door, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item";

    li.appendChild(
      createInput("Index", door.index, (v) => (door.index = v), "number")
    );

    const delDoor = document.createElement("button");
    delDoor.className = "btn btn-sm btn-danger";
    delDoor.textContent = "Delete Door";
    delDoor.onclick = () => {
      editedModel.doorList.splice(i, 1);
      renderEditor();
    };

    li.appendChild(delDoor);
    doorGroup.appendChild(li);
  });

  container.appendChild(doorWrapper);

  // --- Tile Data ---
  const { wrapper: tileWrapper, group: tileGroup } = createListGroupWrapper(
    "Tile Data",
    null
  );
  const tileItem = document.createElement("li");
  tileItem.className = "list-group-item";

  const rgba = editedModel.tileData;
  const colorPreview = document.createElement("div");
  colorPreview.className = "tile-color-preview";
  colorPreview.style.backgroundColor = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  tileItem.appendChild(colorPreview);

  ["r", "g", "b", "a"].forEach((key) => {
    tileItem.appendChild(
      createInput(
        key.toUpperCase(),
        rgba[key],
        (v) => {
          rgba[key] = parseInt(v);
          colorPreview.style.backgroundColor = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
        },
        "number"
      )
    );
  });

  tileGroup.appendChild(tileItem);
  container.appendChild(tileWrapper);
}

function InitializeNodeEditor() {
  document
    .getElementById("nodeDetailsModalSaveBtn")
    .addEventListener("click", () => {
      console.log("Saving node...");
      console.log("Edited model:", editedModel);
      if (!onSaveF) {
        console.error("No current node entity reference to save to.");
        return;
      }
      onSaveF(JSON.parse(JSON.stringify(editedModel))); // Update the original node entity with edited model
      $("#nodeDetailsModal").modal("hide");
    });
}

function renderCharacterEditor(characterObj, onSave) {
  const modalHtml = `
  <div class="modal fade" id="characterModal" tabindex="-1" role="dialog" aria-labelledby="characterModalLabel" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content" style="background-color: #222831; color: #eeeeee;">
        <div class="modal-header">
          <h5 class="modal-title" id="characterModalLabel">Edit Character</h5>
          <button type="button" class="close text-light" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="characterName">Name</label>
            <input type="text" class="form-control custom-input" id="characterName" value="${characterObj.name}">
          </div>
          <div class="form-group">
            <label for="characterDescription">Description</label>
            <input type="text" class="form-control custom-input" id="characterDescription" value="${characterObj.description}">
          </div>
          <div class="form-group">
            <label for="characterAttack">Attack</label>
            <input type="number" class="form-control custom-input" id="characterAttack" value="${characterObj.attack}">
          </div>
          <div class="form-group">
            <label for="characterHealth">Health</label>
            <input type="number" class="form-control custom-input" id="characterHealth" value="${characterObj.health}">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline-light" data-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-info" id="saveCharacterBtn">Save</button>
        </div>
      </div>
    </div>
  </div>

  <style>
    .custom-input {
      background-color: #393e46;
      color: #eeeeee;
      border: 1px solid #00adb5;
    }
    .custom-input:focus {
      background-color: #393e46;
      color: #eeeeee;
      border: 1px solid #00adb5;
      box-shadow: none;
    }
  </style>
  `;

  // Remove old instance if it exists
  const oldModal = document.getElementById("characterModal");
  if (oldModal) oldModal.remove();

  // Append to body and show modal
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  $("#characterModal").modal("show");

  // Save handler
  document.getElementById("saveCharacterBtn").addEventListener("click", () => {
    onSave({
      name: document.getElementById("characterName").value,
      description: document.getElementById("characterDescription").value,
      attack: parseInt(document.getElementById("characterAttack").value),
      health: parseInt(document.getElementById("characterHealth").value),
    });

    $("#characterModal").modal("hide");
  });
}
