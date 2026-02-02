<script setup>
import { ref, inject, onMounted, computed } from "vue";
import { useNotificationStore } from "@/stores/notification";
import fetchApi from "@/api";

const email = ref("");
const closeDialog = inject("closeDialog");
const formRef = ref(null);
const emailList = ref([]);
const notification = useNotificationStore();
const isLoading = ref(true);

const emailValidation = [
  (value) => {
    const pattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(value) || "Email invalido";
  },
];

const emailListFilter = computed(() => {
  return emailList.value.filter((e) =>
    e.email.includes(email.value.toLowerCase()),
  );
});

onMounted(async () => {
  const emails = await fetchApi("emailget");

  emailList.value = emails.data;

  isLoading.value = false;
});

const openWebMail = () => {
  return window.open("https://webmail.conectnet.net/logout/?locale=pt");
};

const createEmail = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    const response = await fetchApi.post("emailcadastro", {
      email: email.value,
    });
    if (response.status === 200) {
      notification.setNotification({
        status: "success",
        msg: "Email criado com sucesso",
      });
      emailList.value.push({ email: email.value });
    } else {
      notification.setNotification({
        status: "error",
        msg: "Erro ao criar Email, tente Novamente",
      });
    }
  }
};
</script>

<template>
  <v-card style="min-height: 600px" :loading="isLoading">
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Criar Email</p>
          <v-icon>mdi-email-plus</v-icon>
        </div>
        <div>
          <v-tooltip text="Abrir Webmail" location="start">
            <template v-slot:activator="{ props }">
              <v-btn
                variant="text"
                v-bind="props"
                icon="mdi-open-in-new"
                @click="openWebMail"
              ></v-btn>
            </template>
          </v-tooltip>
          <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
        </div>
      </div>
    </v-card-title>
    <v-card-text>
      <v-row justify="center" v-if="!isLoading">
        <v-col cols="12" class="fixed-column">
          <v-form ref="formRef" @submit.prevent="createEmail">
            <v-text-field
              variant="outlined"
              type="email"
              label="Criar ou pesquisar Email"
              v-model="email"
              :rules="emailValidation"
              single-line
            >
              <template #append>
                <v-btn
                  color="success"
                  icon="mdi-email-plus"
                  type="submit"
                ></v-btn>
              </template>
            </v-text-field>
          </v-form>
        </v-col>
        <v-col cols="12" class="scrollable-column">
          <v-list nav>
            <v-list-subheader>Lista de Emails</v-list-subheader>
            <div v-if="email && !emailListFilter.length">
              <v-list-item>
                <div
                  class="d-flex justify-center align-center text-center"
                  style="min-height: 500px"
                >
                  <div>
                    <v-icon size="200px"> mdi-email-search </v-icon>
                    <p class="text-center text-h5">
                      Nenhum resultado correspondente a {{ email }}
                    </p>
                  </div>
                </div>
              </v-list-item>
            </div>
            <div v-else>
              <v-list-item
                v-for="email in emailListFilter || emailList"
                :title="email.email"
                :value="email.email"
                :key="email.email"
                prepend-icon="mdi-email"
              ></v-list-item>
            </div>
          </v-list>
        </v-col>
      </v-row>
      <div
        style="height: 300px"
        class="d-flex justify-center align-center"
        v-else
      >
        <v-progress-circular
          color="orange"
          indeterminate
          :size="128"
          :width="6"
        ></v-progress-circular>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.fixed-column {
  position: sticky;
  top: 0;
}

.scrollable-column {
  max-height: 80vh; /* Set the maximum height for the scrollable column */
  overflow-y: auto; /* Enable vertical scrolling when content exceeds the max height */
}
</style>
