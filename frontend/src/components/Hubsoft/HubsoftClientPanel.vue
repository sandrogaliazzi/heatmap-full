<script setup>
import { ref } from "vue";
import hubApi from "@/api/hubsoftApi";
import { useWindowSize } from "vue-window-size";
import Dialog from "../Dialog/Dialog.vue";
import OnuModalDialog from "../OnuModalDialog/OnuModalDialog.vue";
import ServiceCard from "./ServiceCard.vue";
import AtendimentoCard from "./AtendimentoCard.vue";
import OsCard from "./OsCard.vue";
import { useNotificationStore } from "@/stores/notification";
import { createAuditoriaLog } from "../Auditoria/auditoria";

const { cto } = defineProps(["cto"]);

const loadingHubsoftData = ref(false);
const tomodatClient = defineModel();
const hubSoftClientData = ref(null);
const emit = defineEmits(["deleteClient"]);
const { width } = useWindowSize();
const onuKey = ref(1);
const openDialog = ref(false);
const selectedService = ref(null);
const selectedClient = ref(null);
const notification = useNotificationStore();

const normalizeName = (name) => {
  const suffix = name.split(" ").at(-1);

  if (!isNaN(suffix)) name = name.replace(suffix, "").trim();

  if (name.includes("(")) {
    name = name.split("(")[0].trim();
  }
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return name.trim();
};

const findClientOnHubsoft = async (isDialogOpen) => {
  console.log("finding client on hubsoft");
  if (!isDialogOpen) return;
  try {
    loadingHubsoftData.value = true;
    const response = await hubApi.get(
      `/api/v1/integracao/cliente?inativo=todos&ultima_conexao=sim&busca=nome_razaosocial&termo_busca=${normalizeName(
        tomodatClient.value.name || tomodatClient.value.client,
      )}&inclui_alarmes=sim`,
    );

    if (
      response.data.status === "success" &&
      response.data.clientes.length > 0
    ) {
      hubSoftClientData.value = response.data.clientes;
    }
  } catch (error) {
    console.error("erro ao buscar cliente no hubsoft " + error.message);
  } finally {
    loadingHubsoftData.value = false;
  }
};

const loadServices = ref(false);

const enableService = async (service) => {
  if (!service || !service.id_cliente_servico) return;
  if (
    !confirm(
      `Deseja realmente habilitar o serviço ${service.nome} - ${service.login}?`,
    )
  )
    return;

  loadServices.value = true;
  try {
    await hubApi.post(
      `/api/v1/integracao/cliente/cliente_servico/ativar/${service.id_cliente_servico}`,
      {
        id_cliente_servico: service.id_cliente_servico,
      },
    );

    notification.setNotification({
      status: "success",
      msg: `Serviço ${service.nome} habilitado com sucesso!`,
    });

    createAuditoriaLog({
      status: "serviço habilitado",
      message: `Serviço ${service.id_cliente_servico} habilitado com sucesso!`,
      client: tomodatClient.value.name,
      type: "hubsoft",
    });
  } catch (error) {
    console.error("erro ao habilitar serviço " + error.message);

    notification.setNotification({
      status: "error",
      msg: `Erro ao habilitar serviço ${service.nome}`,
    });

    createAuditoriaLog({
      status: "erro ao habilitar serviço",
      message: `Erro ao habilitar serviço ${service.id_cliente_servico}`,
      client: tomodatClient.value.name,
      type: "hubsoft",
    });
  } finally {
    loadServices.value = false;
  }
};

const setOnuProvision = (service, client) => {
  if (!cto || !service) return;
  selectedClient.value = client;
  selectedService.value = service;
  openDialog.value = true;
};

