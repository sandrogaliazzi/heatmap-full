<script setup>
import { ref } from "vue";
import fetchApi from "@/api";
import { useUserStore } from "@/stores/user";
import { useNotificationStore } from "@/stores/notification";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const notification = useNotificationStore();
const router = useRouter();

const userName = ref("");
const password = ref("");
const formRef = ref(null);
const showPassword = ref(false);

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const isValidLogin = async () => {
  try {
    const response = await fetchApi.post("/login", {
      name: userName.value,
      password: password.value,
    });

    return response.status === 201 ? response.data : false;
  } catch (e) {
    showLoginFail("Usuário ou senha incorretos");
  }
};

const setUser = async (userData) => {
  userStore.setUser(userData);
  router.push({ name: "HeatMap" });
};

const showLoginFail = (msg) => {
  notification.setNotification({
    msg,
    status: "red",
  });
};

const handleLogin = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    const checkedUser = await isValidLogin();

    if (checkedUser) setUser(checkedUser);
    else showLoginFail("Usuário ou senha incorretos");
  } else {
    showLoginFail("Erro, dados incompletos");
  }
};
</script>

<template>
  <v-container class="fill-height background" fluid>
    <v-responsive class="align-center text-center fill-height">
      <v-row class="justify-center">
        <v-col sm="11" md="6" lg="4" xl="3">
          <v-sheet width="100%" min-height="600" height="600">
            <v-row class="h-100">
              <v-col cols="12" align-self="center">
                <v-img
                  src="@/assets/LOGO-HEATMAP-MOBILE.png"
                  height="150"
                  width="150"
                  class="mx-auto"
                />
                <v-card class="px-5 px-md-10 pt-3 pb-10" elevation="0">
                  <v-card-text>
                    <v-form @submit.prevent="handleLogin" ref="formRef">
                      <v-text-field
                        v-model="userName"
                        :rules="inputRules"
                        class="mb-2"
                        clearable
                        label="Usuário"
                      ></v-text-field>

                      <v-text-field
                        v-model="password"
                        :rules="inputRules"
                        :append-inner-icon="
                          showPassword ? 'mdi-eye' : 'mdi-eye-off'
                        "
                        @click:append-inner="showPassword = !showPassword"
                        :type="showPassword ? 'text' : 'password'"
                        label="Senha"
                        placeholder="Digite sua senha"
                      ></v-text-field>

                      <br />

                      <v-btn
                        block
                        color="success"
                        size="large"
                        type="submit"
                        variant="elevated"
                        @keyup.enter="handleLogin"
                      >
                        Login
                      </v-btn>
                    </v-form>
                  </v-card-text>
                  <v-card-actions class="d-flex justify-center">
                    <v-btn icon="mdi-github" size="large"></v-btn>
                    <v-btn icon="mdi-instagram" size="large"></v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<style scoped>
.background {
  background-color: #ff811a;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'%3E%3Cdefs%3E%3CradialGradient id='a' gradientUnits='objectBoundingBox'%3E%3Cstop offset='0' stop-color='%23FB3'/%3E%3Cstop offset='1' stop-color='%23ee5522'/%3E%3C/radialGradient%3E%3ClinearGradient id='b' gradientUnits='userSpaceOnUse' x1='0' y1='750' x2='1550' y2='750'%3E%3Cstop offset='0' stop-color='%23f7882b'/%3E%3Cstop offset='1' stop-color='%23ee5522'/%3E%3C/linearGradient%3E%3Cpath id='s' fill='url(%23b)' d='M1549.2 51.6c-5.4 99.1-20.2 197.6-44.2 293.6c-24.1 96-57.4 189.4-99.3 278.6c-41.9 89.2-92.4 174.1-150.3 253.3c-58 79.2-123.4 152.6-195.1 219c-71.7 66.4-149.6 125.8-232.2 177.2c-82.7 51.4-170.1 94.7-260.7 129.1c-90.6 34.4-184.4 60-279.5 76.3C192.6 1495 96.1 1502 0 1500c96.1-2.1 191.8-13.3 285.4-33.6c93.6-20.2 185-49.5 272.5-87.2c87.6-37.7 171.3-83.8 249.6-137.3c78.4-53.5 151.5-114.5 217.9-181.7c66.5-67.2 126.4-140.7 178.6-218.9c52.3-78.3 96.9-161.4 133-247.9c36.1-86.5 63.8-176.2 82.6-267.6c18.8-91.4 28.6-184.4 29.6-277.4c0.3-27.6 23.2-48.7 50.8-48.4s49.5 21.8 49.2 49.5c0 0.7 0 1.3-0.1 2L1549.2 51.6z'/%3E%3Cg id='g'%3E%3Cuse href='%23s' transform='scale(0.12) rotate(60)'/%3E%3Cuse href='%23s' transform='scale(0.2) rotate(10)'/%3E%3Cuse href='%23s' transform='scale(0.25) rotate(40)'/%3E%3Cuse href='%23s' transform='scale(0.3) rotate(-20)'/%3E%3Cuse href='%23s' transform='scale(0.4) rotate(-30)'/%3E%3Cuse href='%23s' transform='scale(0.5) rotate(20)'/%3E%3Cuse href='%23s' transform='scale(0.6) rotate(60)'/%3E%3Cuse href='%23s' transform='scale(0.7) rotate(10)'/%3E%3Cuse href='%23s' transform='scale(0.835) rotate(-40)'/%3E%3Cuse href='%23s' transform='scale(0.9) rotate(40)'/%3E%3Cuse href='%23s' transform='scale(1.05) rotate(25)'/%3E%3Cuse href='%23s' transform='scale(1.2) rotate(8)'/%3E%3Cuse href='%23s' transform='scale(1.333) rotate(-60)'/%3E%3Cuse href='%23s' transform='scale(1.45) rotate(-30)'/%3E%3Cuse href='%23s' transform='scale(1.6) rotate(10)'/%3E%3C/g%3E%3C/defs%3E%3Cg %3E%3Cg%3E%3Ccircle fill='url(%23a)' r='3000'/%3E%3Cg opacity='0.5'%3E%3Ccircle fill='url(%23a)' r='2000'/%3E%3Ccircle fill='url(%23a)' r='1800'/%3E%3Ccircle fill='url(%23a)' r='1700'/%3E%3Ccircle fill='url(%23a)' r='1651'/%3E%3Ccircle fill='url(%23a)' r='1450'/%3E%3Ccircle fill='url(%23a)' r='1250'/%3E%3Ccircle fill='url(%23a)' r='1175'/%3E%3Ccircle fill='url(%23a)' r='900'/%3E%3Ccircle fill='url(%23a)' r='750'/%3E%3Ccircle fill='url(%23a)' r='500'/%3E%3Ccircle fill='url(%23a)' r='380'/%3E%3Ccircle fill='url(%23a)' r='250'/%3E%3C/g%3E%3Cg%3E%3Cuse href='%23g' transform='rotate(10)'/%3E%3Cuse href='%23g' transform='rotate(120)'/%3E%3Cuse href='%23g' transform='rotate(240)'/%3E%3C/g%3E%3Ccircle fill-opacity='0.8' fill='url(%23a)' r='3000'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-attachment: fixed;
  background-size: cover;
}

.background-logo {
  background-image: url("@/assets/LOGO-HEATMAP.png");
  background-size: cover;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
}
</style>
