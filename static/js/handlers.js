async function handleVisualizeStory() {
  const storyPrompt = $("#storyPrompt").val();
  const storyArc = $("#storyArc").val();
  const endingCount = parseInt($("#endingCount").val(), 1);

  if (!storyPrompt) {
    alert("Please enter a story prompt.");
    return;
  }

  $("#stage1").hide();
  $("#stage1b").show();

  // Show the spinner
  $("#loadingSpinner").show();
  $("#graphContainer").hide();

  try {
    const graph = await extractStoryGraph(storyPrompt, storyArc, endingCount);
    console.log(graph);
    const { nodes, edges } = graph;

    // Hide the spinner and show the graph
    $("#loadingSpinner").hide();
    $("#graphContainer").show();

    visualizeGraph(nodes, edges);
  } catch (error) {
    console.error("Error visualizing story graph:", error);

    $("#loadingSpinner").hide();

    // Show the error message in the modal
    $("#errorModalMessage").text(
      "Failed to visualize story graph: " + error.message
    );
    $("#errorModal").modal("show");

    $("#stage1").show();
    $("#stage1b").hide();
  }
}
async function handleShowDetail() {
  const validation = validateGraph(gNodes, gLinks);

  if (
    !validation.isAcyclic ||
    !validation.isConnected ||
    !validation.hasSingleStartNode
  ) {
    // Show error modal with the message
    $("#errorModalMessage").text(validation.message);
    $("#errorModal").modal("show");
    return;
  }

  // Show stage 2 and spinner
  $("#stage1b").hide();
  $("#stage1c").show();

  $("#loadingSpinner1c").show();
  $("#graphContainer1c").hide();

  try {
    await fetchEntityData();
    setJson(currentOriginalJSON);
    
    // Show the enriched graph
    visualizeGraph(gNodes, gLinks, true);

  } catch (err) {
    console.error("Failed to enriching entities:", err);
    alert("An error occurred while enriching entities.");
  } finally {
    // Always hide the spinner
    $("#loadingSpinner1c").hide();
    $("#graphContainer1c").show();
  }

}
// 

let debugV = {};
async function handleProceedToSpriteSelection() {
  
  $("#stage1c").hide();
  $("#stage2").show();
  const charactersList = $("#charactersList");
  charactersList.empty();
  $("#loadingSpinner2").show();

  try {
    const characters = extractEntitiesFromResult();
    displayCharacters(characters);
  } catch (err) {
    console.error("Failed to extract characters:", err);
    alert("An error occurred while extracting characters.");
  } finally {
    // Always hide the spinner
    $("#loadingSpinner2").hide();
  }
}

function handleGenerateGame() {
  $("#stage2").hide();
  $("#stage3").show(); // Show Unity container (already present in #stage3)

  let updatedJson;
  try {
    updatedJson = injectSpritesIntoJson();
  } catch (err) {
    alert("Failed to generate game data: " + err.message);
    return;
  }

  fetch("/save_generated_json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedJson),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.status === "success") {
        console.log("Saved file URL:", result.fileUrl);

        // ✅ Unity game loads only after save is successful
        LoadUnityGame(); // Uses your existing loader logic
      } else {
        showError("Error saving game data: " + result.error);
        resetToInitialState();
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      alert("Error sending data to backend: " + error.message);
      resetToInitialState();
    });
}

function resetToInitialState() {
  $("#stage3").hide();
  $("#stage1").show();
  $("#storyPrompt").val("");
}

function showSuccess(msg) {
  alert(msg); // Customize if you have a styled toast/alert
}

function showError(msg) {
  alert(msg);
}

function handleJumpToGame() {
  $("#stage1, #stage1b, #stage2").hide();
  $("#stage3").show();
}
