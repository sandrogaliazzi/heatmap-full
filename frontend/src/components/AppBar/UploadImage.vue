<script setup>
import { ref } from "vue";
import avatar from "@/assets/avatar.png";
import fetchApi from "@/api";
import { useUserStore } from "@/stores/user";

const { user } = defineProps(["user"]);
const userStore = useUserStore();

const file = ref(null);
const avatarImage = ref(user.avatar || avatar);

const fileInput = ref(null);

const uploadImage = () => {
  console.log(file.value);
  avatarImage.value = URL.createObjectURL(file.value);
};

const updateUserAvatar = async (imageUrl, id) => {
  try {
    const response = await fetchApi.put("/users/avatar/" + user._id, {
      avatar: imageUrl,
      avatar_id: id,
    });

    if (response.status === 200) {
      userStore.setUser({
        ...user,
        avatar: imageUrl,
        avatar_id: id,
      });
    }
  } catch (error) {
    console.error("Error updating user avatar:", error);
  }
};

const saveImage = async () => {
  const formData = new FormData();
  formData.append("image", file.value);

  try {
    const response = await fetchApi.post("/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const { url, id } = response.data.image;
    await updateUserAvatar(url, id);

    alert("Imagem carregada com sucesso!");
  } catch (error) {
    console.error("Error uploading image:", error);
  }
};
</script>
<template>
  <v-dialog
    activator="parent"
    @update:model-value="() => (avatarImage = user.avatar || avatar)"
  >
    <v-sheet
      class="pa-4 text-center mx-auto"
      elevation="12"
      max-width="600"
      rounded="lg"
      width="100%"
    >
      <div class="d-flex ga-4 justify-center align-center flex-column">
        <v-avatar
          color="surface-variant"
          :image="avatarImage"
          size="120"
        ></v-avatar>

        <v-btn
          color="orange"
          variant="outlined"
          rounded="pill"
          @click="fileInput.click()"
          >editar foto</v-btn
        >
      </div>

      <h2 class="text-h5 mt-4">{{ user.name }}</h2>
      <p class="text-emphasis mt-2 mb-3">perfil: {{ user.category }}</p>

      <v-divider class="mb-4"></v-divider>

      <div class="text-end">
        <v-file-input
          label="Carregar nova imagem"
          prepend-icon="mdi-pencil"
          variant="outlined"
          v-model="file"
          name="image"
          ref="fileInput"
          v-show="false"
          @change="uploadImage"
        ></v-file-input>
      </div>
      <div class="text-end">
        <v-btn color="primary" variant="flat" v-if="file" @click="saveImage">
          Salvar Imagem
        </v-btn>
      </div>
    </v-sheet>
  </v-dialog>
</template>
