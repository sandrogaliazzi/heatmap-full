<script setup>
import { ref, reactive, watch } from "vue";
import fetchApi from "@/api";

const { message } = defineProps(["message"]);
const emit = defineEmits(["onDeleteMessage"]);

const showTextArea = ref(false);

const newMessage = reactive({
  _id: message._id,
  colSpan: message.colSpan,
  fontSize: message.fontSize,
  color: message.color,
  text: message.text,
});

watch(newMessage, async (newValue) => {
  const response = await fetchApi.post("addmessage", { ...newValue });
  if (response.status === 200) console.log("editado");
});

const deleteMessage = async () => {
  if (newMessage._id) {
    const response = await fetchApi.delete(`/delete-message/${newMessage._id}`);
    if (response.status === 200) {
      alert("recado deletada com sucesso");
    } else {
      alert("ocorreu um erro ao deletar o recado, verificar com Sandro");
    }
  }
  emit("onDeleteMessage");
};
</script>
<template>
  <v-col :cols="newMessage.colSpan ? 12 : 6">
    <v-card v-if="showTextArea">
      <v-card-text>
        <v-textarea v-model="newMessage.text" color="black"></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-btn color="success" @click="showTextArea = false">salvar</v-btn>
        <v-btn color="error" @click="deleteMessage">excluir</v-btn>
        <v-btn color="orange" @click="showTextArea = false">cancelar</v-btn>
      </v-card-actions>
    </v-card>
    <v-banner
      v-else
      icon="mdi-alert-circle"
      :style="{
        backgroundColor: newMessage.color,
        fontSize: newMessage.fontSize + 'px',
      }"
      class="rounded-lg"
    >
      <v-banner-text>
        {{ newMessage.text }}
      </v-banner-text>
      <template v-slot:actions>
        <v-btn
          icon="mdi-pencil"
          variant="text"
          @click="showTextArea = !showTextArea"
        ></v-btn>
        <v-btn
          :icon="`mdi-arrow-${newMessage.colSpan ? 'collapse' : 'expand'}`"
          variant="text"
          @click="newMessage.colSpan = !newMessage.colSpan"
        ></v-btn>
        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-horizontal" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-slider
                v-model="newMessage.fontSize"
                min="16"
                max="32"
              ></v-slider>
            </v-list-item>
            <v-list-item>
              <v-color-picker
                hide-canvas
                hide-inputs
                v-model="newMessage.color"
              ></v-color-picker>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-banner>
  </v-col>
</template>
