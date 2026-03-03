<script setup>
import fetchApi from "@/api";
import UserRegisterCard from "./UserRegisterCard.vue";
import DialogBox from "../Dialog/Dialog.vue";
import { ref, onMounted, computed } from "vue";
import avatar from "@/assets/avatar.png";
import { useNotificationStore } from "@/stores/notification";

const notification = useNotificationStore();

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
    user.name.includes(query.value.toLowerCase()),
  );
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

const blockUser = async (id) => {
  if (confirm("deseja bloquear/desbloquear este usuário?")) {
    try {
      const response = await fetchApi.put(`user/block/${id}`);
      if (response.status === 200) {
        notification.setNotification({
          msg: "Usuário bloqueado/desbloqueado com sucesso",
          status: "success",
        });
      }
      loadUsers();
    } catch (e) {
      notification.setNotification({
        msg: "Erro ao bloquear/desbloquear usuário",
        status: "error",
      });
      console.log(e.message);
    }
  }
};

const revokeRefreshToken = async (id) => {
  if (confirm("deseja revogar o token de acesso deste usuário?")) {
    try {
      const response = await fetchApi.put(`user/revoke/${id}`);
      if (response.status === 200) {
        notification.setNotification({
          msg: "Token revogado com sucesso",
          status: "success",
        });
      }
    } catch (e) {
      console.log(e.message);
      notification.setNotification({
        msg: "Erro ao revogar token",
        status: "error",
      });
    }
  }
};

const revokeAllUsersTokens = async () => {
  if (confirm("deseja revogar os tokens de acesso de todos os usuários?")) {
    try {
      await Promise.all(
        users.value.map((user) => fetchApi.put(`user-revoke/${user._id}`)),
      );
      notification.setNotification({
        msg: "Tokens revogados com sucesso",
        status: "success",
      });
    } catch (e) {
      console.log(e.message);
      notification.setNotification({
        msg: "Erro ao revogar tokens",
        status: "error",
      });
    }
  }
};

const deleteUser = async (id) => {
  if (confirm("deseja excluir este usuário?")) {
    try {
      await fetchApi.delete(`users/${id}`);
      notification.setNotification({
        msg: "Usuário deletado com sucesso",
        status: "success",
      });
      loadUsers();
    } catch (e) {
      console.log(e.message);
      notification.setNotification({
        msg: "Erro ao deletar usuário",
        status: "error",
      });
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
      <v-btn
        @click="revokeAllUsersTokens"
        color="warning"
        variant="tonal"
        block
        class="my-4"
        >Revogar todos os tokens</v-btn
      >
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
            :prepend-avatar="user.avatar || avatar"
          >
            <v-list-item-subtitle class="mt-2">
              <p>{{ user.category }}</p>
            </v-list-item-subtitle>
            <template #append>
              <div class="d-flex">
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
                      prepend-icon="mdi-update"
                      @click="editUser(user._id)"
                    />
                    <v-list-item
                      title="Excluir"
                      value="Excluir"
                      prepend-icon="mdi-delete"
                      @click="deleteUser(user._id)"
                    />
                    <v-list-item
                      prepend-icon="mdi-account-cancel"
                      :title="user.blocked ? 'Desbloquear' : 'Bloquear'"
                      :value="user.blocked ? 'Desbloquear' : 'Bloquear'"
                      @click="blockUser(user._id)"
                    />
                    <v-list-item
                      title="Revogar token"
                      value="Revogar token"
                      prepend-icon="mdi-key-remove"
                      @click="revokeRefreshToken(user._id)"
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
