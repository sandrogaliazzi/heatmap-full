<script setup>
import { ref } from "vue";
import HubsoftClientPanel from "../CtoModalDialog/HubsoftClientPanel.vue";

const props = defineProps(["loading"]);

const osList = defineModel();
const emit = defineEmits(["saveTomodat"]);
const selected = ref([]);

const dialog = ref(false);
const cto = ref(false);
const ctoId = ref(null);
const selectedClient = ref(null);

const editCto = (item, value) => {
  cto.value = value;
  ctoId.value = item.id;
  dialog.value = true;
};

const saveCto = () => {
  const findCto = osList.value.find((item) => item.id === ctoId.value);
  findCto.cto = cto.value.toUpperCase();
  dialog.value = false;
};

const toggleAllSelection = () => {
  if (selected.value.length > 0) {
    selected.value = [];
  } else {
    selected.value = osList.value;
  }
};

const loadTomodat = () => {
  if (!selected.value.length) {
    alert("Selecione ao menos uma OS");
    return;
  }

  emit("saveTomodat", selected.value);
};

const headers = [
  { title: "Cliente", key: "client", align: "start" },
  { title: "Bairro", key: "bairro" },
  { title: "Cto", key: "cto" },
  { title: "descricao", key: "descricao", align: "end" },
  { title: "Tecnico", key: "tecnico", align: "end" },
  { title: "Marcar", key: "actions" },
];
</script>

<template>
  <v-sheet border rounded>
    <v-data-table :headers="headers" :items="osList">
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>
            <v-icon
              color="medium-emphasis"
              icon="mdi-book-multiple"
              size="x-small"
              start
            ></v-icon>

            Ativações
          </v-toolbar-title>
          <v-btn
            class="me-2"
            prepend-icon="mdi-plus"
            rounded="lg"
            :loading="props.loading"
            text="Carregar dados do tomodat"
            :disabled="props.loading"
            @click="loadTomodat"
            border
          ></v-btn>
          <v-btn @click="toggleAllSelection">todos</v-btn>
        </v-toolbar>
      </template>

      <template v-slot:item.cto="{ item, value }">
        <v-chip
          :text="value"
          border="thin opacity-25"
          prepend-icon="mdi-pencil"
          label
          @click="editCto(item, value)"
        >
          <template v-slot:prepend>
            <v-icon color="medium-emphasis"></v-icon>
          </template>
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="d-flex justify-center align-center">
          <v-checkbox-btn v-model="selected" :value="item"></v-checkbox-btn>
        </div>
      </template>

      <template v-slot:item.client="{ item, value }">
        <a
          href="#"
          @click.prevent="selectedClient = item"
          style="color: #208be3"
        >
          {{ value }}
          <hubsoft-client-panel
            v-model="selectedClient"
            @delete-client="return"
          />
        </a>
      </template>

      <template v-slot:item.descricao="{ item, value }">
        <v-btn variant="plain" color="primary" text="ver descricao">
          ver descricao
          <v-dialog activator="parent" width="350">
            <template v-slot:default="{ isActive }">
              <v-card
                title="Descrição"
                prepend-icon="mdi-book"
                color="grey-darken-4"
              >
                <v-card-text>
                  <p class="text-medium-emphasis text-body-2">Abertura</p>
                  <p>{{ value.abertura }}</p>
                  <v-divider class="my-4"></v-divider>
                  <p class="text-medium-emphasis text-body-2">Fechamento</p>
                  <p>{{ value.fechamento }}</p>
                </v-card-text>
                <template v-slot:actions>
                  <v-btn
                    class="ml-auto"
                    text="Fechar"
                    @click="isActive.value = false"
                  ></v-btn>
                </template>
              </v-card>
            </template>
          </v-dialog>
        </v-btn>
      </template>
    </v-data-table>
  </v-sheet>

  <v-dialog v-model="dialog" width="500">
    <v-sheet color="grey-darken-4">
      <v-container>
        <v-form class="d-flex align-center justify-center ga-3">
          <v-text-field
            label="CTO"
            v-model="cto"
            variant="underlined"
          ></v-text-field>
          <v-btn
            icon="mdi-content-save-outline"
            color="primary"
            @click="saveCto"
          ></v-btn>
          <v-btn icon="mdi-close" color="error" @click="dialog = false"></v-btn>
        </v-form>
      </v-container>
    </v-sheet>
  </v-dialog>
</template>
