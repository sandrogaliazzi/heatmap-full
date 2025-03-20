<script setup>
const { cables } = defineProps(["cables"]);
</script>
<template>
  <GMapPolyline
    v-for="(cable, i) in cables"
    :key="i"
    :path="cable.coord"
    :options="{
      strokeColor: cable.color,
    }"
  />
</template>
