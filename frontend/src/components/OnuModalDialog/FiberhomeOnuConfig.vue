<script setup>
import { ref } from "vue";
import FiberhomeOnuFormConfig from "./FiberhomeOnuFormConfig.vue";

const { onu } = defineProps({
  onu: {
    type: Object,
    required: true,
  },
});

const config = ref([]);
const slot = ref(onu?.slot || null);
const pon = ref(onu?.pon || null);

const onValueChanged = (value) => {
  config.value[value.configNumber - 1] = value;
};

const mountFiberhomeScript = (
  alias = "ONU-ALIAS",
  mac = onu.onuMac,
  oltIp = onu.oltIp,
  onuType = onu.onuType,
) => {
  let script = "";
  let veipServiceId = 0;

  const addOnu =
    `ADD-ONU::OLTID=${oltIp},PONID=1-1-${slot.value}-${pon.value}:CTAG::AUTHTYPE=MAC,ONUID=${mac},PWD=12345678,NAME=${alias},DESC=NA,ONUTYPE=${onuType};\r\n`.trim();

  const onuConfig = config.value.reduce((acc, onu) => {
    if (onu.configType === "veip") veipServiceId++;
    const script =
      onu.configType === "lan"
        ? `CFG-LANPORT::OLTID=${oltIp},PONID=1-1-${slot.value}-${pon.value},ONUIDTYPE=MAC,ONUID=${mac},ONUPORT=NA-NA-NA-${onu.portNumber}:CTAG::VLANMOD=${onu.vlanMode},PVID=${onu.vlan},PCOS=0;\r\n`.trim()
        : `CFG-VEIPSERVICE::OLTID=${oltIp},PONID=1-1-${slot.value}-${pon.value},ONUIDTYPE=MAC,ONUID=${mac},ONUPORT=NA-NA-NA-1:CTAG::ServiceId=${veipServiceId},CVLANID=${onu.vlan},ServiceModelProfile=INTELBRAS_ROUTER,ServiceType=DATA;\r\n`.trim();
    acc += script;

    return acc;
  }, "");

  script += addOnu + onuConfig;

  return script;
};

defineExpose({ mountFiberhomeScript, slot, pon });

const configNumber = ref(1);
</script>

<template>
  <v-row>
    <v-col>
      <v-text-field type="number" label="slot" v-model="slot"></v-text-field>
    </v-col>
    <v-col>
      <v-text-field type="number" label="pon" v-model="pon"></v-text-field>
    </v-col>
  </v-row>
  <FiberhomeOnuFormConfig
    v-for="i in configNumber"
    :key="i"
    @value-changed="onValueChanged"
    :configNumber="i"
  />
  <div class="d-flex justify-space-between ga-2">
    <div class="d-flex ga-2">
      <v-btn
        @click="configNumber++"
        variant="tonal"
        size="small"
        icon="mdi-plus"
      ></v-btn>
      <v-btn
        @click="
          configNumber--;
          config.pop();
        "
        variant="tonal"
        size="small"
        icon="mdi-minus"
        v-if="configNumber > 1"
      ></v-btn>
    </div>
  </div>
</template>
