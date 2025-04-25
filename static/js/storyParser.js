function extractStoryGraph(prompt) {
    const storyData = preprocessStory(prompt);
    const graph = { nodes: [], edges: [] };

    storyData.forEach(arc => {
        arc.nodes.forEach(node => {
            graph.nodes.push({ id: node.nodeID, label: node.storyline });
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
