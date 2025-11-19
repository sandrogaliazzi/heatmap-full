<script setup>
import fetchApi from "@/api";
import UserRegisterCard from "./UserRegisterCard.vue";
import DialogBox from "../Dialog/Dialog.vue";
import { ref, onMounted, computed } from "vue";

const users = ref([]);
const loginData = ref([]);

const user = ref({
  name: "",
  category: "adm",
  id: false,
});

const query = ref("");
const dialog = ref(false);

const onCloseDialog = (value) => (dialog.value = value);

const loadUsers = async () => {
  const response = await fetchApi("users");

  users.value = response.data;

  console.log(users.value);
};

onMounted(async () => {
  await loadUsers();
  fetchLogins();
  //console.log(loginData.value);
});

const fetchLogins = async () => {
  const logins = await fetchApi("logindataget");

  const loginsByUser = {};

  loginData.value = logins.data.reduce((_, current) => {
    if (loginsByUser[current.name]) {
      loginsByUser[current.name].loginCounter++;
    } else {
      loginsByUser[current.name] = { loginCounter: 1, lastDate: current.date };
    }

    return loginsByUser;
  });
};

const filteredUsers = computed(() => {
  return users.value.filter((user) =>
    user.name.includes(query.value.toLowerCase())
  );
});

const userIcon = computed(() => {
  return {
    tecnico: "mdi-tools",
    adm: "mdi-security",
    vendas: "mdi-handshake",
    convidado: "mdi-account",
  };
});

const editUser = (id) => {
  user.value = users.value.find((user) => user._id === id);

  dialog.value = true;
};

const cancelEdit = () => {
  user.value = {
    name: "",
    category: "adm",
    id: false,
  };

  dialog.value = false;
};

const deleteUser = async (id) => {
  if (confirm("deseja excluir este usuário?")) {
    try {
      await fetchApi.delete(`users/${id}`);
      alert("usuário deletado com sucesso");
      loadUsers();
    } catch (e) {
      console.log(e.message);
    }
  }
};
</script>

<template>
  <v-row justify="center">
    <DialogBox :isOpen="dialog" @update:modal-value="onCloseDialog">
      <UserRegisterCard
        :user="user"
        @update:user-name="(newValue) => (user.name = newValue)"
        @update:modal-dialog="cancelEdit"
        @update:user-list="loadUsers"
      />
    </DialogBox>
    <v-col cols="11" md="9" class="fixed-column">
      <v-form>
        <v-text-field
          variant="solo"
          label="Pesquisar Usuários"
          append-inner-icon="mdi-magnify"
          single-line
          hide-details
          append-icon="mdi-account-plus"
          @click:append="dialog = true"
          v-model="query"
        >
        </v-text-field>
      </v-form>
    </v-col>
    <v-col cols="12" md="10" class="scrollable-column">
      <v-list nav lines="three">
        <div v-if="query && !filteredUsers.length">
          <v-list-item>
            <div
              class="d-flex justify-center align-center text-center"
              style="min-height: 500px"
            >
              <div>
                <v-icon size="200px"> mdi-account-search </v-icon>
                <p class="text-center text-h5">
                  Nenhum resultado correspondente a {{ query }}
                </p>
              </div>
            </div>
          </v-list-item>
        </div>
        <div v-else>
          <v-list-item
            v-for="user in filteredUsers || users"
            :title="user.name.toUpperCase()"
            :value="user.name"
            :prepend-icon="userIcon[user.category]"
          >
            <v-list-item-subtitle class="mt-2">
              <p>{{ user.category }}</p>
            </v-list-item-subtitle>
            <template #append>
              <div class="d-none d-sm-flex">
                <v-btn
                  prepend-icon="mdi-update"
                  variant="tonal"
                  color="primary"
                  class="ma-2"
                  @click="editUser(user._id)"
                  >Editar</v-btn
                >
                <v-btn
                  prepend-icon="mdi-delete"
                  variant="tonal"
                  color="error"
                  @click="deleteUser(user._id)"
                  class="ma-2"
                  >Excluir</v-btn
                >
              </div>
              <div class="d-flex d-sm-none">
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      v-bind="props"
                    >
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      title="Editar"
                      value="Editar"
                      @click="editUser(user._id)"
                    />
                    <v-list-item
                      title="Excluir"
                      value="Excluir"
                      @click="deleteUser(user._id)"
                    />
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
        </div>
      </v-list>
    </v-col>
  </v-row>
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
