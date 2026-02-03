import express from "express";
import users from "./userRoutes.js";
import tomodat from "./tomodatRoutes.js";
import token from "./tokenRoutes.js";
import fetch from "./fetchRoutes.js";
import cto from "./ctoClientRoutes.js";
import tracking from "./trackingRoutes.js";
import login from "./loginRoutes.js";
import instalacoes from "./instalacoesRoutes.js";
import vlan from "./vlanRoutes.js";
import pppoe from "./pppoeRoutes.js";
import equipament from "./equipamentRoutes.js";
import backup from "./backupRoutes.js";
import olt from "./oltRoutes.js";
import onu from "./onuClienteRoutes.js";
import ramal from "./ramalLogRoutes.js";
import sales from "./salesRoutes.js";
import event from "./eventRoutes.js";
import messages from "./messageRoutes.js";
import cables from "./cableRoutes.js";
import notes from "./noteRoutes.js";
import mkOs from "./mkOsRoutes.js";
import fullTrack from "./fullTrackRoutes.js";
import reservados from "./reservadosRoutes.js";
import macVendor from "./macVendorRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import auditoria from "./auditoriaRoutes.js";
import pdfRoutes from "./pdfRoutes.js";

const routes = (app) => {
  app.route("/").get((req, res) => {
    res.status(200).send({
      message:
        "Este é o servidor BACKEND da aplicação da Conectnet Telecomunicações",
    });
  });

  app.use(
    express.json(),
    users,
    tomodat,
    token,
    fetch,
    cto,
    tracking,
    login,
    instalacoes,
    vlan,
    pppoe,
    equipament,
    backup,
    olt,
    onu,
    ramal,
    sales,
    event,
    messages,
    cables,
    notes,
    mkOs,
    fullTrack,
    reservados,
    macVendor,
    uploadRoutes,
    auditoria,
    pdfRoutes,
  );
};

export default routes;