const rebootOnu = async (phy_addr) => {
  if (!phy_addr) return;
  if (!confirm(`Deseja realmente reiniciar a ONU ${phy_addr}?`)) return;
  try {
    const response = await hubApi.post(
      `/api/v1/integracao/rede/reiniciar_cpe/${phy_addr}`,
    );

    if (response.data.status === "success") {
      notification.setNotification({
        status: "success",
        msg: response.data.msg,
      });

      createAuditoriaLog({
        status: "onu reiniciada",
        message: `ONU ${phy_addr} reiniciada com sucesso!`,
        client: tomodatClient.value.name,
        type: "hubsoft",
      });
    }
  } catch (error) {
    console.error("erro ao reiniciar onu " + error.message);
    notification.setNotification({
      status: "error",
      msg: "Erro ao reiniciar onu",
    });

    createAuditoriaLog({
      status: "erro ao reiniciar onu",
      message: `Erro ao reiniciar onu ${phy_addr}`,
      client: tomodatClient.value.name,
      type: "hubsoft",
    });
  }
};

const resetMac = async (service) => {
  try {
    const response = await hubApi.post(
      "/api/v1/integracao/cliente/reset_mac_addr",
      {
        id_cliente_servico: service.id_cliente_servico,
      },
    );

    if (response.data.status === "success") {
      notification.setNotification({
        status: "success",
        msg: response.data.msg,
      });

      createAuditoriaLog({
        status: "mac resetado",
        message: `MAC do serviço ${service.id_cliente_servico} resetado com sucesso!`,
        client: tomodatClient.value.name,
        type: "hubsoft",
      });
    }
  } catch (error) {
    console.error("erro ao resetar mac " + error.message);
    notification.setNotification({
      status: "error",
      msg: "Erro ao resetar mac",
    });

    createAuditoriaLog({
      status: "erro ao resetar mac",
      message: `Erro ao resetar mac do serviço ${service.id_cliente_servico}`,
      client: tomodatClient.value.name || tomodatClient.value.client,
      type: "hubsoft",
    });
  }
};
</script>

<template>
  <v-dialog
    max-width="800"
    activator="parent"
    :fullscreen="width < 600"
    @update:modelValue="findClientOnHubsoft"
  >
    <template #default="{ isActive }">
      <v-card max-width="800">
        <v-card-title class="bg-blue"><p>Hubsoft Info</p> </v-card-title>
        <v-card-text class="d-flex flex-column align-center gap-2">
          <v-progress-circular
            indeterminate
            v-if="loadingHubsoftData"
          ></v-progress-circular>
          <div
            v-if="hubSoftClientData"
            class="d-flex flex-column justify-center align-center ga-2 w-100"
          >
            <template
              v-for="client in hubSoftClientData"
              :key="client.id_cliente"
            >
              <a href="#" @click.prevent="" style="color: #208be3"
                >({{ client.codigo_cliente }}) {{ client.nome_razaosocial }}
                {{ client.ativo ? "(ATIVO)" : "(INATIVO)" }}</a
              >
              <ServiceCard
                v-if="client.ativo"
                v-model="client.servicos"
                :loading="loadingHubsoftData"
                :cto="cto"
                @setOnuProvision="setOnuProvision($event, client)"
                @resetMac="resetMac"
                @enableService="enableService"
                @findClientOnHubsoft="findClientOnHubsoft(true)"
                @rebootOnu="rebootOnu"
              />
              <v-btn
                v-else
                prepend-icon="mdi-account-remove"
                color="red"
                size="small"
                variant="tonal"
                class="mt-2"
                @click="emit('deleteClient', tomodatClient)"
                >Remover cliente</v-btn
              >
            </template>
            <AtendimentoCard v-model="hubSoftClientData" />
            <OsCard v-model="hubSoftClientData" />
          </div>
          <p
            v-else-if="!loadingHubsoftData && !hubSoftClientData"
            class="text-h6 mb-1"
          >
            Cliente não encontrado no hubsoft 😢
          </p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="isActive.value = false" ref="dialogRef">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
  <Dialog
    :isOpen="openDialog"
    @update:modal-value="openDialog = false"
    :size="800"
  >
    <OnuModalDialog
      :key="onuKey"
      @update:force-render="onuKey++"
      :hubsoft-data="{
        selectedClient: selectedClient,
        selectedService,
        cto: cto.name,
      }"
    />
  </Dialog>
</template>
