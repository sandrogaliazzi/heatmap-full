const gerarScriptOnu = (vlanData, flowProfile, alias, mac, hasUnaddedOnu) => {
  // 1️⃣ Agrupa as portas por nome de profile
  const profiles = {};
  for (const [port, cfg] of Object.entries(vlanData)) {
    const name = cfg.name;
    if (!profiles[name]) profiles[name] = [];
    profiles[name].push(Number(port));
  }

  // 2️⃣ Função auxiliar para gerar ranges consecutivos (ex: [2,3,4] -> "2-4")
  const agruparPortas = (ports) => {
    const sorted = ports.sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = prev = curr;
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    return ranges;
  };

  // 3️⃣ Gera as linhas do script
  const portasTotal = Object.keys(vlanData)
    .map(Number)
    .sort((a, b) => a - b);
  const script = [];

  // Ethernet profile (todas as portas)
  const uniPortRange =
    portasTotal.length === 1
      ? `${portasTotal[0]}`
      : `${portasTotal[0]}-${portasTotal.at(-1)}`;

  if (hasUnaddedOnu) {
    script.push(`onu add serial-number ${mac}`);
  }
  script.push(`onu ${mac} ethernet-profile auto-on uni-port ${uniPortRange}`);

  // VLAN translation profiles
  for (const [profileName, ports] of Object.entries(profiles)) {
    const ranges = agruparPortas(ports);
    ranges.forEach((r) => {
      script.push(
        `onu ${mac} vlan-translation-profile ${profileName} uni-port ${r}`
      );
    });
  }

  // Configurações adicionais
  script.push(`onu ${mac} upstream-fec disabled`);
  script.push(`onu ${mac} flow-profile ${flowProfile}`);
  script.push(`onu ${mac} alias ${alias.toUpperCase()}`);

  return script.join("\n");
};

export default gerarScriptOnu;
