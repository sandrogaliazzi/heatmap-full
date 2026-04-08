const NODE_WIDTH = 260;
const HEADER_HEIGHT = 34;
const ROW_HEIGHT = 28;
const CLIENT_BOX_SIZE = 28;
const NAV_BUTTON_HEIGHT = 32;

const FIBER_COLORS = {
  1: "#00ff00",
  2: "#ffff00",
  3: "#e9e9e9",
  4: "#0000ff",
  5: "#ff0000",
  6: "#d98ce0",
  7: "#572a00",
  8: "#ffc8d9",
  9: "#000000",
  10: "#363636",
  11: "#ff7300",
  12: "#00eeff",
};

const SIDE_X = {
  left: 90,
  right: 930,
};

const BASE_Y = 80;
const BOTTOM_GAP = 42;

const getFiberColor = (fiber) => FIBER_COLORS[fiber] || "#2563eb";

const getConnType = (conn) => {
  if (conn.client_id != null) return "client";
  if (conn.splitter_id != null) return "splitter";
  if (conn.cable_id != null) return "cable";
  return "unknown";
};

const parseNextApName = (nextAp) => {
  if (!nextAp) return "";

  try {
    const parsed = typeof nextAp === "string" ? JSON.parse(nextAp) : nextAp;
    return parsed?.name || "";
  } catch {
    return "";
  }
};

