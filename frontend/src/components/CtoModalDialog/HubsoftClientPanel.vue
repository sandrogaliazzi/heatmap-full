<script setup>
import { ref } from "vue";
import hubApi from "@/api/hubsoftApi";
import fetchApi from "@/api";
import { useWindowSize } from "vue-window-size";
import Dialog from "../Dialog/Dialog.vue";
import OnuModalDialog from "../OnuModalDialog/OnuModalDialog.vue";
import ClientesOnuCard from "../ClientesOnuModalDialog/ClientesOnuCard.vue";
import { useNotificationStore } from "@/stores/notification";

defineProps(["cto"]);

const loadingHubsoftData = ref(false);
const client = defineModel();
const hubSoftClientData = ref(null);
const emit = defineEmits(["deleteClient"]);
const { width } = useWindowSize();
const onuKey = ref(1);
const openDialog = ref(false);
const openDialog2 = ref(false);
const selectedService = ref(null);
const notification = useNotificationStore();

const normalizeName = (name) => {
  if (name.includes("(")) {
    return name.split("(")[0].trim();
  }
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return name.trim();
};

const findClientOnHubsoft = async (isDialogOpen) => {
  if (!isDialogOpen) return;
  try {
    loadingHubsoftData.value = true;
    const response = await hubApi.get(
      `/api/v1/integracao/cliente?inativo=todos&ultima_conexao=sim&busca=nome_razaosocial&termo_busca=${normalizeName(
        client.value.name || client.value.client
      )}&inclui_alarmes=sim`
    );

    if (
      response.data.status === "success" &&
      response.data.clientes.length > 0
    ) {
      hubSoftClientData.value = response.data.clientes[0];
      console.log(hubSoftClientData.value);
      await Promise.all(
        hubSoftClientData.value.servicos.map(async (service) => {
          await getVendor(service.mac_addr);
        })
      );
    }
  } catch (error) {
    console.error("erro ao buscar cliente no hubsoft " + error.message);
  } finally {
    loadingHubsoftData.value = false;
  }
};

const vendor = ref([]);
const getVendor = async (mac) => {
  if (!mac) return;
  try {
    const response = await fetchApi.get(`/getvendor/${mac}`);

    if (response.data.vendor.includes("errors")) vendor.value.push("N/A");
    else vendor.value.push(response.data.vendor);
  } catch (error) {
    console.error(error);
  }
};

const loadServices = ref(false);
const showServicesAuthStatus = ref(false);

const enableService = async (service) => {
  if (!service || !service.id_cliente_servico) return;
  if (
    !confirm(
      `Deseja realmente habilitar o serviço ${service.nome} - ${service.login}?`
    )
  )
    return;

  loadServices.value = true;
  try {
    await hubApi.post(
      `/api/v1/integracao/cliente/cliente_servico/ativar/${service.id_cliente_servico}`,
      {
        id_cliente_servico: service.id_cliente_servico,
      }
    );
  } catch (error) {
    console.error("erro ao habilitar serviço " + error.message);
  } finally {
    loadServices.value = false;
  }
};

const port = ref("443");
const protocol = ref("https");

const openNewTab = (ipv4) => {
  if (!ipv4) return;
  window.open(`${protocol.value}://${ipv4}:${port.value}`, "_blank");
};

const setOnuProvision = (service) => {
  selectedService.value = service;
  openDialog.value = true;
};

