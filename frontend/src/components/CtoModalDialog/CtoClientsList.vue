<script setup>
import { ref, toRefs } from "vue";
import { useNotificationStore } from "@/stores/notification";
import fetchApi from "@/api";

const props = defineProps(["clients", "cto", "clientsWithLocation"]);

const { clients, cto, clientsWithLocation } = toRefs(props);

const emit = defineEmits(["adduser:location", "deleteUser", "open:location"]);
const selected = ref([]);

const notification = useNotificationStore();

const triggerNotification = (msg) => {
  notification.setNotification({
    msg,
    status: "success",
  });
};

const copyName = async (name) => {
  await navigator.clipboard.writeText(name);
  triggerNotification("Nome copiado!");
};

const copyNameWithHifen = async (name) => {
  let nameWithHifen = "";
  if (name.includes("(")) {
    nameWithHifen = name.split("(")[0].trim().replaceAll(" ", "-");
  } else {
    nameWithHifen = name.split(" ").join("-");
  }

  await navigator.clipboard.writeText(nameWithHifen);
  triggerNotification("Nome copiado!");
};

const findLocation = (client) =>
  clientsWithLocation.value.find((item) => item.name === client.name);

const handleClientLocation = (client) => {
  const location = findLocation(client);
  if (location) {
    emit("open:location", { lat: location.lat, lng: location.lng });
  } else emit("adduser:location", client);
};
const deleteClient = async (id) => {
  if (confirm("deseja excluir este cliente?")) {
    try {
      const response = await fetchApi.delete(`deleteclientfromtomodat/${id}`);

      if (response.status === 200) {
        triggerNotification("client excluido com sucesso!");
        emit("deleteUser");
      }
    } catch (error) {
      console.error("erro ao adicionar cliente " + error.message);
    }
  }
};
</script>

<template>
  <v-list density="compact" nav>
    <v-list-subheader>CLIENTES {{ clients.length }}</v-list-subheader>
    <v-list-item
      v-for="client in clients"
      :key="client.id"
      :value="client.name"
    >
      <v-list-item-title
        :class="{
          'text-decoration-line-through': selected.includes(client.id),
        }"
      >
        <span class="text-wrap">{{ client.name }}</span>
      </v-list-item-title>
      <template #prepend>
        <v-list-item-action start>
          <v-checkbox-btn
            v-model="selected"
            :value="client.id"
          ></v-checkbox-btn>
        </v-list-item-action>
      </template>
      <template #append>
        <v-btn
          :color="findLocation(client) ? 'green' : 'grey-lighten-1'"
          icon="mdi-map-marker-plus"
          variant="text"
          size="small"
          @click="handleClientLocation(client)"
        ></v-btn>
        <v-btn
          color="grey-lighten-1"
          icon="mdi-pen"
          variant="text"
          size="small"
          class="d-none d-md-flex"
          @click="copyName(client.name)"
        ></v-btn>
        <v-btn
          color="grey-lighten-1"
          icon="mdi-pen-minus"
          variant="text"
          size="small"
          class="d-none d-md-flex"
          @click="copyNameWithHifen(client.name)"
        ></v-btn>
        <v-btn
          color="grey-lighten-1"
          icon="mdi-delete"
          variant="text"
          size="small"
          class="d-none d-md-flex"
          v-role="['adm']"
          @click="deleteClient(client.id)"
        ></v-btn>
      </template>
    </v-list-item>
  </v-list>
</template>
