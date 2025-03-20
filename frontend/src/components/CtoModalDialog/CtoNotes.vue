<script setup>
import { ref } from "vue";

const { notes, ctoId } = defineProps(["notes", "ctoId"]);
const emit = defineEmits(["reloadNotes", "selectNote"]);

const showForm = ref(false);
const note = ref("");
const selectedId = ref(null);

import Noteslist from "./NotesList.vue";
import NotesForm from "./NotesForm.vue";

const onSelectedNote = (n) => {
  showForm.value = true;
  selectedId.value = n._id;
  note.value = n.note;
};
</script>

<template>
  <Noteslist
    :notes="notes"
    :cto-id="ctoId"
    @select-note="onSelectedNote"
    @reload-notes="() => emit('reloadNotes')"
    v-if="notes"
  />
  <NotesForm
    v-model:show-form="showForm"
    v-model:selected-id="selectedId"
    v-model:note="note"
    :cto-id="ctoId"
    @reload-notes="() => emit('reloadNotes')"
  />
</template>
