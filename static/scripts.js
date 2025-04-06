$(document).ready(function () {
    $('#generateCharacters').click(function () {
        const storyPrompt = $('#storyPrompt').val();
        if (!storyPrompt) {
            alert('Please enter a story prompt.');
            return;
        }

        const characters = extractCharacters(storyPrompt);
        displayCharacters(characters);
        $('#stage1').hide();
        $('#stage2').show();
    });

    $('#generateGame').click(function () {
        $('#stage2').hide();
        $('#stage3').show();
        setTimeout(() => {
            alert('Game generation complete!');
            $('#stage3').hide();
            $('#stage1').show();
            $('#storyPrompt').val('');
        }, 2000);
    });
});

function extractCharacters(storyPrompt) {
    return ['Character 1', 'Character 2', 'Character 3'];
}

function displayCharacters(characters) {
    const charactersList = $('#charactersList');
    charactersList.empty();

    characters.forEach(character => {
        const characterCard = $(`
            <div class="col-md-4 mb-4">
                <div class="card" style="background-color: #393E46; color: #EEEEEE;">
                    <div class="card-body">
                        <h5 class="card-title">${character}</h5>
                        <button class="btn btn-primary generateSprite">Generate Sprite</button>
                        <button class="btn btn-success regenerateSprite" style="display:none;">Regenerate Sprite</button>
                    </div>
                </div>
            </div>
        `);
        charactersList.append(characterCard);
    });

    $('.generateSprite').click(function () {
        $(this).hide();
        $(this).siblings('.regenerateSprite').show();
        alert('Sprite for ' + $(this).parent().find('h5').text() + ' is generated! (simulation)');
    });

    $('#generateGame').show();
}