$(document).ready(function () {
  populateDropdown("storyArc", storyArcOptions);
  populateDropdown("endingCount", endingCountOptions);
  $("#visualizeStory").click(handleVisualizeStory);
  $("#proceedToLevelDetail").click(handleShowDetail);
  $("#proceedToSpriteSelection").click(handleProceedToSpriteSelection);
  $("#generateGame").click(handleGenerateGame);
  $("#jumpToGame").click(handleJumpToGame);
  $("#showPlayer").click(handleShowPlayer);
  initUnity();
  InitializeNodeEditor();
});

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("savedGamesSelect")) {
    loadSavedGameList();
  }
});

const unityCanvas = document.getElementById("unity-canvas"); // or whatever your canvas ID is

document.addEventListener("keydown", function(e) {
  const active = document.activeElement;
  const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
  if (isTyping) {
    e.stopPropagation(); // prevent Unity from seeing the event
  }
});
