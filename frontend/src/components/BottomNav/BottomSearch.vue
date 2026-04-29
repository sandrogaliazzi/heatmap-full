<script setup>
import { provide } from "vue";
import SearchCard from "../AppBar/SearchCard.vue";

defineProps(["isDesktop"]);

provide("closeDialog", (value) => {
  isOpen.value = value;
});

const isOpen = defineModel();
</script>

<template>
  <v-bottom-sheet v-model="isOpen" max-height="350px">
    <div>
      <SearchCard :isDesktop="isDesktop" />
    </div>
  </v-bottom-sheet>
</template>
