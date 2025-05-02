$(document).ready(function () {
  populateDropdown("storyArc", storyArcOptions);
  populateDropdown("endingCount", endingCountOptions);
  $("#visualizeStory").click(handleVisualizeStory);
  $("#proceedToSpriteSelection").click(handleProceedToSpriteSelection);
  $("#generateGame").click(handleGenerateGame);
});
