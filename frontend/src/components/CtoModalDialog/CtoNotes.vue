<script setup>
import { onMounted, ref, watch } from "vue";

import fetchApi from "@/api";
import Noteslist from "./NotesList.vue";
import NotesForm from "./NotesForm.vue";

const props = defineProps(["ctoId", "connections", "loadingConnections"]);

const showForm = ref(false);
const note = ref("");
const selectedId = ref(null);
const notes = ref([]);
const loadingNotes = ref(true);
const loadingTomodatNotesSync = ref(false);
const notesLoadRequestId = ref(0);
const syncRequestId = ref(0);

const onSelectedNote = (n) => {
  showForm.value = true;
  selectedId.value = n._id;
  note.value = n.note;
};

const isCurrentNotesLoad = (requestId) =>
  requestId === notesLoadRequestId.value;
const isCurrentSync = (requestId) => requestId === syncRequestId.value;

const saveNote = async (noteData) => {
  try {
    const response = await fetchApi.post("/notes", noteData);

    return response.data;
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    throw error;
  }
};

const processAndSaveTomodatNotes = async (tomodatData) => {
  const tomodatNotes = tomodatData
    .map((d) => d.connection_slot_notes)
    .filter((note) => note?.length > 0);

  if (tomodatNotes.length > 0) {
    const documents = tomodatNotes.flat().map((n) => {
      const { id, note, slot_number } = n;
      return {
        id,
        note,
        slot_number,
        access_point_id: props.ctoId,
      };
    });

    await Promise.all(
      documents.map((noteData) => {
        return saveNote(noteData);
      }),
    );
  }
};

const fetchNotes = async () => {
  try {
    const response = await fetchApi("notes/access-point/" + props.ctoId);

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar notas");
    return [];
  }
};

const loadNotes = async () => {
  const requestId = notesLoadRequestId.value + 1;
  notesLoadRequestId.value = requestId;
  loadingNotes.value = true;

  try {
    const notesData = await fetchNotes();
    if (!isCurrentNotesLoad(requestId)) return;

    notes.value = notesData;
  } finally {
    if (isCurrentNotesLoad(requestId)) loadingNotes.value = false;
  }
};

const syncTomodatNotes = async (connections) => {
  const requestId = syncRequestId.value + 1;
  syncRequestId.value = requestId;

  if (!connections.length || !isCurrentSync(requestId)) return;

  loadingTomodatNotesSync.value = true;
  try {
    await processAndSaveTomodatNotes(connections);
    if (!isCurrentSync(requestId)) return;

    notes.value = await fetchNotes();
  } catch (error) {
    console.error("Erro ao sincronizar notas do Tomodat:", error);
  } finally {
    if (isCurrentSync(requestId)) loadingTomodatNotesSync.value = false;
  }
};

watch(
  () => props.connections,
  (connections = []) => {
    syncTomodatNotes(connections);
  },
);

watch(
  () => props.ctoId,
  () => {
    loadNotes();
  },
);

onMounted(() => {
  loadNotes();
});
</script>

<template>
  <v-dialog activator="parent" max-width="800">
    <template #default="{ isActive }">
      <v-card>
        <v-card-text>
          <v-progress-linear
            v-if="
              props.loadingConnections ||
              loadingNotes ||
              loadingTomodatNotesSync
            "
            indeterminate
            color="orange"
            class="mb-4"
          />
          <Noteslist
            :notes="notes"
            :cto-id="props.ctoId"
            @select-note="onSelectedNote"
            @reload-notes="loadNotes"
          />
          <NotesForm
            v-model:show-form="showForm"
            v-model:selected-id="selectedId"
            v-model:note="note"
            :cto-id="props.ctoId"
            @reload-notes="loadNotes"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="isActive.value = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
