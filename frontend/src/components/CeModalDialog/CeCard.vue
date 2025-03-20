<script setup>
import { computed, ref } from "vue";

const { ce } = defineProps(["ce"]);
const clients = ref([]);
const emit = defineEmits(["newCtoSelected"]);

const groupedRows = computed(() => {
  let result = [];
  let final = [];
  let tempGroup = [];

  ce.sort((a, b) => {
    return a.draw_seq - b.draw_seq;
  });

  for (let i = 0; i < ce.length; i++) {
    if (ce[i].side === "left") {
      tempGroup.push(ce[i]);

      // Verifica se o próximo item é 'right'
      if (i + 1 < ce.length && ce[i + 1].side === "right") {
        tempGroup.push(ce[i + 1]);
        result.push(tempGroup);
        tempGroup = []; // Limpa o grupo temporário
        i++; // Avança mais um índice para pular 'right'
      } else {
        result.push(tempGroup);
        tempGroup = [];
      }
    } else if (ce[i].side === "right") {
      tempGroup.push(ce[i]);

      // Verifica se o próximo item é 'left'
      if (i + 1 < ce.length && ce[i + 1].side === "left") {
        tempGroup.push(ce[i + 1]);
        result.push(tempGroup.reverse());
        tempGroup = []; // Limpa o grupo temporário
        i++; // Avança mais um índice para pular 'left'
      } else {
        result.push(tempGroup);
        tempGroup = [];
      }
    } else {
      clients.value.push(ce[i]); // Se não for 'left' nem 'right', adiciona sozinho
    }
  }

  return result;
});

const getRowAligment = (row) => {
  if (row.length > 1) return "space-between";
  else if (row.length === 1 && row[0].side === "right") return "end";
  else if (row.length === 1 && row[0].side === "left") return "start";
  else return "center";
};

const getItemName = (item) => {
  if (item.cable != null) return item.cable.name;
  if (item.splitter != null) return item.splitter.name;
  else return item.client.name;
};

const getNextApData = (next_ap) => {
  const data = JSON.parse(next_ap);

  return data.name;
};

const fiberColor = {
  0: "",
  1: "green",
  2: "yellow",
  3: "white",
  4: "blue",
  5: "red",
  6: "violet",
  7: "brown",
  8: "pink",
  9: "black",
  10: "grey",
  11: "orange",
  12: "acqua",
};
</script>
<template>
  <v-card>
    <v-container>
      <template v-for="(row, i) in groupedRows" :key="i">
        <v-row :justify="getRowAligment(row)">
          <v-col v-for="(col, index) in row" :key="index" cols="4">
            <v-card class="pa-2 ma-2 bg-grey-darken-2">
              {{ getItemName(col) }}
              <v-card-text>
                <v-list v-if="col.connection_slot_notes.length > 0">
                  <v-list-item
                    v-for="note in col.connection_slot_notes"
                    :key="note.id"
                    ><span
                      :style="{
                        'font-size': 11 + 'px',
                        'border-left':
                          '4px solid ' + fiberColor[note.slot_number],
                      }"
                      >{{ note.note }}</span
                    ></v-list-item
                  >
                </v-list>
              </v-card-text>
              <v-card-actions v-if="col.next_ap">
                <div class="d-flex flex-column ga-2">
                  <span>Em Direção a</span>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    @click="emit('newCtoSelected', col.next_ap)"
                    >{{ getNextApData(col.next_ap) }}</v-btn
                  >
                </div>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>
      <v-row justify="center" v-if="clients.length > 0">
        <v-col cols="2" v-for="client in clients" :key="client.client_id">
          <v-sheet class="pa-2 bg-grey-darken-2 d-flex justify-center">
            <v-tooltip activator="parent" location="bottom">{{
              client.client.name
            }}</v-tooltip>
            <v-icon>mdi-account</v-icon>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
