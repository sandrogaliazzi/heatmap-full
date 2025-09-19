<script setup>
import { computed } from "vue";
import fetchApi from "@/api";

const { notes, ctoId } = defineProps(["notes", "ctoId"]);
const emit = defineEmits(["reloadNotes", "selectNote"]);

const fiberColor = {
  1: "verde",
  2: "amarela",
  3: "branca",
  4: "azul",
  5: "vermelha",
  6: "violeta",
  7: "marrom",
  8: "rosa",
  9: "preta",
  10: "cinza",
  11: "laranja",
  12: "acqua",
};

const archivedNotes = computed(() => {
  return notes.filter((note) => !note?.is_visible);
});

const activeNotes = computed(() => {
  return notes.filter((note) => note.is_visible);
});

const setNoteSubtitle = (note) => {
  if (note.slot_number == -1) return "";
  return `SPLITTER ${note.slot_number} ou VIA ${fiberColor[note.slot_number]}`;
};

const deleteNote = async (note) => {
  try {
    if (confirm("Deseja deletar essa nota?")) {
      const response = await fetchApi.put(`/notes/${note._id}`, {
        ...note,
        is_visible: false,
      });

      if (response.status === 200) {
        //triggerNotification("nota arquivada com sucesso", 200);
        alert("nota deletada com sucesso");
        emit("reloadNotes");
      }
    }
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    throw error;
  }
};
</script>

<template>
  <v-list density="compact" nav v-if="notes">
    <v-list-subheader>ANOTAÇÕES</v-list-subheader>
    <v-list-item
      v-for="note in activeNotes"
      :key="note.id"
      :value="note.id"
      :subtitle="setNoteSubtitle(note)"
      prepend-icon="mdi-text"
    >
      <v-list-title>
        <div class="text-wrap text-caption">{{ note.note }}</div>
      </v-list-title>
      <template #append>
        <v-btn
          color="grey-lighten-1"
          icon="mdi-pen"
          variant="text"
          size="small"
          class="d-none d-md-flex"
          @click="emit('selectNote', note)"
        ></v-btn>
        <v-btn
          color="grey-lighten-1"
          icon="mdi-delete"
          variant="text"
          size="small"
          class="d-none d-md-flex"
          @click="deleteNote(note)"
        ></v-btn>
      </template>
    </v-list-item>
  </v-list>
</template>
