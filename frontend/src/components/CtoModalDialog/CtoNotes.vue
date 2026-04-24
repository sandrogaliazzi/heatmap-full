<script setup>
import { ref } from "vue";

const props = defineProps(["notes", "ctoId", "loading"]);
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
  <v-dialog activator="parent" max-width="800">
    <template #default="{ isActive }">
      <v-card>
        <v-card-text>
          <v-progress-linear
            v-if="props.loading"
            indeterminate
            color="orange"
            class="mb-4"
          />
          <Noteslist
            :notes="props.notes"
            :cto-id="props.ctoId"
            @select-note="onSelectedNote"
            @reload-notes="() => emit('reloadNotes')"
          />
          <NotesForm
            v-model:show-form="showForm"
            v-model:selected-id="selectedId"
            v-model:note="note"
            :cto-id="props.ctoId"
            @reload-notes="() => emit('reloadNotes')"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="isActive.value = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
