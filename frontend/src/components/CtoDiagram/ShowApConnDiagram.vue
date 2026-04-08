<template>
  <div class="ap-conn-diagram">
    <!-- Breadcrumb de navegação (task 6.1) -->
    <v-breadcrumbs
      v-if="navHistory.length > 1"
      :items="breadcrumbItems"
      class="diagram-breadcrumb"
    >
      <template #item="{ item, index }">
        <v-breadcrumbs-item
          :disabled="item.disabled"
          :style="item.disabled ? {} : { cursor: 'pointer' }"
          @click="!item.disabled && navigateBreadcrumb(index)"
        >
          {{ item.title }}
        </v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>

    <!-- Loading indicator -->
    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="orange"
      class="diagram-loading"
    />

    <!-- Error alert -->
    <v-alert
      v-if="errorMsg"
      type="error"
      closable
      class="diagram-error"
      @click:close="errorMsg = null"
    >
      {{ errorMsg }}
    </v-alert>

    <div
      :style="{
        width: diagram.canvas.width * zoomScale + 'px',
        height: diagram.canvas.height * zoomScale + 'px',
        flexShrink: 0,
      }"
    >
      <svg
        :viewBox="`0 0 ${diagram.canvas.width} ${diagram.canvas.height}`"
        :width="diagram.canvas.width"
        :height="diagram.canvas.height"
        :style="{
          transform: `scale(${zoomScale})`,
          transformOrigin: 'top left',
        }"
        class="diagram-svg"
      >
        <text
          :x="diagram.canvas.width / 2"
          y="34"
          text-anchor="middle"
          class="diagram-title"
        >
          {{ currentApName }}
        </text>

        <g class="links-layer">
          <path
            v-for="link in resolvedLinks"
            :key="link.id"
            :d="buildLinkPath(link)"
            :stroke="link.color"
            stroke-width="5"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>

        <g class="nodes-layer">
          <template v-for="node in diagram.nodes" :key="node.id">
            <g
              v-if="node.type !== 'client'"
              :transform="`translate(${node.x}, ${node.y})`"
            >
              <rect :width="nodeWidth" :height="node.height" class="node-box" />

              <rect
                :width="nodeWidth"
                :height="headerHeight"
                class="node-header"
              />

              <text x="12" y="22" class="node-title">
                {{ node.title }}
              </text>

              <text
                v-if="node.subtitle"
                :x="nodeWidth - 12"
                y="22"
                text-anchor="end"
                class="node-subtitle"
              >
                {{ node.subtitle }}
              </text>

              <g
                v-for="(port, index) in node.ports"
                :key="`${node.id}-${port}`"
              >
                <rect
                  x="0"
                  :y="headerHeight + index * rowHeight"
                  :width="nodeWidth"
                  :height="rowHeight"
                  :class="index % 2 === 0 ? 'row-light' : 'row-dark'"
                />

                <text
                  :x="getPortLabelX(node)"
                  :y="headerHeight + index * rowHeight + 18"
                  :text-anchor="getPortLabelAnchor(node)"
                  class="port-label"
                >
                  {{ getPortText(node, port) }}
                </text>

                <!-- task 3.1-3.3: slot note via foreignObject -->
                <foreignObject
                  v-if="node.slotLabelMap?.[port]"
                  :x="40"
                  :y="headerHeight + index * rowHeight"
                  :width="nodeWidth - 80"
                  :height="rowHeight"
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    :style="{
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      fontSize: '11px',
                      lineHeight: '1.2',
                      maxHeight: rowHeight + 'px',
                      color: '#444444',
                      textAlign: 'center',
                      padding: '4px 2px 0',
                    }"
                  >
                    {{ node.slotLabelMap[port] }}
                  </div>
                </foreignObject>
              </g>

              <!-- task 4.2-4.3: navigation button for cable nodes with nextAp -->
              <foreignObject
                v-if="node.nextAp?.id"
                x="0"
                :y="node.height - navButtonHeight"
                :width="nodeWidth"
                :height="navButtonHeight"
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 2px 4px;
                  "
                >
                  <button
                    class="nav-ap-btn"
                    @click="navigateToAp(node.nextAp.id, node.nextAp.name)"
                  >
                    → {{ node.nextAp.name }}
                  </button>
                </div>
              </foreignObject>
            </g>

            <g v-else :transform="`translate(${node.x}, ${node.y})`">
              <rect
                :width="clientBoxSize"
                :height="clientBoxSize"
                class="client-box"
              />
            </g>
          </template>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed, defineExpose, ref } from "vue";
