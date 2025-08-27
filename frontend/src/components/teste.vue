<!-- src/components/DrawflowDemo.vue -->
<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import Drawflow from "drawflow";
import "drawflow/dist/drawflow.min.css";

const editorEl = ref(null);
let editor = null;

onMounted(() => {
  // instancia o editor no container
  editor = new Drawflow(editorEl.value);
  editor.reroute = true; // opcional: deixa as conexões com pontos de reroute
  editor.editor_mode = "edit";
  editor.start();

  // --- nó 1: Saudação (1 input / 1 output) ---
  const data1 = { text: "Olá 👋" };
  const html1 = `
    <div>
      <div class="title-box">Saudação</div>
      <div class="box">
        <p style="margin:6px 0;">Texto:</p>
        <input df-input name="text" type="text" value="${data1.text}" />
        <div style="margin-top:8px;">
          <button df-output>Enviar</button>
        </div>
      </div>
    </div>
  `;
  // name, inputs, outputs, x, y, class, data, html
  const id1 = editor.addNode(
    "saudacao",
    1,
    1,
    250,
    120,
    "saudacao",
    data1,
    html1
  );

  // --- nó 2: Console (1 input / 0 output) ---
  const data2 = { value: "" };
  const html2 = `
    <div>
      <div class="title-box">Console</div>
      <div class="box">
        <small>Recebe texto e loga no console</small>
        <input df-input name="value" type="text" placeholder="vai chegar algo..." />
      </div>
    </div>
  `;
  const id2 = editor.addNode(
    "console",
    1,
    0,
    550,
    120,
    "console",
    data2,
    html2
  );

  // conecta saída do nó 1 na entrada do nó 2
  editor.addConnection(id1, id2, "output_1", "input_1");

  // alguns eventos úteis pra depuração
  editor.on("nodeDataChanged", (id) => {
    const n = editor.getNodeFromId(id);
    console.log("nodeDataChanged:", id, n?.data);
  });
  editor.on("connectionCreated", (conn) => {
    console.log("connectionCreated:", conn);
  });
  editor.on("nodeCreated", (id) => console.log("nodeCreated:", id));
  editor.on("nodeRemoved", (id) => console.log("nodeRemoved:", id));

  // exemplo: exportar o fluxo atual (objeto JSON)
  console.log("Export flow:", editor.export());
});

onBeforeUnmount(() => {
  // a lib não expõe um destroy formal; removemos a ref
  editor = null;
});
</script>

<template>
  <div class="df-wrapper">
    <!-- container onde o Drawflow vai montar -->
    <div ref="editorEl" class="drawflow"></div>
  </div>
</template>

<style>
/* tamanho/limite do canvas */
.df-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

/* o container do editor precisa ter dimensões */
.drawflow {
  width: 100%;
  height: 70vh;
}

/* pequenos ajustes visuais opcionais */
.drawflow .title-box {
  font-weight: 600;
  padding: 8px 10px;
}
.drawflow .box {
  padding: 8px 10px 12px;
}
</style>