const resetMac = async (service) => {
  try {
    const response = await hubApi.post(
      "/api/v1/integracao/cliente/reset_mac_addr",
      {
        id_cliente_servico: service.id_cliente_servico,
      }
    );

    if (response.data.status === "success") {
      notification.setNotification({
        status: "success",
        msg: response.data.msg,
      });
    }
  } catch (error) {
    console.error("erro ao resetar mac " + error.message);
    notification.setNotification({
      status: "error",
      msg: "Erro ao resetar mac",
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
      <v-card>
        <v-card-title class="bg-blue"><p>Hubsoft Info</p> </v-card-title>
        <v-card-text class="d-flex flex-column align-center gap-2">
          <v-progress-circular
            indeterminate
            v-if="loadingHubsoftData"
          ></v-progress-circular>
          <template v-if="hubSoftClientData">
            <a href="#" @click.prevent="return" style="color: #208be3"
              >{{ hubSoftClientData.nome_razaosocial }}
              {{ hubSoftClientData.ativo ? "(ATIVO)" : "(INATIVO)" }}</a
            >
            <v-btn
              variant="plain"
              size="small"
              class="mt-2"
              v-if="hubSoftClientData.ativo"
              :loading="loadServices"
              @click="showServicesAuthStatus = true"
              >Mostrar serviços
            </v-btn>
            <v-btn
              v-else
              prepend-icon="mdi-account-remove"
              color="red"
              size="small"
              variant="tonal"
              class="mt-2"
              @click="emit('deleteClient', client.id)"
              >Remover cliente</v-btn
            >
            <div
              class="d-flex flex-column justify-center flex-wrap ga-3"
              v-if="showServicesAuthStatus"
            >
              <v-card
                variant="tonal"
                class="mt-3"
                width="auto"
                :loading="loadingHubsoftData"
                :title="service.nome"
                v-for="(service, index) in hubSoftClientData.servicos"
                :color="service.ultima_conexao.conectado ? 'green' : 'red'"
                :key="service.id_serivco"
              >
                <template #append>
                  <v-btn icon="mdi-reload" @click="findClientOnHubsoft"></v-btn>
                </template>
                <v-card-item>
                  <div>
                    <div class="mb-1">
                      Status:
                      {{ service.status }}
                    </div>
                    <div class="text-caption">Pppoe: {{ service?.login }}</div>
                    <div class="text-caption">Serviço: {{ service.nome }}</div>
                    <div class="text-caption">
                      id_serivco: {{ service.id_cliente_servico }}
                    </div>
                    <div class="text-caption font-weight-bold">
                      Referencia: {{ service?.referencia }}
                    </div>
                    <div class="text-h6 mb-1">
                      Ipv4:
                      {{
                        service.ultima_conexao.ultimo_ipv4 ||
                        service.ipv4 ||
                        "-"
                      }}
                      <v-btn icon="mdi-open-in-new" variant="text">
                        <v-icon>mdi-open-in-new</v-icon>
                        <v-dialog max-width="600" activator="parent">
                          <template #default="{ isActive }">
                            <v-card>
                              <v-toolbar color="blue">
                                <v-toolbar-title
                                  >Acessar Equipamento</v-toolbar-title
                                >
                                <v-btn
                                  icon="mdi-close"
                                  @click="isActive.value = false"
                                ></v-btn>
                              </v-toolbar>
                              <v-card-text>
                                <div
                                  class="d-flex flex-column flex-md-row justify-center ga-3"
                                >
                                  <v-text-field
                                    label="https"
                                    v-model="protocol"
                                  ></v-text-field>
                                  <v-text-field
                                    :label="
                                      service.ultima_conexao.ultimo_ipv4 ||
                                      service.ipv4
                                    "
                                    :value="
                                      service.ultima_conexao.ultimo_ipv4 ||
                                      service.ipv4
                                    "
                                    readonly
                                  ></v-text-field>
                                  <v-text-field
                                    label="443"
                                    v-model="port"
                                  ></v-text-field>
                                  <v-btn
                                    icon="mdi-open-in-new"
                                    @click="
                                      openNewTab(
                                        service.ultima_conexao.ultimo_ipv4
                                      )
                                    "
                                    variant="text"
                                  ></v-btn>
                                </div>
                              </v-card-text>
                            </v-card>
                          </template>
                        </v-dialog>
                      </v-btn>
                    </div>
                    <v-chip
                      :color="
                        service.ultima_conexao.conectado ? 'green' : 'red'
                      "
                      variant="flat"
                      size="x-small"
                      class="text-caption mb-1"
                      prepend-icon="mdi-timer-check"
                      >{{ service.ultima_conexao.status_txt_resumido }}</v-chip
                    >
                    <div class="text-h6 mb-1">
                      Mac: {{ service.mac_addr }}
                      <span v-if="vendor">({{ vendor[index] }})</span>
                    </div>
                  </div>
                </v-card-item>
                <v-card-actions class="d-flex flex-column align-start">
                  <div>
                    <v-btn @click="setOnuProvision(service)" variant="text"
                      >Provisionar Cpe</v-btn
                    >
                    <v-btn @click="resetMac(service)" variant="text"
                      >Recapturar Mac</v-btn
                    >
                  </div>
                  <div>
                    <v-btn @click="enableService(service)" variant="text"
                      >Habilitar serviço</v-btn
                    >
                    <v-btn
                      @click="openDialog2 = true"
                      v-if="cto"
                      variant="text"
                      color="error"
                      >Desautorizar Cpe</v-btn
                    >
                  </div>
                </v-card-actions>
              </v-card>
              <div class="text-caption mt-3">
                Sessões de clientes empresariais não serão carregadas
                corretamente
              </div>
            </div>
          </template>
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
        selectedClient: hubSoftClientData,
        selectedService,
        cto: cto.name,
      }"
    />
  </Dialog>
  <Dialog :isOpen="openDialog2" @update:modal-value="openDialog2 = false">
    <ClientesOnuCard :clients="[client]" :city="cto.city" />
  </Dialog>
</template>
