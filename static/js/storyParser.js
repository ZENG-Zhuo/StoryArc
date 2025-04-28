async function extractStoryGraph(storyDescription, storyArc, numEndings) {
  const storyData = await preprocessStory(storyDescription, storyArc, numEndings);
  const graph = { nodes: [], edges: [] };

  storyData.forEach((arc) => {
    arc.nodes.forEach((node) => {
      graph.nodes.push({ id: node.nodeID, label: node.storyline });
      node.nextNode.forEach((link) => {
        graph.edges.push({
          source: node.nodeID,
          target: link.nodeID,
          label: link.criteriaDescription || "no criteria",
        });
      });
    });
  });

  return graph;
}

async function preprocessStory(storyDescription, storyArc, numEndings) {
  try {
    const response = await fetch("/preprocess_story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storyDescription: storyDescription,
        storyArc: storyArc,
        numEndings: numEndings,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to preprocess story: " + response.statusText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error preprocessing story:", error);
    return []; // Return empty array on failure
  }
}