import { mapApConn } from "./mapApConn";
import { useWindowSize } from "vue-window-size";
import fetchApi from "@/api";

const { width } = useWindowSize();

const zoomScale = ref(width.value < 600 ? 0.6 : 1);

const zoomOut = () => {
  zoomScale.value = Math.max(0.5, zoomScale.value - 0.1);
};

const zoomIn = () => {
  zoomScale.value = Math.min(10, zoomScale.value + 0.1);
};

const props = defineProps({
  connections: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: "Diagrama de conexões",
  },
});

// task 5.1: navigation history
const navHistory = ref([
  { apId: null, apName: props.title, connections: props.connections },
]);
// task 5.2: current index and derived connections
const currentIndex = ref(0);
const currentConnections = computed(
  () => navHistory.value[currentIndex.value].connections,
);
const currentApName = computed(
  () => navHistory.value[currentIndex.value].apName,
);

// task 5.5: use currentConnections instead of props.connections
const diagram = computed(() => mapApConn(currentConnections.value));

const nodeWidth = computed(() => diagram.value.canvas.nodeWidth);
const headerHeight = computed(() => diagram.value.canvas.headerHeight);
const rowHeight = computed(() => diagram.value.canvas.rowHeight);
const clientBoxSize = computed(() => diagram.value.canvas.clientBoxSize);
const navButtonHeight = computed(() => diagram.value.canvas.navButtonHeight);

const nodesById = computed(() => {
  return new Map(diagram.value.nodes.map((node) => [node.id, node]));
});

const resolvedLinks = computed(() => {
  return diagram.value.links
    .map((link) => ({
      ...link,
      sourceNode: nodesById.value.get(link.sourceId),
      targetNode: nodesById.value.get(link.targetId),
    }))
    .filter((link) => link.sourceNode && link.targetNode);
});

// task 5.3-5.4: fetch next AP and push to history
const isLoading = ref(false);
const errorMsg = ref(null);

const navigateToAp = async (apId, apName) => {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const response = await fetchApi.get("connections/" + apId);
    // Truncate forward history then push new entry
    navHistory.value = navHistory.value.slice(0, currentIndex.value + 1);
    navHistory.value.push({ apId, apName, connections: response.data });
    currentIndex.value++;
  } catch (e) {
    errorMsg.value =
      e?.response?.data?.message || e.message || "Erro ao carregar diagrama";
  } finally {
    isLoading.value = false;
  }
};

// task 6.1-6.2: breadcrumb items
const breadcrumbItems = computed(() =>
  navHistory.value.map((entry, index) => ({
    title: entry.apName,
    disabled: index === currentIndex.value,
    index,
  })),
);

// task 6.2-6.3: navigate breadcrumb (truncate forward history)
const navigateBreadcrumb = (index) => {
  navHistory.value = navHistory.value.slice(0, index + 1);
  currentIndex.value = index;
};

const getPortIndex = (node, port) => {
  return node.ports.findIndex((item) => item === port);
};

const getPortPoint = (node, port) => {
  if (node.type === "client") {
    return {
      x: node.x + clientBoxSize.value / 2,
      y: node.y,
    };
  }

  const portIndex = getPortIndex(node, port);
  const y =
    node.y +
    headerHeight.value +
    portIndex * rowHeight.value +
    rowHeight.value / 2;

  if (node.anchorSide === "right") {
    return {
      x: node.x + nodeWidth.value,
      y,
    };
  }

  if (node.anchorSide === "left") {
    return {
      x: node.x,
      y,
    };
  }

  return {
    x: node.x + nodeWidth.value / 2,
    y: node.y,
  };
};