const parseNextAp = (nextAp) => {
  if (!nextAp) return null;
  try {
    const parsed = typeof nextAp === "string" ? JSON.parse(nextAp) : nextAp;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
};

const getNodeTitle = (conn) => {
  if (conn.client_id != null) {
    return conn.client?.name || `CLIENTE ${conn.client_id}`;
  }

  if (conn.splitter_id != null) {
    return conn.splitter?.name
      ? `${conn.splitter.name} SPLITTER`
      : `SPLITTER ${conn.splitter_id}`;
  }

  if (conn.cable_id != null) {
    const nextApName = parseNextApName(conn.next_ap);
    const cableName = conn.cable?.name || "CABO";

    if (conn.side === "left") {
      return nextApName ? `Em direção a ${nextApName}` : "Cabo";
    }

    if (conn.side === "right") {
      return cableName;
    }
  }

  return `Conexão ${conn.id}`;
};

const getNodeSubtitle = (conn) => {
  if (conn.client_id != null) return "";

  if (conn.splitter_id != null) {
    return conn.side === "left"
      ? `SPLITTER ${conn.splitter?.name || conn.splitter_id}`
      : "";
  }

  if (conn.cable_id != null) {
    const nextApName = parseNextApName(conn.next_ap);
    const cableName = conn.cable?.name || "CABO";

    if (conn.side === "left") {
      return cableName;
    }

    if (conn.side === "right") {
      return nextApName ? `Em direção a ${nextApName}` : "";
    }
  }

  return "";
};

const extractFibersFromCableName = (name) => {
  if (!name) return 0;

  const match = name.match(/(\d+)\s*[Vv]/);
  return match ? Number(match[1]) : 0;
};

const getNodePorts = (conn) => {
  if (conn.client_id != null) return [1];

  if (conn.splitter_id != null) {
    const portsNumber = Number(conn.splitter?.ports_number || 8);
    return Array.from({ length: portsNumber + 1 }, (_, i) => i);
  }

  if (conn.cable_id != null) {
    const metadataFibers = Number(conn.cable?.cable_type?.number_fibers || 0);

    const nameFibers = extractFibersFromCableName(conn.cable?.name);

    const fusionFibers = [
      ...(conn.fusions_in || []).flatMap((f) => [f.fiber_in, f.fiber_out]),
      ...(conn.fusions_out || []).flatMap((f) => [f.fiber_in, f.fiber_out]),
    ].filter((n) => Number.isFinite(n));

    const maxFusionFiber = fusionFibers.length ? Math.max(...fusionFibers) : 0;

    const fibersCount = Math.max(metadataFibers, nameFibers, maxFusionFiber, 6);

    return Array.from({ length: fibersCount }, (_, i) => i + 1);
  }

  const fibers = [
    ...(conn.fusions_in || []).map((f) => f.fiber_in),
    ...(conn.fusions_out || []).map((f) => f.fiber_out),
  ];

  return [...new Set(fibers)].sort((a, b) => a - b);
};

const getSlotLabelMap = (conn) => {
  const map = {};

  for (const item of conn.connection_slot_notes || []) {
    map[item.slot_number] = item.note;
  }

  return map;
};

const getSplitterPortPercentages = (conn) => {
  if (conn.splitter_id == null || !conn.splitter) return {};

  const outFieldByPort = {
    1: "out_one",
    2: "out_two",
    3: "out_three",
    4: "out_four",
    5: "out_five",
    6: "out_six",
    7: "out_seven",
    8: "out_eight",
  };

  const portsNumber = Number(conn.splitter?.ports_number || 0);
  const result = {};

  for (let port = 1; port <= portsNumber; port += 1) {
    const field = outFieldByPort[port];
    const value = field ? Number(conn.splitter[field]) : NaN;

    if (Number.isFinite(value)) {
      result[port] = `${value}%`;
    }
  }

  return result;
};

const getNodeHeight = (node) => {
  if (node.type === "client") return CLIENT_BOX_SIZE;
  const base = HEADER_HEIGHT + node.ports.length * ROW_HEIGHT;
  return node.nextAp?.id ? base + NAV_BUTTON_HEIGHT : base;
};

const getVisualAnchorSide = (node) => {
  if (node.side === "left") return "right";
  if (node.side === "right") return "left";
  return "top";
};

const mergeConnectionData = (existing, incoming) => {
  if (!existing) return incoming;
  if (!incoming) return existing;

  return {
    ...existing,
    ...incoming,

    next_ap: incoming.next_ap || existing.next_ap,

    cable: incoming.cable ?? existing.cable,
    splitter: incoming.splitter ?? existing.splitter,
    client: incoming.client ?? existing.client,

    connection_slot_notes:
      (incoming.connection_slot_notes?.length ?? 0) >
      (existing.connection_slot_notes?.length ?? 0)
        ? incoming.connection_slot_notes
        : existing.connection_slot_notes,

    fusions_in:
      (incoming.fusions_in?.length ?? 0) > (existing.fusions_in?.length ?? 0)
        ? incoming.fusions_in
        : existing.fusions_in,

    fusions_out:
      (incoming.fusions_out?.length ?? 0) > (existing.fusions_out?.length ?? 0)
        ? incoming.fusions_out
        : existing.fusions_out,
  };
};

const collectAllConnections = (connections) => {
  const byId = new Map();

  const addConn = (conn) => {
    if (!conn) return;

    const existing = byId.get(conn.id);
    byId.set(conn.id, mergeConnectionData(existing, conn));
  };

  for (const conn of connections) {
    addConn(conn);

    for (const fusion of conn.fusions_in || []) {
      addConn(fusion.access_point_connection_in);
      addConn(fusion.access_point_connection_out);
    }

    for (const fusion of conn.fusions_out || []) {
      addConn(fusion.access_point_connection_in);
      addConn(fusion.access_point_connection_out);
    }
  }

  return [...byId.values()];
};

const getBottomOrderMap = (connections) => {
  const map = new Map();

  for (const conn of connections) {
    const fusions = [...(conn.fusions_in || []), ...(conn.fusions_out || [])];

    for (const fusion of fusions) {
      const inConn = fusion.access_point_connection_id_in;
      const outConn = fusion.access_point_connection_id_out;

      const source = connections.find((c) => c.id === inConn);
      const target = connections.find((c) => c.id === outConn);

      if (target?.client_id != null) {
        map.set(target.id, fusion.fiber_in);
      }

      if (source?.client_id != null) {
        map.set(source.id, fusion.fiber_out);
      }
    }
  }

  return map;
};

const buildNodes = (connections) => {
  const left = [];
  const right = [];
  const bottom = [];

  for (const conn of connections) {
    const node = {
      id: conn.id,
      raw: conn,
      type: getConnType(conn),
      side: conn.side,
      direction: conn.direction,
      drawSeq: conn.draw_seq ?? 999,
      title: getNodeTitle(conn),
      subtitle: getNodeSubtitle(conn),
      ports: getNodePorts(conn),
      slotLabelMap: getSlotLabelMap(conn),
      splitterPortPercentages: getSplitterPortPercentages(conn),
      nextAp: conn.cable_id != null ? parseNextAp(conn.next_ap) : null,
      x: 0,
      y: 0,
    };

    if (conn.side === "left") left.push(node);
    else if (conn.side === "right") right.push(node);
    else if (conn.side === "bottom") bottom.push(node);
  }

  const bottomOrderMap = getBottomOrderMap(connections);

  left.sort((a, b) => a.drawSeq - b.drawSeq);
  right.sort((a, b) => a.drawSeq - b.drawSeq);
  bottom.sort((a, b) => {
    const aOrder = bottomOrderMap.get(a.id) ?? 999;
    const bOrder = bottomOrderMap.get(b.id) ?? 999;
    return aOrder - bOrder;
  });

  const SIDE_VERTICAL_PADDING = 60;

  let currentLeftY = BASE_Y;
  left.forEach((node) => {
    node.x = SIDE_X.left;
    node.height = getNodeHeight(node);
    node.y = currentLeftY;
    node.anchorSide = getVisualAnchorSide(node);

    currentLeftY += node.height + SIDE_VERTICAL_PADDING;
  });

  let currentRightY = BASE_Y;
  right.forEach((node) => {
    node.x = SIDE_X.right;
    node.height = getNodeHeight(node);
    node.y = currentRightY;
    node.anchorSide = getVisualAnchorSide(node);

    currentRightY += node.height + SIDE_VERTICAL_PADDING;
  });

  // Compute dynamic bottom Y from the max bottom edge of side nodes + padding
  const sideNodes = [...left, ...right];
  const dynamicBottomY = sideNodes.length
    ? Math.max(...sideNodes.map((n) => n.y + n.height)) + 120
    : 660;

  const totalBottomWidth =
    bottom.length * CLIENT_BOX_SIZE +
    Math.max(0, bottom.length - 1) * BOTTOM_GAP;

  const bottomStartX = Math.max(300, (1000 - totalBottomWidth) / 2);

  bottom.forEach((node, index) => {
    node.x = bottomStartX + index * (CLIENT_BOX_SIZE + BOTTOM_GAP);
    node.y = dynamicBottomY;
    node.height = getNodeHeight(node);
    node.anchorSide = getVisualAnchorSide(node);
  });

  return [...left, ...right, ...bottom];
};

const getFusionKey = (fusion) => {
  return [
    fusion.id,
    fusion.access_point_connection_id_in,
    fusion.access_point_connection_id_out,
    fusion.fiber_in,
    fusion.fiber_out,
  ].join(":");
};

const extractAllFusions = (connections) => {
  const fusionMap = new Map();

  const addFusion = (fusion) => {
    if (!fusion) return;

    const key = getFusionKey(fusion);
    if (!fusionMap.has(key)) {
      fusionMap.set(key, fusion);
    }
  };

  for (const conn of connections) {
    for (const fusion of conn.fusions_in || []) {
      addFusion(fusion);
    }

    for (const fusion of conn.fusions_out || []) {
      addFusion(fusion);
    }
  }

  return [...fusionMap.values()];
};

const buildLinks = (rawConnections, allConnections, nodesById) => {
  const links = [];

  // 🔥 pega todas as conexões possíveis, inclusive as aninhadas
  const sourceConnections = [...rawConnections, ...allConnections];

  const allFusions = extractAllFusions(sourceConnections);

  for (const fusion of allFusions) {
    const sourceNode = nodesById.get(fusion.access_point_connection_id_in);
    const targetNode = nodesById.get(fusion.access_point_connection_id_out);

    if (!sourceNode || !targetNode) continue;

    const isClientLink =
      sourceNode.type === "client" || targetNode.type === "client";

    const colorIn = getFiberColor(fusion.fiber_in);
    const colorOut = getFiberColor(fusion.fiber_out);

    if (!isClientLink && colorIn !== colorOut) {
      // Bicolor: split into two half-path links
      links.push({
        id: `fusion-${fusion.id}-first`,
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        sourcePort: fusion.fiber_in,
        targetPort: fusion.fiber_out,
        color: colorIn,
        segment: "first",
        connectionType: fusion.connection_type,
        loss: fusion.loss,
        drawType: fusion.draw_type,
      });
      links.push({
        id: `fusion-${fusion.id}-second`,
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        sourcePort: fusion.fiber_in,
        targetPort: fusion.fiber_out,
        color: colorOut,
        segment: "second",
        connectionType: fusion.connection_type,
        loss: fusion.loss,
        drawType: fusion.draw_type,
      });
    } else {
      links.push({
        id: `fusion-${fusion.id}`,
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        sourcePort: fusion.fiber_in,
        targetPort: fusion.fiber_out,
        color: isClientLink ? "#1d4ed8" : colorIn,
        connectionType: fusion.connection_type,
        loss: fusion.loss,
        drawType: fusion.draw_type,
      });
    }
  }

  return links;
};

const getCanvasHeight = (nodes) => {
  if (!nodes.length) return 900;

  const maxBottom = Math.max(
    ...nodes.map((node) => {
      const nodeHeight = node.height || 0;
      return node.y + nodeHeight;
    }),
  );

  return Math.max(maxBottom + 120, 900);
};

export const mapApConn = (rawConnections = []) => {
  const allConnections = collectAllConnections(rawConnections);
  const nodes = buildNodes(allConnections);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const canvasHeight = getCanvasHeight(nodes);

  // 🔥 corrigido aqui
  const links = buildLinks(rawConnections, allConnections, nodesById);

  return {
    canvas: {
      width: 1280,
      height: canvasHeight,
      nodeWidth: NODE_WIDTH,
      headerHeight: HEADER_HEIGHT,
      rowHeight: ROW_HEIGHT,
      clientBoxSize: CLIENT_BOX_SIZE,
      navButtonHeight: NAV_BUTTON_HEIGHT,
    },
    nodes,
    links,
  };
};
