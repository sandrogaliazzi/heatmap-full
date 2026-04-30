<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "login"]);

const handleLogin = () => {
  emit("login");
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    persistent
    width="auto"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-sheet
      class="pa-4 text-center mx-auto"
      elevation="12"
      max-width="600"
      rounded="lg"
      width="100%"
    >
      <v-icon
        class="mb-5"
        color="error"
        icon="mdi-alert-circle"
        size="112"
      ></v-icon>

      <h2 class="text-h5 mb-6">Seu Login expirou!</h2>

      <p class="mb-4 text-medium-emphasis text-body-2">
        É necessário fazer login novamente
        <br />
      </p>

      <v-divider class="mb-4"></v-divider>

      <div class="text-end">
        <v-btn
          class="text-none"
          color="orange"
          variant="flat"
          rounded
          to="/login"
          @click="handleLogin"
        >
          Fazer Login
        </v-btn>
      </div>
    </v-sheet>
  </v-dialog>
</template>
