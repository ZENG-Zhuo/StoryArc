$(document).ready(function () {
    $('#generateCharacters').click(function () {
        const storyPrompt = $('#storyPrompt').val();
        if (!storyPrompt) {
            alert('Please enter a story prompt.');
            return;
        }

        // Story graph visualization stage
        $('#stage1').hide();
        $('#stage1b').show();

        const { nodes, edges } = extractStoryGraph(storyPrompt);
        visualizeGraph(nodes, edges);
    });

    $('#proceedToCharacters').click(function () {
        const storyPrompt = $('#storyPrompt').val();
        const characters = extractCharacters(storyPrompt);
        displayCharacters(characters);

        $('#stage1b').hide();
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

// Placeholder function
function extractStoryGraph(prompt) {
    // Replace this with your real graph extraction logic
    return {
        nodes: [
            { id: 'Start', label: 'Start of the Story' },
            { id: 'Conflict', label: 'Main Conflict' },
            { id: 'Climax', label: 'Climax' },
            { id: 'Resolution', label: 'Resolution' }
        ],
        edges: [
            { source: 'Start', target: 'Conflict', label: 'leads to' },
            { source: 'Conflict', target: 'Climax', label: 'escalates to' },
            { source: 'Climax', target: 'Resolution', label: 'resolves as' }
        ]
    };
}

// D3 force-directed graph
function visualizeGraph(nodes, links) {
    $('#graphContainer').empty(); // Clear any previous graph

    const svg = d3.select("#graphContainer")
        .append("svg")
        .attr("width", "100%")
        .attr("height", 500);

    const width = $('#graphContainer').width();
    const height = 500;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .attr("stroke", "#aaa")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line");

    const edgeLabels = svg.append("g")
        .selectAll("text")
        .data(links)
        .enter()
        .append("text")
        .text(d => d.label)
        .attr("font-size", "10px")
        .attr("fill", "#555");

    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 15)
        .attr("fill", "#007BFF")
        .call(drag(simulation));

    const labels = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .text(d => d.label)
        .attr("font-size", "12px")
        .attr("fill", "#fff")
        .attr("text-anchor", "middle")
        .attr("dy", 4);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        edgeLabels
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
}

function drag(simulation) {
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}


function extractCharacters(storyPrompt) {
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
                        <i class="fa-solid fa-spinner loading-icon" style="display:none; font-size: 24px; color: #00ADB5;"></i>
                    </div>
                </div>
            </div>
        `);
        charactersList.append(characterCard);
    });

    // Generate sprite button click event
    $('.generateSprite').click(function () {
        const prompt = $(this).data('prompt');
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
    const loadingIcon = $(button).siblings('.loading-icon');
    loadingIcon.show().addClass('fa-spin'); // Show and spin the loading icon

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
        loadingIcon.hide().removeClass('fa-spin'); // Hide and stop spinning the loading icon
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
        loadingIcon.hide().removeClass('fa-spin'); // Hide and stop spinning the loading icon on error
        console.error('Error:', error);
        alert('An error occurred while generating the image: ' + error.message);
    });
}