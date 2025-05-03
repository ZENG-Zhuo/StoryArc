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

    // Hide the spinner
    $("#loadingSpinner").hide();
    $("#graphContainer").show();

    visualizeGraph(nodes, edges);
  } catch (error) {
    console.error("Error visualizing story graph:", error);
    $("#loadingSpinner").hide();
    alert("Failed to visualize story graph.");
  }
}

function handleProceedToCharacters() {
  const storyPrompt = $("#storyPrompt").val();
  const storyArc = $("#storyArc").val();
  const endingCount = parseInt($("#endingCount").val(), 10);

  const characters = extractCharacters(storyPrompt);
  displayCharacters(characters);

  console.log("Selected Story Arc:", storyArc);
  console.log("Number of Endings:", endingCount);

  $("#stage1b").hide();
  $("#stage2").show();
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
