function extractCharacters(storyPrompt) {
    return [
        { name: "Character 1", prompt: "A brave knight with shining armor." },
        { name: "Character 2", prompt: "A cunning rogue with a mysterious past." },
        { name: "Character 3", prompt: "A wise wizard with a long beard." },
        { name: "The red", prompt: "Create an illustration of a young girl with a bright red cape..." }
    ];
}

function displayCharacters(characters) {
    const charactersList = $('#charactersList');
    charactersList.empty();

    characters.forEach(character => {
        const card = $(`
            <div class="col-md-4 mb-4">
                <div class="card" style="background-color: #393E46; color: #EEEEEE;">
                    <div class="card-body">
                        <h5 class="card-title">${character.name}</h5>
                        <p>${character.prompt}</p>
                        <button class="btn btn-primary generateSprite" data-prompt="${character.prompt}">Generate Sprite</button>
                        <button class="btn btn-success regenerateSprite" style="display:none;">Regenerate Sprite</button>
                    </div>
                </div>
            </div>
        `);
        charactersList.append(card);
    });
}
