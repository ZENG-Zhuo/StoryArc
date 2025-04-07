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
    // Example logic - replace with your character extraction logic
    return [
        { name: "Character 1", prompt: "A brave knight with shining armor." },
        { name: "Character 2", prompt: "A cunning rogue with a mysterious past." },
        { name: "Character 3", prompt: "A wise wizard with a long beard." },
        { name: "The red", prompt: "Create an illustration of a young girl with a bright red cape, standing in a lush, enchanted forest. She has long, flowing hair and a curious expression." },
    ];
}

function displayCharacters(characters) {
    const charactersList = $('#charactersList');
    charactersList.empty();

    characters.forEach(character => {
        const characterCard = $(`
            <div class="col-md-4 mb-4">
                <div class="card" style="background-color: #393E46; color: #EEEEEE;">
                    <div class="card-body">
                        <h5 class="card-title">${character.name}</h5>
                        <p>${character.prompt}</p>
                        <button class="btn btn-primary generateSprite" data-prompt="${character.prompt}">Generate Sprite</button>
                        <button class="btn btn-success regenerateSprite" style="display:none;">Regenerate Sprite</button>
                        <img src="" alt="${character.name} sprite" style="display:none; width: 150px; height: 150px;" class="sprite-image">
                    </div>
                </div>
            </div>
        `);
        charactersList.append(characterCard);
    });

    // Generate sprite button click event
    $('.generateSprite').click(function () {
        const prompt = $(this).data('prompt');
        const characterName = $(this).parent().find('h5').text();
        generateSprite(this, prompt);
    });

    // Regenerate sprite button click event
    $('.regenerateSprite').click(function () {
        const prompt = $(this).siblings('.generateSprite').data('prompt');
        generateSprite(this, prompt);
    });

    $('#generateGame').show();
}

// Function to handle sprite generation
function generateSprite(button, prompt) {
    // Call the API to generate the image
    fetch('/generate_image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Image generation failed: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        if (data.imageUrl) {
            const spriteImage = $(button).siblings('.sprite-image');
            spriteImage.attr('src', data.imageUrl).show();
            if (!$(button).hasClass('regenerateSprite')) {
                $(button).hide(); // Hide the Generate Sprite button
                $(button).siblings('.regenerateSprite').show(); // Always show the Regenerate Sprite button
            }
        } else {
            alert('Image generation failed: No image URL returned.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while generating the image: ' + error.message);
    });
}