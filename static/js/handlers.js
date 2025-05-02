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

async function handleProceedToSpriteSelection() {
  const validation = validateGraph();

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
  $("#stage2").show();
  $("#loadingSpinner2").show();

  try {
    const characters = await extractEntities();
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
  $("#stage3").show();
  setTimeout(() => {
    alert("Game generation complete!");
    $("#stage3").hide();
    $("#stage1").show();
    $("#storyPrompt").val("");
  }, 2000);
}