// task 2.2-2.3: buildLinkPath with segment support for bicolor links
const buildLinkPath = (link) => {
  const start = getPortPoint(link.sourceNode, link.sourcePort);
  const end = getPortPoint(link.targetNode, link.targetPort);

  const sourceSide = link.sourceNode.side;
  const targetSide = link.targetNode.side;

  const isClientTarget = link.targetNode.type === "client";
  const isClientSource = link.sourceNode.type === "client";

  // CLIENTES — no segment splitting
  if (isClientTarget || isClientSource) {
    const splitterNode =
      link.sourceNode.type === "splitter" ? link.sourceNode : link.targetNode;

    const sourcePoint = link.sourceNode.type === "client" ? end : start;
    const targetPoint = link.targetNode.type === "client" ? end : start;

    const elbowX =
      splitterNode.side === "right" ? sourcePoint.x - 60 : sourcePoint.x + 60;

    const midY = targetPoint.y - 36;

    return [
      `M ${sourcePoint.x} ${sourcePoint.y}`,
      `L ${elbowX} ${sourcePoint.y}`,
      `L ${targetPoint.x} ${midY}`,
      `L ${targetPoint.x} ${targetPoint.y}`,
    ].join(" ");
  }

  // Arithmetic midpoint for bicolor segment split (task 2.3)
  const mid = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  // MESMO LADO
  if (sourceSide === targetSide) {
    const bendX =
      sourceSide === "left"
        ? Math.max(start.x, end.x) + 48
        : Math.min(start.x, end.x) - 48;

    const bendMid = { x: bendX, y: (start.y + end.y) / 2 };

    if (link.segment === "first") {
      return `M ${start.x} ${start.y} L ${bendX} ${start.y} L ${bendMid.x} ${bendMid.y}`;
    }
    if (link.segment === "second") {
      return `M ${bendMid.x} ${bendMid.y} L ${bendX} ${end.y} L ${end.x} ${end.y}`;
    }

    return [
      `M ${start.x} ${start.y}`,
      `L ${bendX} ${start.y}`,
      `L ${bendX} ${end.y}`,
      `L ${end.x} ${end.y}`,
    ].join(" ");
  }

  // LADOS OPOSTOS
  const startOffset = link.sourceNode.anchorSide === "right" ? 48 : -48;
  const endOffset = link.targetNode.anchorSide === "left" ? -48 : 48;

  if (link.segment === "first") {
    return `M ${start.x} ${start.y} L ${start.x + startOffset} ${start.y} L ${mid.x} ${mid.y}`;
  }
  if (link.segment === "second") {
    return `M ${mid.x} ${mid.y} L ${end.x + endOffset} ${end.y} L ${end.x} ${end.y}`;
  }

  return [
    `M ${start.x} ${start.y}`,
    `L ${start.x + startOffset} ${start.y}`,
    `L ${end.x + endOffset} ${end.y}`,
    `L ${end.x} ${end.y}`,
  ].join(" ");
};

const getPortLabelX = (node) => {
  return node.anchorSide === "right" ? nodeWidth.value - 10 : 10;
};

const getPortLabelAnchor = (node) => {
  return node.anchorSide === "right" ? "end" : "start";
};

const getPortText = (node, port) => {
  const percentage = node.splitterPortPercentages?.[port];
  return percentage ? `${port} (${percentage})` : port;
};

defineExpose({
  zoomIn,
  zoomOut,
  zoomScale,
});
</script>

<style scoped>
.ap-conn-diagram {
  width: 100%;
  overflow: auto;
  max-height: 100vh;
  overflow-x: auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #c4c4c4;
  padding: 12px;
  scrollbar-width: thin;
  box-sizing: border-box;
}

/* task 6.4: breadcrumb styling for gray background */
.diagram-breadcrumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 4px 12px;
  margin-bottom: 8px;
  width: 100%;
  max-width: 1280px;
  flex-shrink: 0;
}

.diagram-loading {
  width: 100%;
  max-width: 1280px;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.diagram-error {
  width: 100%;
  max-width: 1280px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.diagram-svg {
  display: block;
}

.diagram-title {
  fill: #111827;
  font-size: 24px;
  font-weight: 700;
}

.node-box {
  fill: #ffffff;
  stroke: #2f2f2f;
  stroke-width: 1.4;
}

.node-header {
  fill: #2f7db4;
}

.node-title,
.node-subtitle {
  fill: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.row-light {
  fill: #efefef;
}

.row-dark {
  fill: #e4e4e4;
}

.port-label {
  fill: #444444;
  font-size: 14px;
  font-weight: 500;
}

.client-box {
  fill: #5b5b5b;
  stroke: #5b5b5b;
}

/* task 4.2: navigation button style */
.nav-ap-btn {
  background: #1e40af;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.nav-ap-btn:hover {
  background: #2563eb;
}
</style>
