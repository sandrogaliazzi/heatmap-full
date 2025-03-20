<script setup>
import { ref } from "vue";
import { useNotificationStore } from "@/stores/notification";

const { clients, notes, ctoId } = defineProps(["clients"]);
const emit = defineEmits(["adduser:location"]);
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

// const deleteClient = async (id) => {
//   if (confirm("deseja excluir este cliente?")) {
//     try {
//       const response = await fetchApi.delete(`deleteclientfromtomodat/${id}`);

//       console.log(response.data);
//     } catch (error) {
//       console.error("erro ao adicionar cliente " + error.message);
//     }
//   }
// };
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
          :color="client?.position?.value.lat ? 'green' : 'grey-lighten-1'"
          icon="mdi-map-marker-plus"
          variant="text"
          size="small"
          @click="emit('adduser:location', client)"
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
        <!-- <v-btn
          color="grey-lighten-1"
          icon="mdi-delete"
          variant="text"
          size="small"
          class="d-none d-md-flex"
          @click="deleteClient(client.id)"
        ></v-btn> -->
      </template>
    </v-list-item>
  </v-list>
</template>
