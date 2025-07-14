<script setup>
import { ref, defineModel } from "vue";
import DialogBox from "@/components/Dialog/Dialog.vue";
import ClientesOnuCard from "../ClientesOnuModalDialog/ClientesOnuCard.vue";
import { getHubClientFone } from "./hubApi";
import { getMkToken, getClientFone } from "@/api/mkApi.js";

const { sideBarCtoList, totalClients } = defineProps([
  "sideBar",
  "sideBarCtoList",
  "totalClients",
]);
const emit = defineEmits(["clearCtoList"]);
const sideBar = defineModel();

const openClientSignalModal = ref(false);

const removeParenthesis = (inputString) => {
  const startIndex = inputString.indexOf("(");
  if (startIndex !== -1) {
    const endIndex = inputString.indexOf(")", startIndex);
    if (endIndex !== -1) {
      return inputString.slice(0, startIndex).trim();
    }
  }
  return inputString;
};

const convertArrayOfObjectsToCSV = (array) => {
  const header = Object.keys(array[0]).join(",");
  const rows = array.map((obj) =>
    Object.values(obj)
      .map((value) => `"${value}"`)
      .join(",")
  );
  return `${header}\n${rows.join("\n")}`;
};

const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const extractClientsNamesFromCto = (clientsList) => {
  return clientsList
    .filter((cto) => Array.isArray(cto.clients))
    .map((cto) => cto.clients)
    .flat()
    .map((client) => removeParenthesis(client.name).trim());
};

const extractClientsFromCto = (clientsList) => {
  return clientsList
    .filter((cto) => Array.isArray(cto.clients))
    .map((cto) => cto.clients)
    .flat();
};

const getClientFoneFromHubsoft = async (clientsList) => {
  const clients = extractClientsNamesFromCto(clientsList);

  const promisseList = clients.map((client) => getHubClientFone(client));

  const foneList = await Promise.all(promisseList);

  const foneListFormatted = foneList.map((client) => ({
    numero: client.fone,
    nome: client.nome,
    mensagem: "",
  }));

  const csvContent = convertArrayOfObjectsToCSV(foneListFormatted);

  downloadCSV(csvContent, `data=${new Date().toLocaleDateString()}.csv`);
};

const getClientsFone = async () => {
  const clients = extractClientsNamesFromCto();

  const mkToken = await getMkToken();

  const promisseList = clients.map((client) => getClientFone(client, mkToken));

  const foneList = await Promise.all(promisseList);

  const foneListFormatted = foneList.flat().map((client) => ({
    numero: client.fone,
    nome: client.nome,
    mensagem: "",
  }));

  const csvContent = convertArrayOfObjectsToCSV(foneListFormatted);

  downloadCSV(csvContent, `data=${new Date().toLocaleDateString()}.csv`);
};

const closeSideBar = () => {
  sideBar.value = false;
  emit("clearCtoList");
};

const onCloseDialog = (value) => {
  openClientSignalModal.value = value;
};
</script>

<template>
  <DialogBox :isOpen="openClientSignalModal" @update:modalValue="onCloseDialog">
    <ClientesOnuCard :clients="extractClientsFromCto()"></ClientesOnuCard>
  </DialogBox>
  <v-navigation-drawer
    location="right"
    v-model="sideBar"
    permanent
    width="400"
    style="overflow-y: hidden"
  >
    <v-card variant="flat">
      <v-card-title
        class="mt-3 d-flex flex-column ga-2"
        v-if="sideBarCtoList.length > 0"
        style="position: sticky; top: 0"
      >
        <div class="d-flex justify-center">
          <v-btn
            rounded="xl"
            class="ml-2"
            color="success"
            prepend-icon="mdi-phone"
            @click="getClientFoneFromHubsoft(sideBarCtoList)"
            >IF-BOT</v-btn
          >
          <v-btn
            rounded="xl"
            class="ml-2"
            color="indigo"
            prepend-icon="mdi-flash"
            @click="openClientSignalModal = true"
            >Sinal</v-btn
          >
          <v-btn
            rounded="xl"
            class="ml-2"
            color="error"
            prepend-icon="mdi-close"
            @click="closeSideBar"
            >Sair</v-btn
          >
        </div>
        <div class="d-flex justify-center">
          <v-chip prepend-icon="mdi-cube" size="large" color="primary"
            >CTO {{ sideBarCtoList.length }}</v-chip
          >
          <v-chip
            prepend-icon="mdi-account"
            size="large"
            color="orange"
            class="ml-2"
            >CLIENTES {{ totalClients }}</v-chip
          >
        </div>
      </v-card-title>
      <v-card-text style="max-height: 80vh; overflow-y: auto">
        <v-list>
          <v-list-item v-for="cto in sideBarCtoList" :key="cto.id">
            <v-list-subheader inset>{{ cto.name }}</v-list-subheader>
            <v-list-item
              v-for="client in cto.clients"
              :title="client.name"
              :value="client.name"
              :key="client.id"
              rounded="xl"
            >
              <template #prepend>
                <v-icon icon="mdi-account"></v-icon>
              </template>
            </v-list-item>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>
</template>
