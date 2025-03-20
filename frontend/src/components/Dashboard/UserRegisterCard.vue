<script setup>
import { ref } from "vue";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";

const { user } = defineProps(["user"]);
const password = ref("");
const formRef = ref(null);
const notification = useNotificationStore();
const emit = defineEmits([
  "update:userName",
  "update:modalDialog",
  "update:userList",
]);
const passwordVisible = ref(false);

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este camppo é obrigatório";
  },
];

const togglePasswordVisibility = () =>
  (passwordVisible.value = !passwordVisible.value);

const saveUser = async (reqBody) => {
  try {
    await fetchApi.post("/users", reqBody);

    notification.setNotification({
      msg: "Usuário adicionado com sucesso",
      status: "success",
    });
  } catch (e) {
    notification.setNotification({
      msg: "Erro ao adicionar usuário",
      status: "red",
    });

    console.log(e.message);
  }
};

const editUser = async (reqBody) => {
  console.log(reqBody)
  // try {
  //   await fetchApi.put(`users/${user._id}`, reqBody);
  //   notification.setNotification({
  //     msg: "Usuário editado com sucesso",
  //     status: "success",
  //   });
  // } catch (e) {
  //   notification.setNotification({
  //     msg: "Erro ao editar usuário",
  //     status: "red",
  //   });
  // }
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  const reqBody = {
    name: user.name,
    category: user.category,
    password: password.value,
  };

  if (!valid) {
    notification.setNotification({
      msg: "Preencha todos os campos do formulário corretamente",
      status: "red",
    });
  } else {
    user._id ? await editUser(reqBody) : await saveUser(reqBody);
    emit("update:userList");
    emit("update:modalDialog", false);
  }
};
</script>

<template>
  <v-card>
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Add Usuário</p>
          <v-icon>mdi-account-plus</v-icon>
        </div>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="emit('update:modalDialog', false)"
        ></v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-form ref="formRef" @submit.prevent="handleSubmit" autocomplete="off">
              <v-col cols="12">
                <v-text-field
                  prepend-icon="mdi-account"
                  variant="underlined"
                  :label="user.name"
                  @input="emit('update:userName', $event.target.value)"
                  :rules="inputRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Senha"
                  v-model.trim="password"
                  :type="passwordVisible ? 'text' : 'password'"
                  placeholder="digite a senha"
                  prepend-icon="mdi-account-lock"
                  :append-inner-icon="
                    passwordVisible ? 'mdi-eye-off' : 'mdi-eye'
                  "
                  @click:append-inner="togglePasswordVisibility"
                  variant="underlined"
                  :rules="inputRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-radio-group inline label="Categoria" v-model="user.category">
                  <v-radio label="Adm" value="adm" color="orange"></v-radio>
                  <v-radio
                    label="Técnico"
                    value="tecnico"
                    color="orange"
                  ></v-radio>
                  <v-radio
                    label="Vendas"
                    value="vendas"
                    color="orange"
                  ></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="12">
                <v-btn
                  color="success"
                  prepend-icon="mdi-plus-outline"
                  block
                  type="submit"
                  >{{ user.id ? "Salvar" : "Registrar" }}</v-btn
                >
              </v-col>
            </v-form>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>
