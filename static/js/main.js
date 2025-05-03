$(document).ready(function () {
  populateDropdown("storyArc", storyArcOptions);
  populateDropdown("endingCount", endingCountOptions);
  $("#visualizeStory").click(handleVisualizeStory);
  $("#proceedToCharacters").click(handleProceedToCharacters);
  $("#generateGame").click(handleGenerateGame);
});
