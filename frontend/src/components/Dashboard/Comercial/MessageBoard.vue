<script setup>
import Message from "./Message.vue";
import Hover from "./Hover.vue";
import fetchApi from "@/api";

import { ref, onMounted } from "vue";

const emit = defineEmits(["re-render"]);

const addNewMessage = async () => {
  const response = await fetchApi.post("addmessage", {
    text: "Novo Recado...",
    color: "#FFAD0080",
    fontSize: 16,
    colSpan: true,
  });

  if (response.status === 200) {
    alert("Mensagem Adicionada");
    emit("re-render");
  }
};

const messages = ref([]);

const fetchMessages = async () => {
  const response = await fetchApi("list-messages");
  messages.value = response.data;
};

onMounted(async () => {
  fetchMessages();
});

let interval;

const refreshMessages = () => {
  interval = setInterval(() => {
    emit("re-render");
  }, 40000);
};

refreshMessages();
</script>
<template>
  <Message
    v-for="(message, index) in messages"
    :key="index"
    :message="message"
    @on-delete-message="emit('re-render')"
  ></Message>
  <Hover @on-new-message="addNewMessage"></Hover>
</template>
