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
    const storyData = preprocessStory(prompt); // Assume this returns an array like in your example
    const graph = {
        nodes: [],
        edges: []
    };

    storyData.forEach(arc => {
        arc.nodes.forEach(node => {
            // Add the node
            graph.nodes.push({
                id: node.nodeID,
                label: node.storyline
            });

            // Add the edges
            node.nextNode.forEach(link => {
                graph.edges.push({
                    source: node.nodeID,
                    target: link.nodeID,
                    label: link.criteriaDescription || 'no criteria'
                });
            });
        });
    });

    return graph;
}

function preprocessStory(prompt) {

    return [
        {
            storyArc: "Rise-Fall-Rise",
            nodes: [
                {
                    nodeID: "1",
                    storyline: "Red leaves her colorful, folklore-rich village carrying a basket of herbal breads and sweet juniper wine for Grandmother, who lives deep in the Singing Pines—an ancient forest known for its whispering trees and time-bending paths.",
                    nextNode: [{ nodeID: "2", criteriaDescription: "no criteria" }]
                },
                {
                    nodeID: "2",
                    storyline: "Red meets a curious fox spirit who warns her: the forest paths are shifting today, and she should not talk to strangers. Red thanks the spirit and continues with caution.",
                    nextNode: [{ nodeID: "3", criteriaDescription: "talk to the fox spirit" }]
                },
                {
                    nodeID: "3",
                    storyline: "At a fork under a whispering tree, Red encounters a charming wolf dressed in a traveling cloak. The wolf asks where Red is headed and offers a 'shortcut' through the Duskroot Trail—a rarely used path said to echo past footsteps.",
                    nextNode: [
                        { nodeID: "4", criteriaDescription: "talk to the wolf" },
                        { nodeID: "5", criteriaDescription: "refuse to talk to the wolf and take the main trail" }
                    ]
                },
                {
                    nodeID: "4",
                    storyline: "Red trusts the wolf and takes the shortcut. The path disorients her, and strange forest illusions lure her into losing time. Meanwhile, the wolf reaches Grandmother’s cottage first.",
                    nextNode: [{ nodeID: "6", criteriaDescription: "no criteria" }]
                },
                {
                    nodeID: "5",
                    storyline: "Red takes the main trail, passing by a shrine with runes glowing faintly. She prays briefly, and an owl guardian gifts her a pine-sigil for protection.",
                    nextNode: [{ nodeID: "6", criteriaDescription: "talk to the owl guardian" }]
                },
                {
                    nodeID: "6",
                    storyline: "Red arrives at the cottage. The door is slightly ajar. The cottage smells faintly of juniper but something feels wrong. Grandmother's shawl is on the floor.",
                    nextNode: [
                        { nodeID: "7", criteriaDescription: "enter the cottage quietly" },
                        { nodeID: "8", criteriaDescription: "call out to Grandmother loudly" }
                    ]
                },
                {
                    nodeID: "7",
                    storyline: "Red sneaks in and sees the wolf in Grandmother’s clothing. She hides and notices Grandmother trapped under the bed.",
                    nextNode: [
                        { nodeID: "9", criteriaDescription: "free Grandmother while distracting the wolf" },
                        { nodeID: "10", criteriaDescription: "confront the wolf directly" }
                    ]
                },
                {
                    nodeID: "8",
                    storyline: "Red's loud voice alerts the wolf, who pounces. Red barely has time to scream before she’s trapped.",
                    nextNode: [{ nodeID: "10", criteriaDescription: "no criteria" }]
                },
                {
                    nodeID: "9",
                    storyline: "Red tosses a bread roll at the wolf, who turns, and pulls Grandmother free. Grandmother activates a protective hearth rune, and the wolf is expelled from the cottage in a burst of light.",
                    nextNode: [{ nodeID: "11", criteriaDescription: "no criteria" }]
                },
                {
                    nodeID: "10",
                    storyline: "The wolf overpowers Red and swallows both her and Grandmother. However, a nearby woodsman hears the commotion.",
                    nextNode: [{ nodeID: "12", criteriaDescription: "talk to the woodsman NPC" }]
                },
                {
                    nodeID: "11",
                    storyline: "With the wolf gone, Red and Grandmother enjoy the herbal breads in peace. The forest’s spirits bless Red for her bravery and cleverness.",
                    nextNode: []
                },
                {
                    nodeID: "12",
                    storyline: "The woodsman defeats the wolf, cuts open its belly, and saves Red and Grandmother. They sew the wolf’s belly with nettle thorns, ensuring he never harms another soul.",
                    nextNode: []
                }
            ]
        }
    ];
}


