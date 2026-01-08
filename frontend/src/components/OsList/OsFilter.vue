<script setup>
import { useOsStore } from "@/stores/osStore";
const osStore = useOsStore();
</script>
<template>
  <v-card class="px-2 mx-auto" rounded="lg" variant="flat">
    <v-card-title>
      <v-btn prepend-icon="mdi-filter">
        Filtrar por status
        <v-menu activator="parent">
          <v-list>
            <v-list-item>
              <v-radio-group v-model="osStore.status">
                <v-radio
                  v-for="(status, index) in osStore.statusList"
                  :key="index"
                  :label="status"
                  :value="status"
                  @click.stop="return"
                ></v-radio>
              </v-radio-group>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-card-title>
  </v-card>
</template>
