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

function showContextMenu(x, y, items) {
  const menu = d3.select("#contextMenu");
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
