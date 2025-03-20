<script setup>
const emit = defineEmits(["onNewMessage"]);
</script>

<template>
  <v-col>
    <v-card>
      <v-card-text class="d-flex justify-center">
        <v-btn
          icon="mdi-plus"
          style="font-size: 24px"
          @click="emit('onNewMessage')"
        ></v-btn>
      </v-card-text>
    </v-card>
  </v-col>
</template>