let svg, zoomLayer, simulation, initialized = false;

function visualizeGraph(nodes, links) {
    d3.select("#contextMenu").style("display", "none");

    const width = $('#graphContainer').width();
    const height = 500;

    if (!initialized) {
        svg = d3.select("#graphContainer")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background-color", "#222831");

        zoomLayer = svg.append("g");

        zoomLayer.append("g").attr("class", "edges");
        zoomLayer.append("g").attr("class", "edge-labels");
        zoomLayer.append("g").attr("class", "nodes");
        zoomLayer.append("g").attr("class", "node-labels");

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

        simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        svg.on("contextmenu", function (event) {
            if (event.target.tagName === "svg") {
                event.preventDefault();
                const [x, y] = d3.pointer(event, this);
                showContextMenu(event.pageX, event.pageY, [
                    {
                        label: "➕ Add Node",
                        action: () => {
                            const newId = Date.now().toString();
                            nodes.push({ id: newId, label: "New Node", x, y });
                            visualizeGraph(nodes, links);
                        }
                    }
                ]);
            }
        });

        d3.select("body").on("click", () => {
            d3.select("#contextMenu").style("display", "none");
        });

        initialized = true;
    }

    simulation.nodes(nodes);
    simulation.force("link").links(links);

    // ----- Links -----
    const link = zoomLayer.select("g.edges")
        .selectAll("line.link")
        .data(links, d => `${d.source.id}-${d.target.id}`);

    link.enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", "#393E46")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)")
        .merge(link);

    link.exit().remove();

    // ----- Edge Labels -----
    const edgeLabels = zoomLayer.select("g.edge-labels")
        .selectAll("text.edge-label")
        .data(links, d => `${d.source.id}-${d.target.id}`);

    edgeLabels.enter()
        .append("text")
        .attr("class", "edge-label")
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
        })
        .merge(edgeLabels)
        .text(d => d.label);;

    edgeLabels.exit().remove();

    // ----- Nodes -----
    const node = zoomLayer.select("g.nodes")
        .selectAll("circle.node")
        .data(nodes, d => d.id);

    node.enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", 15)
        .attr("fill", "#00ADB5")
        .call(drag(simulation))
        .on("click", (event, d) => {
            if (pendingConnection && pendingConnection !== d) {
                links.push({ source: pendingConnection.id, target: d.id, label: "New Link" });
                pendingConnection = null;
                visualizeGraph(nodes, links);
            } else {
                pendingConnection = null;
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
                            for (let i = links.length - 1; i >= 0; i--) {
                                if (links[i].source.id === d.id || links[i].target.id === d.id) {
                                    links.splice(i, 1);
                                }
                            }
                            visualizeGraph(nodes, links);
                        }
                    }
                }
            ]);
        })
        .merge(node);

    node.exit().remove();

    // ----- Node Labels -----
    const labels = zoomLayer.select("g.node-labels")
    .selectAll("text.node-label")
    .data(nodes, d => d.id);

    labels.enter()
        .append("text")
        .attr("class", "node-label")
        .attr("font-size", "12px")
        .attr("fill", "#EEEEEE")
        .attr("text-anchor", "middle")
        .style("pointer-events", "auto")  // Needed to capture mouse events
        .on("mouseover", function (event, d) {
            d3.select(this).text(d.label); // Show full label
        })
        .on("mouseout", function (event, d) {
            const shortLabel = d.label.length > 15 ? d.label.slice(0, 15) + "..." : d.label;
            d3.select(this).text(shortLabel); // Revert to truncated
        })
        .merge(labels)
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .text(d => d.label.length > 15 ? d.label.slice(0, 15) + "..." : d.label);

    labels.exit().remove();


    // ----- Ticking -----
    simulation.on("tick", () => {
        zoomLayer.selectAll("line.link")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        zoomLayer.selectAll("text.edge-label")
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2 - 5);

        zoomLayer.selectAll("circle.node")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        zoomLayer.selectAll("text.node-label")
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    simulation.alpha(1).restart();
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