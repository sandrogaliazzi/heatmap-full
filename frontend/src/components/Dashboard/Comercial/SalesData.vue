<script setup>
import { ref } from "vue";
import fetchApi from "@/api";
import EditSaleForm from "@/components/Dashboard/Comercial/EditSaleForm";

const { data, seller } = defineProps(["data", "seller"]);
const emit = defineEmits(["delete-sale"]);

const dialog = ref(false);
const sales = ref(null);
const sale = ref(null);

const emojis = ref({
  Venda: "💰",
  Upgrade: "⬆️",
  ["Novo Ponto"]: "🆕",
});

const headers = ref([
  { key: "seller", title: "Vendedor" },
  { key: "client", title: "Cliente" },
  { key: "ticket", title: "Plano" },
  { key: "city", title: "Cidade" },

  { key: "saleCategory", title: "tipo" },
  {
    key: "date",
    title: "Data",
    value: (item) => {
      const [year, month, day] = item.date.split("-");
      return `${day}/${month}/${year}`;
    },
  },
  {
    title: "Deletar",
    key: "actions",
    sortable: false,
  },
]);

const fetchAllSales = async () => {
  try {
    const response = await fetchApi("/sales");
    if (response.status === 200) {
      sales.value = response.data;
    }
  } catch (error) {
    console.error(error);
  }
};

const deleteItem = async (item) => {
  if (confirm("Deseja excluir está venda?")) {
    try {
      const response = await fetchApi.delete(`/salesdelete/${item._id}`);

      if (response.status === 200) {
        alert("Venda deletada com sucesso");
        emit("delete-sale", item.seller);
      } else {
        alert("ocorreu um erro, tente novamente");
      }
    } catch (error) {
      console.error("Erro ao excluir a venda:", error);
      alert("Ocorreu um erro ao excluir a venda, tente novamente");
    }
  }
};

const editItem = (item) => {
  dialog.value = true;
  sale.value = item;
};

const search = ref("");
</script>
<template>
  <v-dialog v-model="dialog">
    <v-card class="py-5 px-5 mx-auto" min-width="750">
      <EditSaleForm :sale="sale" @close-form="dialog = false"></EditSaleForm>
      <template v-slot:actions>
        <v-btn class="ms-auto" text="Cancelar" @click="dialog = false"></v-btn>
      </template>
    </v-card>
  </v-dialog>
  <v-card>
    <v-card-text>
      <v-card flat>
        <v-card-title class="d-flex ga-2">
          <span>Vendas</span>
          <v-chip closable @click:close="fetchAllSales">
            {{ seller.name }}
          </v-chip>
        </v-card-title>
        <template v-slot:text>
          <v-text-field
            v-model="search"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            single-line
            variant="outlined"
            hide-details
          ></v-text-field>
        </template>

        <v-data-table
          :headers="headers"
          :items="sales ? sales : data"
          :search="search"
        >
          <template #item.saleCategory="{ item }"
            >{{ emojis[item?.saleCategory] }}
            {{ item?.saleCategory?.toUpperCase() }}</template
          >
          <template v-slot:item.actions="{ item }">
            <v-icon size="small" @click="deleteItem(item)"> mdi-delete </v-icon>
            <v-icon size="small" @click="editItem(item)" class="ml-3">
              mdi-pencil
            </v-icon>
          </template>
        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>
</template>
