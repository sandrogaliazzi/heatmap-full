<script setup>
import { ref, watch, inject } from "vue";
import { useTomodatStore } from "@/stores/tomodat";
import { storeToRefs } from "pinia";
import avatar from "@/assets/avatar.png";
import DialogBox from "../Dialog/Dialog.vue";
import SearchCard from "./SearchCard.vue";
import CameraForm from "./CameraForm.vue";
import OnuModalDialog from "@/components/OnuModalDialog/OnuModalDialog";
import EmailModalDialog from "@/components/EmailModalDialog/EmailModalDialog";
import ClientesOnuCard from "@/components/ClientesOnuModalDialog/ClientesOnuCard";
import RamalCard from "@/components/RamalModalDialog/RamalCard";
import OsMap from "./OsMap.vue";
import OsList from "../Ativacoes/OsList.vue";
import ReservadosList from "../Reservados/ReservadosList.vue";
import router from "@/router";
import ProfileConfig from "../OnuModalDialog/ProfileConfig.vue";

const tomodatStore = useTomodatStore();
const { selectedCto } = storeToRefs(tomodatStore);

const { user } = defineProps(["user"]);
const cto = ref({});
const isDarkTheme = ref(true);

const changeTheme = inject("changeTheme");

watch(selectedCto, () => {
  cto.value = tomodatStore.getCto(selectedCto.value);
});

const openDialog = ref(false);

const openCameraDialog = ref(false);
const openOnuDialog = ref(false);
const openEmailDialog = ref(false);
const openClientsOnuDialog = ref(false);
const openRamalDialog = ref(false);
const openAtivacoesDialog = ref(false);
const openOsDialog = ref(false);
const openReservadosDialog = ref(false);
const openProvisionDialog = ref(false);
const onuKey = ref(1);

const emit = defineEmits(["logout:user"]);

const onCloseDialog = (value) => {
  openDialog.value = value;
  openCameraDialog.value = value;
  openOnuDialog.value = value;
  openEmailDialog.value = value;
  openClientsOnuDialog.value = value;
  openRamalDialog.value = value;
  openOsDialog.value = value;
  openAtivacoesDialog.value = value;
  openReservadosDialog.value = value;
  openProvisionDialog.value = value;
};
</script>

<template>
  <v-list>
    <v-list-group>
      <template #activator="{ props }">
        <v-list-item
          :prepend-avatar="avatar"
          :title="user.name"
          :subtitle="user.category"
          v-bind="props"
        >
        </v-list-item>
      </template>
      <v-list-item>
        <v-switch
          hide-details
          v-model="isDarkTheme"
          color="indigo-darken-3"
          @click="changeTheme"
          label="Dark Mode"
          class="ml-3"
        ></v-switch>
      </v-list-item>
    </v-list-group>
    <v-divider class="my-2"></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-magnify"
        title="Pesquisa avançada"
        value="search"
        color="orange"
        v-role="['adm', 'tecnico', 'vendas']"
        @click="openDialog = !openDialog"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-engine"
        title="Veículos Conect"
        value="ordens"
        color="orange"
        v-role="['adm', 'tecnico']"
        @click="openOsDialog = true"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-question"
        title="Consulta Viabilidade"
        value="viabilidade"
        color="orange"
        @click="router.push('/viabilidade')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-lock"
        title="Reservados"
        value="reservados"
        color="orange"
        v-role="['adm']"
        @click="openReservadosDialog = true"
      >
      </v-list-item>
      <v-list-item
        prepend-icon="mdi-flag-plus"
        title="Ativações"
        value="ativacao"
        color="orange"
        v-role="['adm']"
        @click="openAtivacoesDialog = true"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-logout"
        title="Logout"
        value="logout"
        color="orange"
        @click="emit('logout:user')"
      ></v-list-item>
      <v-list-group value="Dashboard" prepend-icon="mdi-view-dashboard">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props" title="Dashboard"></v-list-item>
        </template>
        <!-- <v-list-item
          prepend-icon="mdi-monitor-dashboard"
          title="Adm Painel"
          color="orange"
          value="Dashboard"
          to="/dashboard"
        ></v-list-item> -->
        <v-list-item
          prepend-icon="mdi-account-group"
          title="Usuários"
          color="orange"
          value="users"
          to="/users"
          v-role="['adm']"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-web"
          title="Ativações"
          color="orange"
          value="logs"
          to="/logs"
          v-role="['adm']"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-cctv"
          title="Câmeras"
          value="cameras"
          color="orange"
          to="/camera"
          v-role="['adm', 'tecnico']"
        ></v-list-item>
      </v-list-group>
      <v-list-item
        prepend-icon="mdi-set-top-box"
        title="Cpes não autorizadas"
        color="orange"
        value="ONU"
        v-role="['adm', 'tecnico']"
        @click="openOnuDialog = true"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-cog-box"
        title="Provisionar CPE avulsa"
        color="orange"
        value="CPE"
        v-role="['adm', 'tecnico']"
        @click="openProvisionDialog = true"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-circle-box"
        title="Lista Cpes"
        color="orange"
        value="onuParks"
        v-role="['adm', 'tecnico']"
        @click="openClientsOnuDialog = true"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-signal"
        title="Olt Sinais"
        color="orange"
        value="oltSignals"
        v-role="['adm', 'tecnico']"
        @click="openRamalDialog = true"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-email"
        title="Emails"
        color="orange"
        value="email"
        v-role="['adm', 'tecnico']"
        @click="openEmailDialog = true"
      ></v-list-item>
    </v-list>
  </v-list>
  <DialogBox :isOpen="openDialog" @update:modalValue="onCloseDialog">
    <SearchCard class="mt-4" />
  </DialogBox>
  <DialogBox :isOpen="openCameraDialog" @update:modalValue="onCloseDialog">
    <CameraForm />
  </DialogBox>
  <DialogBox :isOpen="openOnuDialog" @update:modalValue="onCloseDialog">
    <OnuModalDialog :key="onuKey" @update:force-render="onuKey++" />
  </DialogBox>
  <DialogBox :isOpen="openEmailDialog" @update:modalValue="onCloseDialog">
    <EmailModalDialog />
  </DialogBox>
  <DialogBox :isOpen="openClientsOnuDialog" @update:modalValue="onCloseDialog">
    <ClientesOnuCard />
  </DialogBox>
  <DialogBox :isOpen="openRamalDialog" @update:modalValue="onCloseDialog">
    <RamalCard />
  </DialogBox>
  <DialogBox
    :isOpen="openAtivacoesDialog"
    @update:modalValue="onCloseDialog"
    size="1000"
  >
    <OsList />
  </DialogBox>
  <DialogBox :isOpen="openReservadosDialog" @update:modalValue="onCloseDialog">
    <ReservadosList />
  </DialogBox>
  <DialogBox
    :isOpen="openOsDialog"
    :isFull="true"
    @update:modalValue="onCloseDialog"
  >
    <OsMap />
  </DialogBox>
  <DialogBox :isOpen="openProvisionDialog" @update:modalValue="onCloseDialog">
    <ProfileConfig />
  </DialogBox>
</template>
