<script setup>
import { ref } from "vue";
const { olt, enableForm } = defineProps(["olt", "enableForm"]);
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";

const notification = useNotificationStore();

const emit = defineEmits(["refreshOltList"]);

const newOlt = ref(olt);
const oltForm = ref(null);

const areas = ref([
  "ARARICA",
  "IGREJINHA",
  "NOVA HARTZ",
  "M. PEDRA",
  "FAZ. FIALHO",
  "PAROBE",
  "TRES COROAS",
  "SÃO JOÃO DO DESERTO",
  "MORUNGAVA",
  "SAPIRANGA",
]);

const rules = [
  (value) => {
    if (value) return true;
    return "Campo obrigatorio";
  },
];

const updateOlt = async () => {
  try {
    const { valid } = await oltForm.value.validate();
    if (valid) {
      const response = await fetchApi.put("/update-olt", {
        oltIp: newOlt.value.oltIp,
        ipv4: newOlt.value.oltIp,
        hubsoft_id: olt.hubsoft_id,
        oltName: newOlt.value.oltName,
        oltPop: newOlt.value.oltPop,
        active: true,
        interfaces: olt.interfaces,
        vendor: newOlt.value.vendor,
        areas: newOlt.value.areas,
      });

      if (response.status === 200) {
        notification.setNotification({
          status: "success",
          msg: "OLT atualizado com sucesso",
        });
        emit("refreshOltList");
      } else {
        notification.setNotification({
          status: "error",
          msg: "Erro ao atualizar olt",
        });
      }
    } else {
      notification.setNotification({
        status: "error",
        msg: "Preencha todos os campos corretamente",
      });
    }
  } catch (error) {
    console.log(error);
    notification.setNotification({
      status: "error",
      msg: "Erro ao atualizar olt",
    });
  }
};
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form @submit.prevent="updateOlt" ref="oltForm">
        <v-row>
          <v-col cols="12">
            <v-text-field
              label="Nome"
              v-model="newOlt.oltName"
              :disabled="!enableForm"
              :rules="rules"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              label="IP"
              v-model="newOlt.oltIp"
              :disabled="!enableForm"
              :rules="rules"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-select
              :items="['PARKS', 'FIBERHOME']"
              v-model="newOlt.vendor"
              label="vendor"
              :disabled="!enableForm"
            ></v-select>
          </v-col>
          <v-col>
            <v-text-field
              label="pop"
              v-model="newOlt.oltPop"
              :disabled="!enableForm"
              :rules="rules"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center">
          <v-col cols="8" cols-md="11">
            <v-select
              label="areas"
              :items="areas"
              chips
              multiple
              v-model="newOlt.areas"
              :disabled="!enableForm"
            ></v-select>
          </v-col>
          <v-col cols="4" cols-md="1">
            <v-btn variant="text" color="primary" prepend-icon="mdi-plus"
              >add area
              <v-dialog activator="parent" max-width="500">
                <v-card title="Adicionar area">
                  <v-card-text>
                    <v-text-field
                      label="area"
                      @keyup.enter="newOlt.areas.push($event.target.value)"
                    ></v-text-field>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn @click="newOlt.areas.push($event.target.value)"
                      >adicionar</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-btn>
          </v-col>
        </v-row>
        <v-btn
          color="primary"
          block
          variant="text"
          type="submit"
          :disabled="!enableForm"
          >Atualizar</v-btn
        >
      </v-form>
      <v-list>
        <v-list-item
          v-for="oltInterface in olt.interfaces"
          :key="oltInterface.id_interface_conexao"
          :subtitle="oltInterface.descricao"
          :title="oltInterface.nome"
          :value="oltInterface.nome"
        >
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
