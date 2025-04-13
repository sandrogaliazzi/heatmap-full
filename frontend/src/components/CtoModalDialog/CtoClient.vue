<script setup>
import { ref } from "vue";
import fetchApi from "@/api";

const { client } = defineProps(["client"]);

const isColorActive = ref(false);
const setSnackBar = ref(false);
const pppoeClassStatus = ref("");

const copyName = async (name) => {
  await navigator.clipboard.writeText(name);
  setSnackBar.value = true;
};

const copyNameWithHifen = async (name) => {
  let nameWithHifen = "";
  if (name.includes("(")) {
    nameWithHifen = name.split("(")[0].trim().replaceAll(" ", "-");
  } else {
    nameWithHifen = name.split(" ").join("-");
  }

  await navigator.clipboard.writeText(nameWithHifen);
  setSnackBar.value = true;
};

const checkPppoe = async (name) => {
  const n = name.includes("(")
    ? name.split("(")[0].trim().split(" ")
    : name.split(" ");

  const firstName = n[0];
  const lastName = n[n.length - 1];
  const pppoe = `${firstName}${lastName}fibra`.toLowerCase();

  const response = await fetchApi.post("/pppoeonline", { pppoe });

  console.log(response);

  pppoeClassStatus.value = response.status === 201 ? "success" : "red";
};

const changeColor = () => (isColorActive.value = !isColorActive.value);
</script>

<template>
  <v-list-item-title
    class="d-flex justify-space-between align-center"
    :class="isColorActive ? 'border-b' : ''"
  >
    <span class="text-wrap">{{ client.name }}</span>
    <v-btn-group class="d-none d-md-flex ms-3">
      <v-btn size="small" @click="checkPppoe(client.name)">
        <v-icon icon="mdi-check-circle" :color="pppoeClassStatus"></v-icon>
      </v-btn>
      <v-btn size="small" icon="mdi-pen" @click="copyName(client.name)"></v-btn>
      <v-btn
        size="small"
        icon="mdi-pen-minus"
        @click="copyNameWithHifen(client.name)"
      ></v-btn>
    </v-btn-group>
  </v-list-item-title>
  <v-snackbar
    v-model="setSnackBar"
    :timeout="2000"
    location="top"
    color="success"
  >
    <span>Nome copiado com sucesso</span>
  </v-snackbar>
</template>
