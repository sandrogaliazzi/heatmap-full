<script setup>
defineEmits(["editLocation", "toggleDrawer"]);
</script>

<template>
  <v-card
    ><v-card-title>
      <div class="d-flex align-center justify-center ga-2">
        <v-btn
          icon="mdi-map-marker"
          size="small"
          variant="flat"
          @click="$emit('editLocation')"
        ></v-btn>
        <v-btn
          icon="mdi-list-box"
          size="small"
          variant="flat"
          @click="$emit('toggleDrawer')"
        >
        </v-btn>
      </div> </v-card-title
  ></v-card>
</template>
