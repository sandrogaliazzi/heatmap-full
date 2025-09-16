<script setup>
import { ref } from "vue";
import hubApi from "@/api/hubsoftApi";
import fetchApi from "@/api";

const loadingHubsoftData = ref(false);
const client = defineModel();
const hubSoftClientData = ref(null);
const emit = defineEmits(["deleteClient"]);

const normalizeName = (name) => {
  if (name.includes("(")) {
    return name.split("(")[0].trim();
  }

  return name.trim();
};

const findClientOnHubsoft = async (isDialogOpen) => {
  if (!isDialogOpen) return;
  try {
    loadingHubsoftData.value = true;
    const response = await hubApi.get(
      `/api/v1/integracao/cliente?inativo=todos&busca=nome_razaosocial&termo_busca=${normalizeName(
        client.value.name
      )}`
    );

    if (
      response.data.status === "success" &&
      response.data.clientes.length > 0
    ) {
      hubSoftClientData.value = response.data.clientes[0];
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
const loadSessions = ref(false);
const netWorkSessionInfo = ref([]);
const getServiceConnectionStatus = async (services) => {
  try {
    loadServices.value = true;
    const sessions = await Promise.all(
      services.map(async (service) => {
        const response = await fetchApi.post("/pppoeonline", {
          pppoe: service.login,
        });
        if (response.status === 201) {
          await getVendor(service.mac_addr);
          return response.data.session;
        } else {
          return null;
        }
      })
    );

    netWorkSessionInfo.value = sessions.flat();

    loadServices.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    loadServices.value = false;
    loadSessions.value = true;
  }
};

const port = ref("443");
const protocol = ref("https");

const openNewTab = (ipv4) => {
  if (!ipv4) return;
  window.open(`${protocol.value}://${ipv4}:${port.value}`, "_blank");
};
</script>

<template>
  <v-dialog
    max-width="800"
    activator="parent"
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
              @click="getServiceConnectionStatus(hubSoftClientData.servicos)"
              >buscar conexões
              <!-- <HubsoftClientTabs :services="hubSoftClientData.servicos" /> -->
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
              class="d-flex flex-column justify-center flex-wrap flex-md-row ga-3"
              v-if="loadSessions"
            >
              <v-card
                variant="tonal"
                class="mt-3"
                min-width="300"
                v-for="(service, index) in hubSoftClientData.servicos"
                :color="netWorkSessionInfo[index] ? 'green' : 'red'"
                :key="service.id_serivco"
              >
                <v-card-item>
                  <div>
                    <div class="mb-1">
                      Status:
                      {{ netWorkSessionInfo[index] ? "Online" : "Offline" }}
                    </div>
                    <div class="text-caption">Pppoe: {{ service?.login }}</div>
                    <div class="text-caption">Serviço: {{ service?.nome }}</div>
                    <div class="text-h6 mb-1">
                      Ipv4:
                      {{
                        netWorkSessionInfo[index]?.ipv4 || service.ipv4 || "-"
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
                                <div class="d-flex justify-center ga-3">
                                  <v-text-field
                                    label="https"
                                    v-model="protocol"
                                  ></v-text-field>
                                  <v-text-field
                                    :label="netWorkSessionInfo[index]?.ipv4"
                                    :value="netWorkSessionInfo[index]?.ipv4"
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
                                        netWorkSessionInfo[index]?.ipv4
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
                    <div class="text-h6 mb-1">
                      Mac: {{ netWorkSessionInfo[index]?.mac }}
                      <span v-if="vendor">({{ vendor[index] }})</span>
                    </div>
                  </div>
                </v-card-item>
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
</template>
