<script setup>
import { ref, onMounted } from "vue";
import AuditoriaTable from "./AuditoriaTable.vue";
import { getAuditoriaLogs } from "./auditoria";

const tab = ref("one");

const items = ref([]);

const getLogs = async () => {
  items.value = await getAuditoriaLogs();
};

onMounted(() => {
  getLogs();
  //console.log(items.value);
});
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12">
        <v-card>
          <template #append>
            <v-btn color="primary" prepend-icon="mdi-refresh" @click="getLogs"
              >Recarregar</v-btn
            >
          </template>
          <v-card-title>Logs Heatmap</v-card-title>
          <v-card-text>
            <v-tabs color="primary" v-model="tab">
              <v-tab value="one">Tomodat</v-tab>
              <v-tab value="two">CPE</v-tab>
              <v-tab value="three">HUBSOFT</v-tab>
              <v-tab value="four">LOGIN</v-tab>
            </v-tabs>

            <v-divider></v-divider>

            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="one">
                <AuditoriaTable
                  :items="items.filter((item) => item.type === 'tomodat')"
                />
              </v-tabs-window-item>
              <v-tabs-window-item value="two">
                <AuditoriaTable
                  :items="items.filter((item) => item.type === 'cpe')"
                />
              </v-tabs-window-item>
              <v-tabs-window-item value="three">
                <AuditoriaTable
                  :items="items.filter((item) => item.type === 'hubsoft')"
                />
              </v-tabs-window-item>
              <v-tabs-window-item value="four">
                <AuditoriaTable
                  :items="items.filter((item) => item.type === 'login')"
                />
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
