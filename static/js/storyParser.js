async function extractStoryGraph(storyDescription, storyArc, numEndings) {
  const MAX_RETRY_COUNT = 3;
  let attempt = 0;

  while (attempt < MAX_RETRY_COUNT) {
    const storyData = await preprocessStory(
      storyDescription,
      storyArc,
      numEndings
    );

    const graph = { nodes: [], edges: [] };
    const nodeIdSet = new Set();

    // Build nodes
    storyData.levelList.forEach((level) => {
      graph.nodes.push({
        id: level.levelIndex,
        label: level.storyline,
        arc: level.storyArc,
      });
      nodeIdSet.add(level.levelIndex);
    });

    // Build edges
    let hasInvalidEdge = false;
    storyData.levelList.forEach((level) => {
      if (level.nextLevel && Array.isArray(level.nextLevel)) {
        level.nextLevel.forEach((next) => {
          if (next.index != -1) {
            if (!nodeIdSet.has(next.index)) {
              console.warn(
                `Invalid edge: target node ${next.index} not found.`
              );
              hasInvalidEdge = true;
            }
            graph.edges.push({
              source: level.levelIndex,
              target: next.index,
              label: next.criteriaDescription || "no criteria",
            });
          }
        });
      }
    });

    if (!hasInvalidEdge) {
      return graph;
    }

    attempt++;
    console.warn(
      `Graph validation failed. Retrying (${attempt}/${MAX_RETRY_COUNT})...`
    );
  }

  throw new Error(
    "Failed to generate a valid story graph after multiple attempts."
  );
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
