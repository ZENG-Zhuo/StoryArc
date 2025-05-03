let svg,
  zoomLayer,
  simulation,
  initialized = false;

function visualizeGraph(nodes, links) {
  d3.select("#contextMenu").style("display", "none");

  const width = $("#graphContainer").width();
  const height = 500;

  if (!initialized) {
    svg = d3
      .select("#graphContainer")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#222831");

    zoomLayer = svg.append("g");

    zoomLayer.append("g").attr("class", "edges");
    zoomLayer.append("g").attr("class", "edge-labels");
    zoomLayer.append("g").attr("class", "nodes");
    zoomLayer.append("g").attr("class", "node-labels");

    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        zoomLayer.attr("transform", event.transform);
      });

    svg.call(zoom);

    svg
      .append("defs")
      .append("marker")
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

    simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.id)
          .distance(150)
      )
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
            },
          },
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
  const link = zoomLayer
    .select("g.edges")
    .selectAll("line.link")
    .data(links, (d) => `${d.source.id}-${d.target.id}`);

  link
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", "#393E46")
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrow)")
    .merge(link);

  link.exit().remove();

  // ----- Edge Labels -----
  const edgeLabels = zoomLayer
    .select("g.edge-labels")
    .selectAll("text.edge-label")
    .data(links, (d) => `${d.source.id}-${d.target.id}`);

  edgeLabels
    .enter()
    .append("text")
    .attr("class", "edge-label")
    .text((d) => d.label)
    .attr("font-size", "10px")
    .attr("fill", "#EEEEEE")
    .style("cursor", "pointer")
    .on("contextmenu", (event, d) => {
      event.preventDefault();
      showContextMenu(event.pageX, event.pageY, [
        {
          label: "✏️ Edit Edge Label",
          action: () =>
            promptLabel(d, "label", () => visualizeGraph(nodes, links)),
        },
        {
          label: "🗑 Delete Edge",
          action: () => {
            const index = links.indexOf(d);
            if (index !== -1) {
              links.splice(index, 1);
              visualizeGraph(nodes, links);
            }
          },
        },
      ]);
    })
    .merge(edgeLabels)
    .text((d) => d.label);

  edgeLabels.exit().remove();

  // ----- Nodes -----
  const node = zoomLayer
    .select("g.nodes")
    .selectAll("circle.node")
    .data(nodes, (d) => d.id);

  const clickCallback = (event, d) => {
    if (pendingConnection && pendingConnection !== d) {
      links.push({
        source: pendingConnection.id,
        target: d.id,
        label: "New Link",
      });
      pendingConnection = null;
      visualizeGraph(nodes, links);
    } else {
      pendingConnection = null;
    }
  };
  const contextmenuCallback = (event, d) => {
    event.preventDefault();
    showContextMenu(event.pageX, event.pageY, [
      {
        label: "✏️ Edit Node Label",
        action: () =>
          promptLabel(d, "label", () => visualizeGraph(nodes, links)),
      },
      {
        label: "🔗 Add Connection",
        action: () => {
          pendingConnection = d;
        },
      },
      {
        label: "🗑 Delete Node",
        action: () => {
          const nodeIndex = nodes.indexOf(d);
          if (nodeIndex !== -1) {
            nodes.splice(nodeIndex, 1);
            for (let i = links.length - 1; i >= 0; i--) {
              if (
                links[i].source.id === d.id ||
                links[i].target.id === d.id
              ) {
                links.splice(i, 1);
              }
            }
            visualizeGraph(nodes, links);
          }
        },
      },
    ]);
  };

  node
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", 15)
    .attr("fill", "#00ADB5")
    .call(drag(simulation))
    .on("click", clickCallback)
    .on("contextmenu", contextmenuCallback)
    .merge(node);

  node.exit().remove();

  // ----- Node Labels -----
  const labels = zoomLayer
    .select("g.node-labels")
    .selectAll("text.node-label")
    .data(nodes, (d) => d.id);

  labels
    .enter()
    .append("text")
    .attr("class", "node-label")
    .attr("font-size", "12px")
    .attr("fill", "#EEEEEE")
    .attr("text-anchor", "middle")
    .style("pointer-events", "visiblePainted")
    .on("mouseover", function (event, d) {
      d3.select(this).text(d.label); // Show full label
    })
    .on("mouseout", function (event, d) {
      const shortLabel =
        d.label.length > 15 ? d.label.slice(0, 15) + "..." : d.label;
      d3.select(this).text(shortLabel); // Revert to truncated
    })
    .on("click", clickCallback)
    .on("contextmenu", contextmenuCallback)
    .merge(labels)
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .text((d) =>
      d.label.length > 15 ? d.label.slice(0, 15) + "..." : d.label
    );

  labels.exit().remove();

  // ----- Ticking -----
  simulation.on("tick", () => {
    zoomLayer
      .selectAll("line.link")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    zoomLayer
      .selectAll("text.edge-label")
      .attr("x", (d) => (d.source.x + d.target.x) / 2)
      .attr("y", (d) => (d.source.y + d.target.y) / 2 - 5);

    zoomLayer
      .selectAll("circle.node")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);

    zoomLayer
      .selectAll("text.node-label")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y);
  });

  simulation.alpha(1).restart();
}
