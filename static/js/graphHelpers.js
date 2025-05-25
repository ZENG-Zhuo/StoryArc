function drag(simulation) {
  return d3
    .drag()
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

function showContextMenu(x, y, items, details = false) {
  const menu = details
    ? d3.select("#contextMenu1c")
    : d3.select("#contextMenu");
  menu.html("");

  items.forEach((item) => {
    menu
      .append("div")
      .style("padding", "4px 10px")
      .style("cursor", "pointer")
      .style("border-bottom", "1px solid #444")
      .text(item.label)
      .on("click", () => {
        item.action();
        menu.style("display", "none");
      });
  });

  menu.style("left", `${x}px`).style("top", `${y}px`).style("display", "block");
}

function promptLabel(target, field, onUpdate) {
  const currentValue = target[field];
  $("#customModalInput").val(currentValue);
  $("#customModal").modal("show");

  // Clear previous handler
  $("#saveModalBtn").off("click");

  $("#saveModalBtn").on("click", function () {
    const newValue = $("#customModalInput").val();
    target[field] = newValue;
    $("#customModal").modal("hide");
    onUpdate();
  });
}

function exportGraphToJson(nodes, edges) {
  const levelMap = new Map();

  // Create level objects with default arc as "Rise" if missing
  nodes.forEach((node) => {
    levelMap.set(node.id, {
      storyArc: node.arc || "Rise",
      levelIndex: node.id,
      storyline: node.label,
      nextLevel: [],
    });
  });

  // Add the nextLevel connections from edges
  edges.forEach((edge) => {
    const source = levelMap.get(edge.source.id);

    if (source) {
      source.nextLevel.push({
        criteriaDescription: edge.label,
        index: edge.target.id,
      });
    }
  });

  levelMap.values().forEach((level) => {
    // Remove the nextLevel property if it's empty
    if (level.nextLevel.length === 0) {
      level.nextLevel = [
        {
          criteriaDescription: "no criteria",
          index: -1,
        },
      ];
    }
  });

  return {
    levelList: Array.from(levelMap.values()),
  };
}
