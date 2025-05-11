function openSaveModal() {
  // Clear and show modal using Bootstrap's method
  $("#saveName").val("");
  $("#saveModal").modal("show");

  // Remove any previous click handlers to prevent stacking
  $("#saveModalBtn").off("click");

  // Add new click handler
  $("#saveModalBtn").on("click", function () {
    const name = $("#saveName").val().trim();

    if (!name) {
      alert("Please enter a name for your save.");
      return;
    }

    fetch("/save_named_game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Game saved successfully.");
          $("#saveModal").modal("hide");
          loadSavedGameList();
        } else {
          alert("Failed to save game: " + (data.error || "Unknown error."));
        }
      });
  });
}

function closeSaveModal() {
  $("#saveModal").modal("hide");
}

function saveNamedGame() {
  const name = document.getElementById("saveName").value.trim();
  if (!name) {
    alert("Please enter a name for your save.");
    return;
  }

  fetch("/save_named_game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Game saved successfully.");
        closeSaveModal();
        loadSavedGameList(); // Refresh the dropdown
      } else {
        alert("Failed to save game: " + (data.error || "Unknown error."));
      }
    });
}

function loadSavedGameList() {
  fetch("/list_saved_games")
    .then((response) => response.json())
    .then((files) => {
      const select = document.getElementById("savedGamesSelect");
      select.innerHTML = "";
      files.forEach((file) => {
        const option = document.createElement("option");
        option.value = file;
        option.textContent = file.replace(".json", "");
        select.appendChild(option);
      });
    });
}

function loadSelectedGame() {
  const select = $("#savedGamesSelect");
  const filename = select.val();

  if (!filename) {
    const message = "Please select a saved game.";
    $("#errorModalMessage").text(message);
    $("#errorModal").modal("show");
    return;
  }

  fetch("/load_named_game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename: filename }), // Send the filename in the request body as JSON
  })
    .then((response) => {
      if (!response.ok) {
        // Handle non-200 status codes
        return response.json().then((errorData) => {
          const message =
            errorData.error || response.statusText || "Failed to load game.";
          $("#errorModalMessage").text(message);
          $("#errorModal").modal("show");
          throw new Error(message); // Prevent further execution
        });
      }
      return response.json();
    })
    .then((data) => {
      const message = "Game loaded successfully.";
      $("#errorModalMessage").text(message);
      $("#errorModal").modal("show");
    })
    .catch((error) => {
      const message = "Error occurred during loading game: " + error.message;
      $("#errorModalMessage").text(message);
      $("#errorModal").modal("show");
    });
}
