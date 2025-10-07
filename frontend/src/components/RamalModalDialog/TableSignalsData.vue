<script setup>
import { ref } from "vue";

defineProps({
  data: Array,
});

const search = ref("");
const headers = [
  {
    align: "start",
    key: "oltRamal",
    sortable: false,
    title: "Ramal",
  },
  { key: "rx", title: "Rx média" },
  { key: "tx", title: "Tx média" },
  { key: "oltName", title: "OLT" },
  { key: "data-table-expand", align: "end" },
];

function getSignalColor(signal) {
  if (signal >= -20) return "green";
  if (signal >= -29 && signal < -20) return "warning";
  if (signal < -29) return "red";
}

const copyName = (name) => {
  const formatedName = name.split("-").slice(1).join(" ").trim();
  navigator.clipboard.writeText(formatedName);
};
</script>

<template>
  <v-card title="Ramais" flat>
    <template v-slot:text>
      <v-text-field
        v-model="search"
        label="Pesquisar ramal"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
      ></v-text-field>
    </template>

    <v-data-table
      :headers="headers"
      :items="data"
      item-value="oltRamal"
      :search="search"
    >
      <template v-slot:item.rx="{ item }">
        <v-chip :color="getSignalColor(item.rx)">{{ item.rx }}</v-chip>
      </template>
      <template v-slot:item.tx="{ item }">
        <v-chip :color="getSignalColor(item.tx)">{{ item.tx }}</v-chip>
      </template>
      <template
        v-slot:item.data-table-expand="{
          internalItem,
          isExpanded,
          toggleExpand,
        }"
      >
        <v-btn
          :append-icon="
            isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
          "
          text="Mostrar Clientes"
          class="text-none"
          color="medium-emphasis"
          size="small"
          variant="text"
          border
          slim
          @click="toggleExpand(internalItem)"
        ></v-btn>
      </template>
      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="py-2">
            <v-sheet rounded="lg" border>
              <v-table density="compact">
                <tbody class="bg-surface-light">
                  <tr>
                    <th>alias</th>
                    <th>tx</th>
                    <th>rx</th>
                  </tr>
                </tbody>

                <tbody>
                  <tr v-for="client in item.clients" :key="client.alias">
                    <td class="py-2">
                      <div class="d-flex align-center ga-5">
                        <span>{{ client.alias }}</span>
                        <v-btn
                          size="x-small"
                          rounded="xl"
                          variant="outlined"
                          prepend-icon="mdi-pen"
                          text="copiar nome"
                          @click="copyName(client.alias)"
                        ></v-btn>
                      </div>
                    </td>
                    <td class="py-2">{{ client.tx }}</td>
                    <td class="py-2">{{ client.rx }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-sheet>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>
