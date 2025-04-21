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

function extractStoryGraph(prompt) {
    return {
        nodes: [
            { id: 'Start', label: 'The Beginning: A Quiet Village' },
            { id: 'CallToAdventure', label: 'Call to Adventure' },
            { id: 'Refusal', label: 'Refusal of the Call' },
            { id: 'Mentor', label: 'Meeting the Mentor' },
            { id: 'FirstThreshold', label: 'Crossing the First Threshold' },
            { id: 'Tests', label: 'Trials and Tests' },
            { id: 'Allies', label: 'Gaining Allies' },
            { id: 'Enemies', label: 'Facing Enemies' },
            { id: 'InnerConflict', label: 'Inner Conflict and Doubt' },
            { id: 'MajorTwist', label: 'Major Plot Twist' },
            { id: 'Climax', label: 'Final Showdown' },
            { id: 'Sacrifice', label: 'The Sacrifice' },
            { id: 'Resolution', label: 'Return Home Changed' },
            { id: 'SecretEnding', label: 'Secret Ending (Optional)' },
            { id: 'SideQuest1', label: 'Side Quest: The Lost Artifact' },
            { id: 'SideQuest2', label: 'Side Quest: Help the Villagers' }
        ],
        edges: [
            { source: 'Start', target: 'CallToAdventure', label: 'disrupted by' },
            { source: 'CallToAdventure', target: 'Refusal', label: 'causes hesitation' },
            { source: 'Refusal', target: 'Mentor', label: 'resolved by guidance' },
            { source: 'Mentor', target: 'FirstThreshold', label: 'leads to action' },
            { source: 'FirstThreshold', target: 'Tests', label: 'opens path to' },
            { source: 'Tests', target: 'Allies', label: 'results in bonds' },
            { source: 'Tests', target: 'Enemies', label: 'reveals opposition' },
            { source: 'Enemies', target: 'InnerConflict', label: 'provokes doubt' },
            { source: 'Allies', target: 'InnerConflict', label: 'bring hope' },
            { source: 'InnerConflict', target: 'MajorTwist', label: 'triggers' },
            { source: 'MajorTwist', target: 'Climax', label: 'builds to' },
            { source: 'Climax', target: 'Sacrifice', label: 'demands' },
            { source: 'Sacrifice', target: 'Resolution', label: 'results in' },
            { source: 'Resolution', target: 'SecretEnding', label: 'unlocks (if conditions met)' },
            { source: 'FirstThreshold', target: 'SideQuest1', label: 'optional path' },
            { source: 'Tests', target: 'SideQuest2', label: 'optional help' },
            { source: 'SideQuest1', target: 'MajorTwist', label: 'influences' },
            { source: 'SideQuest2', target: 'Allies', label: 'gains trust' }
        ]
    };
}


function visualizeGraph(nodes, links) {
    $('#graphContainer').empty();
    d3.select("#contextMenu").style("display", "none");

    const width = $('#graphContainer').width();
    const height = 500;
    let pendingConnection = null;

    const svg = d3.select("#graphContainer")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background-color", "#222831");

    const zoomLayer = svg.append("g");

    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
            zoomLayer.attr("transform", event.transform);
        });

    svg.call(zoom);

    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .attr("fill", "#EEEEEE")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = zoomLayer.append("g")
        .attr("stroke", "#393E46")
        .attr("stroke-width", 2)
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("marker-end", "url(#arrow)");

    const edgeLabels = zoomLayer.append("g")
        .selectAll("text")
        .data(links)
        .enter()
        .append("text")
        .text(d => d.label)
        .attr("font-size", "10px")
        .attr("fill", "#EEEEEE")
        .style("cursor", "pointer")
        .on("contextmenu", (event, d) => {
            event.preventDefault();
            showContextMenu(event.pageX, event.pageY, [
                {
                    label: "✏️ Edit Edge Label",
                    action: () => promptLabel(d, "label", () => visualizeGraph(nodes, links))
                },
                {
                    label: "🗑 Delete Edge",
                    action: () => {
                        const index = links.indexOf(d);
                        if (index !== -1) {
                            links.splice(index, 1);
                            visualizeGraph(nodes, links);
                        }
                    }
                }
            ]);
        });

    const node = zoomLayer.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 15)
        .attr("fill", "#00ADB5")
        .call(drag(simulation))
        .on("click", (event, d) => {
            if (pendingConnection) {
                if (pendingConnection !== d) {
                    links.push({
                        source: pendingConnection.id,
                        target: d.id,
                        label: "New Link"
                    });
                }
                pendingConnection = null;
                visualizeGraph(nodes, links);
            }
        })
        .on("contextmenu", (event, d) => {
            event.preventDefault();
            showContextMenu(event.pageX, event.pageY, [
                {
                    label: "✏️ Edit Node Label",
                    action: () => promptLabel(d, "label", () => visualizeGraph(nodes, links))
                },
                {
                    label: "🔗 Add Connection",
                    action: () => {
                        pendingConnection = d;
                    }
                },
                {
                    label: "🗑 Delete Node",
                    action: () => {
                        const nodeIndex = nodes.indexOf(d);
                        if (nodeIndex !== -1) {
                            nodes.splice(nodeIndex, 1);
                            links = links.filter(l => l.source.id !== d.id && l.target.id !== d.id);
                            visualizeGraph(nodes, links);
                        }
                    }
                }
            ]);
        });

    const labels = zoomLayer.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .text(d => d.label)
        .attr("font-size", "12px")
        .attr("fill", "#EEEEEE")
        .attr("text-anchor", "middle")
        .style("pointer-events", "none");

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        edgeLabels
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2 - 5);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    svg.on("contextmenu", function (event) {
        if (event.target.tagName === "svg") {
            event.preventDefault();
            const [x, y] = d3.pointer(event, this);
            showContextMenu(event.pageX, event.pageY, [
                {
                    label: "➕ Add Node",
                    action: () => {
                        const newId = Date.now().toString();
                        nodes.push({
                            id: newId,
                            label: "New Node",
                            x: x,
                            y: y
                        });
                        visualizeGraph(nodes, links);
                    }
                }
            ]);
        }
    });

    d3.select("body").on("click", () => {
        d3.select("#contextMenu").style("display", "none");
    });

    function drag(simulation) {
        return d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    function showContextMenu(x, y, items) {
        const menu = d3.select("#contextMenu");
        menu.html("");

        items.forEach(item => {
            menu.append("div")
                .style("padding", "4px 10px")
                .style("cursor", "pointer")
                .style("border-bottom", "1px solid #444")
                .text(item.label)
                .on("click", () => {
                    item.action();
                    menu.style("display", "none");
                });
        });

        menu.style("left", `${x}px`)
            .style("top", `${y}px`)
            .style("display", "block");
    }

    function promptLabel(target, field, onUpdate) {
        const input = d3.select("#graphContainer")
            .append("input")
            .attr("type", "text")
            .style("position", "absolute")
            .style("left", `${d3.event?.pageX || 100}px`)
            .style("top", `${d3.event?.pageY || 100}px`)
            .style("z-index", 1000)
            .node();

        input.value = target[field];
        input.focus();

        input.onblur = () => {
            target[field] = input.value;
            input.remove();
            onUpdate();
        };

        input.onkeydown = (e) => {
            if (e.key === "Enter") input.blur();
        };
    }
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