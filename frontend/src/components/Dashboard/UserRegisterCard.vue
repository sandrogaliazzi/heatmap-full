<script setup>
import { ref } from "vue";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";
import avatar from "@/assets/avatar.png";

const { user } = defineProps(["user"]);
const password = ref("");
const formRef = ref(null);
const fileInput = ref(null);
const color = ref(user.color || "#ffffff");
const fileUploaded = ref(null);
const avatarImage = ref(user.avatar || avatar);
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
  console.log("editado", user._id, reqBody);
  try {
    await fetchApi.put(`users/${user._id}`, reqBody);
    notification.setNotification({
      msg: "Usuário editado com sucesso",
      status: "success",
    });
  } catch (e) {
    notification.setNotification({
      msg: "Erro ao editar usuário",
      status: "red",
    });
  }
};

const uploadImage = () => {
  avatarImage.value = URL.createObjectURL(fileUploaded.value);
};

const saveImage = async () => {
  const formData = new FormData();
  formData.append("image", fileUploaded.value);

  try {
    const response = await fetchApi.post("/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.image;
  } catch (error) {
    console.error("Error uploading image:", error);
  }
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  let avatar,
    avatar_id = "";

  if (fileUploaded.value) {
    const response = await saveImage();
    avatar = response.url;
    avatar_id = response.id;
  }
  const reqBody = {
    name: user.name,
    category: user.category,
    sellerClass: user.sellerClass,
    goal: user.goal,
    avatar,
    avatar_id,
    color: color.value,
  };

  if (password.value) {
    reqBody.password = password.value;
  }

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
          <v-col cols="12" class="d-flex justify-center mb-4">
            <v-hover v-slot="{ isHovering, props }">
              <div v-bind="props">
                <v-img
                  :src="avatarImage"
                  :width="200"
                  :height="200"
                  cover
                  rounded="circle"
                >
                  <v-expand-transition>
                    <div
                      v-if="isHovering"
                      class="d-flex justify-center align-center bg-grey-lighten-1 opacity-70"
                      style="height: 100%"
                    >
                      <v-btn
                        icon="mdi-pen"
                        variant="plain"
                        class="opacity-100"
                        @click="fileInput.click()"
                      ></v-btn>
                    </div>
                  </v-expand-transition>
                </v-img>
              </div>
            </v-hover>
          </v-col>
          <v-col cols="12">
            <v-form
              ref="formRef"
              @submit.prevent="handleSubmit"
              autocomplete="off"
            >
              <v-col cols="12">
                <v-file-input
                  ref="fileInput"
                  v-model="fileUploaded"
                  v-show="false"
                  @change="uploadImage"
                ></v-file-input>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  prepend-icon="mdi-account"
                  variant="underlined"
                  v-model="user.name"
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
                  <v-radio
                    label="Convidado"
                    value="convidado"
                    color="orange"
                  ></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="12" v-if="user.category === 'vendas'">
                <v-radio-group
                  inline
                  label="Tipo de Vendedor"
                  v-model="user.sellerClass"
                >
                  <v-radio
                    label="vendedor interno"
                    :value="1"
                    color="orange"
                  ></v-radio>
                  <v-radio
                    label="vendedor externo"
                    :value="0"
                    color="orange"
                  ></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="12" v-if="user.category === 'vendas'">
                <v-text-field
                  variant="underlined"
                  v-model="user.goal"
                  type="number"
                  label="meta de vendas"
                  prepend-icon="mdi-cash-multiple"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-color-picker v-model="color"></v-color-picker>
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
