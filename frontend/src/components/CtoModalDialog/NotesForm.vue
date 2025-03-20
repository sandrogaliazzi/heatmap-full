<script setup>
import { ref, defineModel } from "vue";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";

const showForm = defineModel("showForm");
const selectedId = defineModel("selectedId");
const note = defineModel("note");

const { ctoId } = defineProps(["ctoId"]);
const emit = defineEmits(["reloadNotes"]);

const notification = useNotificationStore();

const triggerNotification = (msg, status) => {
  notification.setNotification({
    msg,
    status: status === 201 || 200 ? "success" : "error",
  });
};

const editNote = async (data, id) => {
  try {
    const response = await fetchApi.put(`/notes/${id}`, {
      ...data,
    });

    return response;
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    throw error;
  }
};

const saveNote = async (note) => {
  try {
    const response = await fetchApi.post("/notes", note);

    const savedNote = response.data;
    console.log("Nota salva com sucesso:", savedNote);
    return savedNote;
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    throw error;
  }
};

const onSaveNoteClick = async () => {
  if (!note.value) {
    alert("o campo nota não pode ser vazio!");
  } else {
    if (confirm("deseja salvar esta nota?")) {
      const newNote = {
        note: note.value,
        slot_number: -1,
        is_visible: true,
        access_point_id: ctoId,
      };

      let response = null;

      if (selectedId.value) {
        response = await editNote(newNote, selectedId.value);
      } else {
        response = await saveNote(newNote);
      }

      if (response) triggerNotification("Nota salva com sucesso", 201);
      else triggerNotification("Erro ao salvar nota", 400);

      emit("reloadNotes");
    }
  }
};

const closeForm = () => {
  note.value = "";
  selectedId.value = null;
  showForm.value = false;
};
</script>
<template>
  <div class="mt-4">
    <v-btn
      color="success"
      size="small"
      icon="mdi-plus"
      @click="showForm = !showForm"
    ></v-btn>
    <v-btn
      color="error"
      size="small"
      class="ml-2"
      v-if="showForm"
      icon="mdi-close"
      @click="closeForm"
    ></v-btn>
  </div>
  <v-container v-if="showForm">
    <v-row>
      <v-col cols="12">
        <v-text-field
          label="Nota"
          append-inner-icon="mdi-plus"
          @click:append-inner="onSaveNoteClick"
          variant="outlined"
          v-model="note"
        ></v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>
