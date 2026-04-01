<template>
  <div class="ap-conn-diagram">
    <svg
      :viewBox="`0 0 ${diagram.canvas.width} ${diagram.canvas.height}`"
      :width="diagram.canvas.width"
      :height="diagram.canvas.height"
      class="diagram-svg"
    >
      <text
        :x="diagram.canvas.width / 2"
        y="34"
        text-anchor="middle"
        class="diagram-title"
      >
        {{ title }}
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
            <rect
              :width="nodeWidth"
              :height="node.height"
              class="node-box"
            />

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
                {{ port }}
              </text>

              <text
                v-if="node.slotLabelMap?.[port]"
                :x="nodeWidth / 2"
                :y="headerHeight + index * rowHeight + 18"
                text-anchor="middle"
                class="slot-note"
              >
                {{ node.slotLabelMap[port] }}
              </text>
            </g>
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
</template>

<script setup>
import { computed } from 'vue'
import { mapApConn } from './mapApConn'

const props = defineProps({
  connections: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: 'Diagrama de conexões',
  },
})

const diagram = computed(() => mapApConn(props.connections))

const nodeWidth = computed(() => diagram.value.canvas.nodeWidth)
const headerHeight = computed(() => diagram.value.canvas.headerHeight)
const rowHeight = computed(() => diagram.value.canvas.rowHeight)
const clientBoxSize = computed(() => diagram.value.canvas.clientBoxSize)

const nodesById = computed(() => {
  return new Map(diagram.value.nodes.map((node) => [node.id, node]))
})

const resolvedLinks = computed(() => {
  return diagram.value.links
    .map((link) => ({
      ...link,
      sourceNode: nodesById.value.get(link.sourceId),
      targetNode: nodesById.value.get(link.targetId),
    }))
    .filter((link) => link.sourceNode && link.targetNode)
})

const getPortIndex = (node, port) => {
  return node.ports.findIndex((item) => item === port)
}

const getPortPoint = (node, port) => {
  if (node.type === 'client') {
    return {
      x: node.x + clientBoxSize.value / 2,
      y: node.y,
    }
  }

  const portIndex = getPortIndex(node, port)
  const y =
    node.y +
    headerHeight.value +
    portIndex * rowHeight.value +
    rowHeight.value / 2

  if (node.anchorSide === 'right') {
    return {
      x: node.x + nodeWidth.value,
      y,
    }
  }

  if (node.anchorSide === 'left') {
    return {
      x: node.x,
      y,
    }
  }

  return {
    x: node.x + nodeWidth.value / 2,
    y: node.y,
  }
}

const buildLinkPath = (link) => {
  const start = getPortPoint(link.sourceNode, link.sourcePort)
  const end = getPortPoint(link.targetNode, link.targetPort)

  const sourceSide = link.sourceNode.side
  const targetSide = link.targetNode.side

  const isClientTarget = link.targetNode.type === 'client'
  const isClientSource = link.sourceNode.type === 'client'

  // CLIENTES
  if (isClientTarget || isClientSource) {
    const splitterNode =
      link.sourceNode.type === 'splitter' ? link.sourceNode : link.targetNode

    const sourcePoint =
      link.sourceNode.type === 'client' ? end : start
    const targetPoint =
      link.targetNode.type === 'client' ? end : start

    const elbowX =
      splitterNode.side === 'right'
        ? sourcePoint.x - 60
        : sourcePoint.x + 60

    const midY = targetPoint.y - 36

    return [
      `M ${sourcePoint.x} ${sourcePoint.y}`,
      `L ${elbowX} ${sourcePoint.y}`,
      `L ${targetPoint.x} ${midY}`,
      `L ${targetPoint.x} ${targetPoint.y}`,
    ].join(' ')
  }

  // MESMO LADO
  if (sourceSide === targetSide) {
    const bendX =
      sourceSide === 'left'
        ? Math.max(start.x, end.x) + 48
        : Math.min(start.x, end.x) - 48

    return [
      `M ${start.x} ${start.y}`,
      `L ${bendX} ${start.y}`,
      `L ${bendX} ${end.y}`,
      `L ${end.x} ${end.y}`,
    ].join(' ')
  }

  // LADOS OPOSTOS
  const startOffset = link.sourceNode.anchorSide === 'right' ? 48 : -48
  const endOffset = link.targetNode.anchorSide === 'left' ? -48 : 48

  return [
    `M ${start.x} ${start.y}`,
    `L ${start.x + startOffset} ${start.y}`,
    `L ${end.x + endOffset} ${end.y}`,
    `L ${end.x} ${end.y}`,
  ].join(' ')
}

const getPortLabelX = (node) => {
  return node.anchorSide === 'right' ? nodeWidth.value - 10 : 10
}

const getPortLabelAnchor = (node) => {
  return node.anchorSide === 'right' ? 'end' : 'start'
}
</script>

<style scoped>
.ap-conn-diagram {
  width: 100%;
  overflow: auto;
  max-height: 80vh;
  overflow-x: auto;
  overflow-y: auto;
  background: #c4c4c4;
  padding: 12px;
  scrollbar-width: thin;
  box-sizing: border-box;
}

.diagram-svg {
  display: block;
  min-width: 1200px;
  height: auto;
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

.slot-note {
  fill: #444444;
  font-size: 12px;
  font-weight: 500;
}

.client-box {
  fill: #5b5b5b;
  stroke: #5b5b5b;
}
</style>