function handleGenerateCharacters() {
    const storyPrompt = $('#storyPrompt').val();
    if (!storyPrompt) {
        alert('Please enter a story prompt.');
        return;
    }

    $('#stage1').hide();
    $('#stage1b').show();

    const { nodes, edges } = extractStoryGraph(storyPrompt);
    visualizeGraph(nodes, edges);
}

function handleProceedToCharacters() {
    const storyPrompt = $('#storyPrompt').val();
    const characters = extractCharacters(storyPrompt);
    displayCharacters(characters);

    $('#stage1b').hide();
    $('#stage2').show();
}

function handleGenerateGame() {
    $('#stage2').hide();
    $('#stage3').show();
    setTimeout(() => {
        alert('Game generation complete!');
        $('#stage3').hide();
        $('#stage1').show();
        $('#storyPrompt').val('');
    }, 2000);
}
