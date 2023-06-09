sap.ui.define(
    [
        "./BaseController",
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Fragment",
        "sap/m/MessageBox",
        "sap/m/MessageToast",
        "../myServices/oDataService",
        "../myServices/iasService",
        "../model/formatter",
        "../model/models"
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (
        BaseController,
        Controller,
        Filter,
        FilterOperator,
        JSONModel,
        Fragment,
        MessageBox,
        MessageToast,
        oDataService,
        iasService,
        formatter,
        models
    ) {
        "use strict";
        let that;
        let deployed;

        return BaseController.extend("clientportal.saasa.com.pe.usermanager.controller.Main", {
            formatter: formatter,
            onInit: function () {
                that = this;

                //Referencias principales
                that.oAppModel = this.getOwnerComponent().getModel();
                that.sEmail =
                    sap.ushell === undefined ? "gabriel.yepes@saasa.com.pe" : sap.ushell.Container.getService("UserInfo").getUser().getEmail();

                that.ambiente = "PRD";

                that.appNamespace = that.ambiente === "QAS" ? "CLIENTPORTAL" : "PORTAL";

                if (that.ambiente === "QAS") {
                    that.rolBaseId = "af492883-9776-4ff4-b1bc-cd8478e5f564";
                    that.rolAdmin = that.ambiente + "_" + that.appNamespace.toUpperCase() + "_USERMANAGERADMIN";
                } else if (that.ambiente === "PRD") {
                    that.rolBaseId = "c261303c-477d-4cea-a5db-88824f7491cc";
                    that.rolAdmin = that.ambiente + "_" + that.appNamespace.toUpperCase() + "_ADMIN_PORTAL";
                }
                deployed = !(sap.ushell === undefined);
                if (that.sEmail === undefined) {
                    that.sEmail = "kospina@novategica.com";
                }
                //Creacion de modelos
                that.setModel(new JSONModel({}), "AppModel");
                that.setModel(new JSONModel({}), "NewUserModel");
                that.setModel(new JSONModel({}), "ConfigModel");
                that.setModel(new JSONModel({ total: 1, loaded: 0 }), "LoadingModel");

                that.getModel("AppModel").setSizeLimit("2000");

                //Metodos para la data
                //this.onGetAppData();
                this.onGetDataMaestra();
                this.onGetAppDataAsync();

                //Metodos para los estilos iniciales y vista
                this.onAddStyles();
            },
            /* onGetAppData: function () {
                let oTitle = this.byId("idUserTableTitle");
                let aFilters = [],
                    oParameters = {};
                let aEstados = [];

                sap.ui.core.BusyIndicator.show();

                //Lectura de data maestra
                oParameters = {
                    $expand: "ToTipoTabla($select=TABLA)",
                };
                oDataService
                    .oDataRead(that.oAppModel, "MasterSet", oParameters, aFilters)
                    .then((oResult) => {
                        oResult.results.forEach((registro) => {
                            if (registro.ToTipoTabla.TABLA === "STATUS_USUARIOS") {
                                registro.CONTENIDO_SECUNDARIO = Boolean(registro.CONTENIDO_SECUNDARIO); //Debe ser booleano
                                aEstados.push(registro);
                            }

                            if (registro.ToTipoTabla.TABLA === "DIRECCION_IAS") {
                                that.sIasUrl = registro.CONTENIDO;
                            }
                        });
                        that.getModel("AppModel").getData()["Estados"] = aEstados;
                        that.getModel("AppModel").refresh(true);
                    })
                    .catch((oError) => {
                        console.log(oError);
                    });

                //Lectura de usuario logueado
                let sFilters = 'emails.value eq "' + that.sEmail + '"';
                iasService
                    .readUsers(deployed, sFilters)
                    .then((oResult) => {
                        that.sUser = oResult.Resources[0];
                        //that.getModel("AppModel").getData()["UsuarioActual"] = that.formatUsersArray(oResult.Resources)[0];

                        //Leer roles del usuario
                        sFilters = 'urn:sap:cloud:scim:schemas:extension:custom:2.0:Group:name co "' + that.rolAdmin + '"';
                        return iasService.readGroups(deployed, sFilters);
                    })
                    .then((oResult) => {
                        let oAdminRol = oResult.Resources[0];
                        that.getModel("AppModel").getData()["IsAdmin"] = that.sUser.groups
                            .map((rol) => {
                                return rol.value;
                            })
                            .includes(oAdminRol.id);
                        that.getModel("AppModel").refresh(true);
                        if (that.getModel("AppModel").getData()["IsAdmin"]) {
                            sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal"';
                        } else {
                            sFilters =
                                'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal" and ' +
                                'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' +
                                that.sUser["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].costCenter +
                                '"';
                        }
                        return iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));
                    })
                    .then((oResult) => {

                        //CAMBIO 17-09-2022 -> Obtener los usuarios segun cada perfil
                        that.getModel("AppModel").getData().aAgtAduana = oResult.Resources.filter((x) => {
                            return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                        }).filter((y) => {
                            return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                                return z.name.includes("customAttribute3");
                            });
                        });
                        that.getModel("AppModel").getData().nAgtAduana = oResult.Resources.filter((x) => {
                            return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                        }).filter((y) => {
                            return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                                return z.name.includes("customAttribute3");
                            });
                        }).length;

                        that.getModel("AppModel").getData().aAgtCarga = oResult.Resources.filter((x) => {
                            return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                        }).filter((y) => {
                            return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                                return z.name.includes("customAttribute4");
                            });
                        });
                        that.getModel("AppModel").getData().nAgtCarga = oResult.Resources.filter((x) => {
                            return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                        }).filter((y) => {
                            return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                                return z.name.includes("customAttribute4");
                            });
                        }).length;

                        that.getModel("AppModel").getData().aClientes = oResult.Resources.filter((x) => {
                            return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                        }).filter((y) => {
                            return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                                return z.name.includes("customAttribute5");
                            });
                        });
                        that.getModel("AppModel").getData().nClientes = oResult.Resources.filter((x) => {
                            return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                        }).filter((y) => {
                            return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                                return z.name.includes("customAttribute5");
                            });
                        }).length;

                        //END CAMBIO 17-09-2022

                        //Aqui se deben diferenciar entre los ambientes
                        //Lectura de usuarios con esquema custom
                        let aUsers = [];
                        if (oResult.Resources !== undefined) {
                            oResult.Resources.filter((user) => {
                                return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                            }).forEach((UserCustom) => {
                                if (
                                    UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((customAt) => {
                                        if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)) {
                                            return customAt;
                                        }
                                    })
                                ) {
                                    aUsers.push(UserCustom);
                                }
                            });
                        }
                        //Fin de lectura

                        if (aUsers.length !== 0) {
                            that.getModel("AppModel").getData()["UsuariosPrincipales"] = that.formatUsersArray(aUsers);
                            that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = aUsers.length;
                        } else {
                            that.getModel("AppModel").getData()["UsuariosPrincipales"] = [];
                            that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = 0;
                        }

                        that.getModel("AppModel").refresh(true);
                    })
                    .finally((oFinal) => {
                        that.onAddTableActions();
                        sap.ui.core.BusyIndicator.hide();
                    })
                    .catch((oError) => {
                        console.log(oError);
                    });

                sFilters = 'urn:sap:cloud:scim:schemas:extension:custom:2.0:Group:name co "' + that.ambiente + "_" + that.appNamespace + '"'; //Filtro para Names
                // sFilters = 'displayName co "' + that.appNamespace + '"'; //Filtro para DisplayNames
                sap.ui.core.BusyIndicator.show();

                iasService
                    .readGroups(deployed, sFilters)
                    .then((oResult) => {
                        that.getModel("AppModel").getData()["Groups"] = that.formatGroupsArray(oResult.Resources);
                        that.getModel("AppModel").refresh(true);
                    })
                    .finally((oFinal) => {
                        sap.ui.core.BusyIndicator.hide();
                    })
                    .catch((oError) => {
                        console.log(oError);
                    });
            }, */
            onGetAppDataAsync: async function () {
                try {
                    let oTitle = this.byId("idUserTableTitle");
                    let oIasServiceReading;
                    sap.ui.core.BusyIndicator.show();
    
                    //Lectura de usuario logueado
                    let sFilters = 'emails.value eq "' + that.sEmail + '"';
                    oIasServiceReading = await iasService.readUsers(deployed, sFilters);
                    that.sUser = oIasServiceReading.Resources[0];
                    console.log("USUARIO LOGUEADO: ", that.sUser);
    
                    //Leer roles del usuario
                    sFilters = 'urn:sap:cloud:scim:schemas:extension:custom:2.0:Group:name co "' + that.rolAdmin + '"';
                    oIasServiceReading = await iasService.readGroups(deployed, sFilters);
                    let oAdminRol = oIasServiceReading.Resources[0];
                    that.getModel("AppModel").getData()["IsAdmin"] = that.sUser.groups.map((rol) => { return rol.value; }).includes(oAdminRol.id);
    
                    if (that.getModel("AppModel").getData()["IsAdmin"]) {
                        sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal"';
                    } else {
                        sFilters =
                            'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal" and ' +
                            'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' +
                            that.sUser["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].costCenter +
                            '"';
                    }
                    this._openDialogDinamic("busyDialogGeneric");
                    oIasServiceReading = await iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));
    
                    //Aqui se deben diferenciar entre los ambientes
                    //Lectura de usuarios con esquema custom
                    let aUsers = [];
                    if (oIasServiceReading.Resources !== undefined) {
                        oIasServiceReading.Resources.filter((user) => {
                            return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                        }).forEach((UserCustom) => {
                            if (
                                UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((customAt) => {
                                    if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)) {
                                        return customAt;
                                    }
                                })
                            ) {
                                aUsers.push(UserCustom);
                            }
                        });
                    }
                    //Fin de lectura
                    //CAMBIO 17-09-2022 -> Obtener los usuarios segun cada perfil
                    that.getModel("AppModel").getData().aAgtAduana = aUsers.filter((x) => {
                        return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                    }).filter((y) => {
                        return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                            return z.name.includes("customAttribute3");
                        });
                    });
                    that.getModel("AppModel").getData().nAgtAduana = aUsers.filter((x) => {
                        return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                    }).filter((y) => {
                        return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                            return z.name.includes("customAttribute3");
                        });
                    }).length;
    
                    that.getModel("AppModel").getData().aAgtCarga = aUsers.filter((x) => {
                        return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                    }).filter((y) => {
                        return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                            return z.name.includes("customAttribute4");
                        });
                    });
                    that.getModel("AppModel").getData().nAgtCarga = aUsers.filter((x) => {
                        return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                    }).filter((y) => {
                        return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                            return z.name.includes("customAttribute4");
                        });
                    }).length;
    
                    that.getModel("AppModel").getData().aClientes = aUsers.filter((x) => {
                        return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                    }).filter((y) => {
                        return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                            return z.name.includes("customAttribute5");
                        });
                    });
                    that.getModel("AppModel").getData().nClientes = aUsers.filter((x) => {
                        return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                    }).filter((y) => {
                        return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((z) => {
                            return z.name.includes("customAttribute5");
                        });
                    }).length;
    
                    //END CAMBIO 17-09-2022
                    if (aUsers.length !== 0) {
                        that.getModel("AppModel").getData()["UsuariosPrincipales"] = that.formatUsersArray(aUsers);
                        that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = aUsers.length;
                    } else {
                        that.getModel("AppModel").getData()["UsuariosPrincipales"] = [];
                        that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = 0;
                    }
    
                    //LECTURA DE GRUPOS
                    sFilters = 'urn:sap:cloud:scim:schemas:extension:custom:2.0:Group:name co "' + that.ambiente + "_" + that.appNamespace + '"'; //Filtro para Names
                    // sFilters = 'displayName co "' + that.appNamespace + '"'; //Filtro para DisplayNames
                    oIasServiceReading = await iasService.readGroups(deployed, sFilters);
                    that.getModel("AppModel").getData()["Groups"] = that.formatGroupsArray(oIasServiceReading.Resources);
                    that.getModel("AppModel").refresh(true);
                    that.onAddTableActions();
                }catch(oError){
                    that.controlXHRErrors(oError);
                }finally{
                    this._onCloseDialogDinamic("busyDialogGeneric");
                    sap.ui.core.BusyIndicator.hide();
                }
            },

            onGetDataMaestra: async function () {
                let aFilters = [],
                    oParameters = {};
                let aEstados = [];
                let oMasterSearch;
                //Lectura de data maestra
                oParameters = { $expand: "ToTipoTabla($select=TABLA)" };

                //DATOS MAESTROS
                oMasterSearch = await oDataService.oDataRead(that.oAppModel, "MasterSet", oParameters, aFilters);
                aEstados = oMasterSearch.results.filter((registro) => { return registro.ToTipoTabla.TABLA === "STATUS_USUARIOS"; });
                for (let oEstado of aEstados) {
                    oEstado.CONTENIDO_SECUNDARIO = Boolean(oEstado.CONTENIDO_SECUNDARIO);
                }

                that.sIasUrl = oMasterSearch.results.find(registro => { return registro.ToTipoTabla.TABLA === "DIRECCION_IAS"; }).CONTENIDO;

                that.getModel("AppModel").getData().Estados = aEstados;
                that.getModel("AppModel").getData().oVigenciaBase = oMasterSearch.results.find(registro => { return registro.ToTipoTabla.TABLA === "CONSTANTES_GESTOR_USUARIOS" && registro.CODIGO === "ANOS_VIGENCIA_BASE"}) 
                that.getModel("AppModel").refresh();
            },

            onAddTableActions: function () {
                let oTable = this.byId("idUserTable");
                let oAdmin = that.getModel("AppModel").getData().IsAdmin;
                let fnPressDelete = this.handleActionDelete.bind(that),
                    fnPressBlock = this.handleActionBlock.bind(that),
                    fnPressEdit = this.handleActionEdit.bind(that),
                    fnPressUploadDNI = this.handleActionUploadDNI.bind(that),
                    fnPressNavigate = this.handleActionNav.bind(that),
                    fnPressAddRole = this.handleActionAddRole.bind(that);
                let oTemplate = new sap.ui.table.RowAction({
                    items: [
                        new sap.ui.table.RowActionItem({
                            type: "Navigation",
                            press: fnPressNavigate,
                            visible: true,
                        }),
                        new sap.ui.table.RowActionItem({
                            icon: "sap-icon://edit",
                            text: "Editar",
                            press: fnPressEdit,
                            visible: oAdmin,
                        }),
                        new sap.ui.table.RowActionItem({
                            icon: "sap-icon://business-card",
                            text: "Gestionar DNI",
                            press: fnPressUploadDNI,
                            visible: oAdmin,
                        }),
                        new sap.ui.table.RowActionItem({
                            icon: "sap-icon://delete",
                            text: "Borrar",
                            press: fnPressDelete,
                            visible: oAdmin,
                        }),
                        new sap.ui.table.RowActionItem({
                            icon: "sap-icon://cancel",
                            text: "Activar // Desactivar",
                            press: fnPressBlock,
                            visible: oAdmin,
                        }),
                        new sap.ui.table.RowActionItem({
                            icon: "sap-icon://role",
                            text: "Agregar roles",
                            press: fnPressAddRole,
                            visible: oAdmin,
                        }),
                    ],
                });

                oTable.setRowActionTemplate(oTemplate);
                oTable.setRowActionCount(4);
            },
            handleActionDelete: function (oEvent) {
                let sPath = oEvent.getParameter("row").getBindingContext("AppModel").sPath.split("/")[1];
                let sIndex = oEvent.getParameter("row").getBindingContext("AppModel").sPath.split("/")[2];
                that.getModel("AppModel").getData()["UsuarioActual"] = that.getModel("AppModel").getData()[sPath][sIndex];
                that.getModel("AppModel").refresh(true);

                let sFilters;
                MessageBox.alert(that._getI18nText("msgOnAskDeleteUser", that.getModel("AppModel").getData()["UsuarioActual"].Correo), {
                    actions: ["Borrar usuario", "Cancelar"],
                    emphasizedAction: "Borrar usuario",
                    onClose: function (sAction) {
                        if (sAction === "Borrar usuario") {
                            sap.ui.core.BusyIndicator.show();
                            //No dejar borrar con secundarios - Comentado hasta que lo negocien
                            /* sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' + that.getModel("AppModel").getData()["UsuarioActual"].Ruc + '"'
                                              + ' and ' + 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                                            iasService.readUsersWithPagination(true, sFilters).then(oResult => {
                                              if (oResult.totalResults !== 0){
                                                  MessageBox.error(that._getI18nText("msgOnErrorHasMoreUsers")); 
                                              }else{
                                                  return iasService.deleteSingleUser(deployed, that.getModel("AppModel").getData()["UsuarioActual"].UserId);
                                              }
                                            }) */
                            iasService
                                .deleteSingleUser(deployed, that.getModel("AppModel").getData()["UsuarioActual"].UserId)
                                .then((oResult) => {
                                    if (oResult !== undefined) {
                                        MessageToast.show(that._getI18nText("msgOnSuccessDeleteUser"));
                                    }

                                    sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal"';
                                    return iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));
                                })
                                .then((oResult) => {

                                    //Aqui se deben diferenciar entre los ambientes
                                    //Lectura de usuarios con esquema custom
                                    let aUsers = [];
                                    if (oResult.Resources !== undefined) {
                                        oResult.Resources.filter((user) => {
                                            return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                                        }).forEach((UserCustom) => {
                                            if (
                                                UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((customAt) => {
                                                    if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)) {
                                                        return customAt;
                                                    }
                                                })
                                            ) {
                                                aUsers.push(UserCustom);
                                            }
                                        });
                                    }
                                    //Fin de lectura

                                    if (aUsers.length !== 0) {
                                        that.getModel("AppModel").getData()["UsuariosPrincipales"] = that.formatUsersArray(aUsers);
                                        that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = aUsers.length;
                                    } else {
                                        that.getModel("AppModel").getData()["UsuariosPrincipales"] = [];
                                        that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = 0;
                                    }

                                    that.getModel("AppModel").refresh(true);
                                })
                                .finally((oFinal) => {
                                    sap.ui.core.BusyIndicator.hide();
                                })
                                .catch((oError) => {
                                    console.log(oError);
                                });
                        }
                    },
                });
            },
            handleActionBlock: function (oEvent) {
                let sPath = oEvent.getParameter("row").getBindingContext("AppModel").sPath.split("/")[1];
                let sIndex = oEvent.getParameter("row").getBindingContext("AppModel").sPath.split("/")[2];
                that.getModel("AppModel").getData()["UsuarioActual"] = that.getModel("AppModel").getData()[sPath][sIndex];
                that.getModel("AppModel").refresh(true);
                //Formatear campos
                this.getModel("NewUserModel").getData().Name = that.getModel("AppModel").getData()["UsuarioActual"].Nombres;
                this.getModel("NewUserModel").getData().LastName1 = that.getModel("AppModel").getData()["UsuarioActual"].Apellidos.split(" ")[0];
                this.getModel("NewUserModel").getData().LastName2 = that.getModel("AppModel").getData()["UsuarioActual"].Apellidos.split(" ")[1];
                this.getModel("NewUserModel").getData().Email = that.getModel("AppModel").getData()["UsuarioActual"].Correo;
                this.getModel("NewUserModel").getData().Phone = that.getModel("AppModel").getData()["UsuarioActual"].Telefono;
                this.getModel("NewUserModel").getData().ExpiracyDate = that.getModel("AppModel").getData()["UsuarioActual"].Vigencia;

                //Setear campos heredados
                this.getModel("NewUserModel").getData().Ruc = this.getModel("AppModel").getData()["UsuarioActual"].Ruc;
                this.getModel("NewUserModel").getData().RazonSocial = this.getModel("AppModel").getData()["UsuarioActual"].RazonSocial;

                let oUserEdited = this.getModel("NewUserModel").getData();

                let oUserObject = that.getUserObject(oUserEdited, "Principal"),
                    sFilters,
                    sMensaje;
                oUserObject.active = this.getModel("AppModel").getData()["UsuarioActual"].Status;
                // Bloquear usuario
                if (oUserObject.active) {
                    oUserObject.active = false;
                    sMensaje = this._getI18nText("msgOnSuccessBlockedUser");
                } else {
                    oUserObject.active = true;
                    sMensaje = this._getI18nText("msgOnSuccessUnlockedUser");
                }
                sap.ui.core.BusyIndicator.show();
                iasService
                    .updateByPutUser(deployed, oUserObject, that.getModel("AppModel").getData()["UsuarioActual"]["UserId"])
                    .then((oResult) => {
                        MessageToast.show(sMensaje);
                        sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal"';
                        return iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));
                    })
                    .then((oResult) => {

                        //Aqui se deben diferenciar entre los ambientes
                        //Lectura de usuarios con esquema custom
                        let aUsers = [];
                        if (oResult.Resources !== undefined) {
                            oResult.Resources.filter((user) => {
                                return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                            }).forEach((UserCustom) => {
                                if (
                                    UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((customAt) => {
                                        if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)) {
                                            return customAt;
                                        }
                                    })
                                ) {
                                    aUsers.push(UserCustom);
                                }
                            });
                        }
                        //Fin de lectura

                        if (aUsers.length !== 0) {
                            that.getModel("AppModel").getData()["UsuariosPrincipales"] = that.formatUsersArray(aUsers);
                            that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = aUsers.length;
                        } else {
                            that.getModel("AppModel").getData()["UsuariosPrincipales"] = [];
                            that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = 0;
                        }

                        that.getModel("AppModel").refresh(true);
                    })
                    .catch((oError) => {
                        MessageBox.error(oError);
                    })
                    .finally((oFinal) => {
                        sap.ui.core.BusyIndicator.hide();
                        oDialog.close();
                    });
            },
            handleActionEdit: function (oEvent) {
                let sPath = oEvent.getParameter("row").getBindingContext("AppModel").sPath.split("/")[1];
                let sIndex = oEvent.getParameter("row").getBindingContext("AppModel").sPath.split("/")[2];
                that.getModel("AppModel").getData()["UsuarioActual"] = that.getModel("AppModel").getData()[sPath][sIndex];
                that.getModel("AppModel").refresh(true);

                this._openDialogDinamic("newUser");

                //Formatear campos
                this.getModel("NewUserModel").getData().Name = that.getModel("AppModel").getData()["UsuarioActual"].Nombres;
                this.getModel("NewUserModel").getData().LastName1 = that.getModel("AppModel").getData()["UsuarioActual"].Apellidos.split(" ")[0];
                this.getModel("NewUserModel").getData().LastName2 = that.getModel("AppModel").getData()["UsuarioActual"].Apellidos.split(" ")[1];
                this.getModel("NewUserModel").getData().Email = that.getModel("AppModel").getData()["UsuarioActual"].Correo;
                this.getModel("NewUserModel").getData().Phone = that.getModel("AppModel").getData()["UsuarioActual"].Telefono;
                this.getModel("NewUserModel").getData().ExpiracyDate = that.getModel("AppModel").getData()["UsuarioActual"].Vigencia;
                this.getModel("NewUserModel").getData().RolAgenteAduana = that.getModel("AppModel").getData()["UsuarioActual"].RolAgenteAduana;
                this.getModel("NewUserModel").getData().RolAgenteCarga = that.getModel("AppModel").getData()["UsuarioActual"].RolAgenteCarga;
                this.getModel("NewUserModel").getData().RolCliente = that.getModel("AppModel").getData()["UsuarioActual"].RolCliente;

                //Setear campos heredados
                this.getModel("NewUserModel").getData().Ruc = this.getModel("AppModel").getData()["UsuarioActual"].Ruc;
                this.getModel("NewUserModel").getData().RazonSocial = this.getModel("AppModel").getData()["UsuarioActual"].RazonSocial;

                //Setear configuracion
                this.getModel("ConfigModel").getData()["visibleEditUserDialog"] = true;
                this.getModel("ConfigModel").getData()["visibleNewUserDialog"] = false;
                this.getModel("ConfigModel").getData()["editableRuc"] = false;
                this.getModel("ConfigModel").getData()["editableMail"] = false;

                this.getModel("ConfigModel").getData()["newUserDialogTitle"] = this._getI18nText("btnEditarUsuario");

                this.getModel("NewUserModel").refresh(true);
                this.getModel("ConfigModel").refresh(true);
                this["onewUser"].setModel(this.getModel("NewUserModel"));
                this["onewUser"].setModel(this.getModel("ConfigModel"));
            },
            handleActionNav: function (oEvent) {
                let sPath = oEvent.getParameter("row").getBindingContext("AppModel").sPath.split("/")[1];
                let sIndex = oEvent.getParameter("row").getBindingContext("AppModel").sPath.split("/")[2];
                let oObject = that.getModel("AppModel").getData()[sPath][sIndex];

                let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteDetail", {
                    usuarioPrincipal: oObject.UserId,
                    isAdmin: that.getModel("AppModel").getData().IsAdmin,
                });
            },
            handleActionAddRole: async function (oEvent) {
                let oUserIas;
                let oUsuario = oEvent.getParameter("row").getBindingContext("AppModel").getObject();

                sap.ui.core.BusyIndicator.show();
                oUserIas = await iasService.readSingleUser(deployed, oUsuario.UserId);
                if (that.ambiente === "QAS") {
                    oUsuario.Grupos = oUserIas.groups.filter((x) => {
                        return x.display.includes("ClientPortal") && x.display.includes("DEV/QAS");
                    });
                } else if (that.ambiente === "PRD") {
                    oUsuario.Grupos = oUserIas.groups.filter((x) => {
                        return x.display.includes("ClientPortal") && x.display.includes("PRD");
                    });
                }
                that.getModel("AppModel").getData().tempGroups = that.getModel("AppModel").getData().Groups.filter(x => { return !oUsuario.Grupos.find(y => { return y.value === x.GroupId; }); });

                that.getModel("AppModel").getData()["UsuarioActual"] = oUsuario;
                that.getModel("AppModel").refresh(true);
                sap.ui.core.BusyIndicator.hide();

                that._openDialogDinamic("assignRolesMain");

                that["oassignRolesMain"].setModel(that.getModel("AppModel"));
            },

            handleActionUploadDNI: function (oEvent) {
                let oObject = oEvent.getParameter("row").getBindingContext("AppModel").getObject();
                that.setModel(
                    new JSONModel({
                        id: oObject.UserId,
                        email: oObject.Correo,
                        frontDNI: "",
                        backDNI: "",
                    }),
                    "UploadModel"
                );

                sap.ui.core.BusyIndicator.show();
                let sFilters = 'emails.value eq "' + oObject.Correo + '"';
                iasService
                    .readUsers(deployed, sFilters)
                    .then((oResult) => {
                        let aCamposCustom = oResult.Resources[0]["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes;
                        let aPromise = [];
                        let camposDNI = aCamposCustom.find((x) => {
                            return x.name === "customAttribute10";
                        });
                        if (camposDNI !== undefined) {
                            camposDNI = JSON.parse(camposDNI.value);
                            that.getModel("UploadModel").getData().bDNI = true;

                            aPromise.push(that.getDocumentFromDS(camposDNI.front));
                            aPromise.push(that.getDocumentFromDS(camposDNI.back));

                            Promise.all(aPromise).then((aResults) => {
                                that.getModel("UploadModel").getData().DNIAnverso = aResults[0];
                                that.getModel("UploadModel").getData().DNIReverso = aResults[1];
                                that.getModel("UploadModel").refresh(true);
                            });
                        } else {
                            let sDefaultImage = sap.ui.require.toUrl("clientportal/saasa/com/pe/usermanager/assets/NotFound.jpg");
                            that.getModel("UploadModel").getData().bDNI = false;

                            that.getModel("UploadModel").getData().DNIAnverso = sDefaultImage;
                            that.getModel("UploadModel").getData().DNIReverso = sDefaultImage;
                        }
                        console.log(oResult);
                    })
                    .catch((oError) => {
                        console.log(oError);
                    })
                    .finally(() => {
                        sap.ui.core.BusyIndicator.hide();
                        that.getModel("UploadModel").refresh(true);
                        this._openDialogDinamic("uploadDocument");
                        this["ouploadDocument"].setModel(that.getModel("UploadModel"));
                    });
            },

            onAddStyles: function () {
                let oMainTitle = this.byId("idMainTitle");
                oMainTitle.addStyleClass("titleClass");
            },
            onOpenCreateUserDialog: function () {
                this._openDialogDinamic("newUser");
                this.getModel("NewUserModel").setData({
                    ExpiracyDate: new Date(new Date().setFullYear(new Date().getFullYear() + Number(that.getModel("AppModel").getData().oVigenciaBase.CONTENIDO))),
                });

                this.getModel("ConfigModel").getData()["editableRuc"] = true;
                this.getModel("ConfigModel").getData()["editableMail"] = true;

                this.getModel("ConfigModel").getData()["newUserDialogTitle"] = this._getI18nText("btnCrearUsuario");

                this.getModel("NewUserModel").refresh(true);
                this.getModel("ConfigModel").refresh(true);
                this["onewUser"].setModel(this.getModel("NewUserModel"));
                this["onewUser"].setModel(this.getModel("ConfigModel"));
            },

            onValidarUserIas: function (oUsuario) {
                let aPropiedades = [
                    "Name",
                    "LastName1",
                    "LastName2",
                    "Email",
                    "Phone",
                    "ExpiracyDate",
                    "RazonSocial",
                    "Ruc",
                    "RolAgenteAduana",
                    "RolAgenteCarga",
                    "RolCliente",
                ],
                    bNoValidUser = false,
                    iMessage = 0,
                    iContadorRoles = 0;

                aPropiedades.forEach((propiedad) => {
                    if (propiedad === "Name" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 1;
                    } else if (propiedad === "Name" && oUsuario[propiedad] !== undefined) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }

                    if (propiedad === "LastName1" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 1;
                    } else if (propiedad === "LastName1" && oUsuario[propiedad] !== undefined) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }

                    if (propiedad === "LastName2" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 1;
                    } else if (propiedad === "LastName2" && oUsuario[propiedad] !== undefined) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }

                    if (propiedad === "RazonSocial" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 1;
                    } else if (propiedad === "RazonSocial" && oUsuario[propiedad] !== undefined) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }

                    if (propiedad === "Email" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 2;
                    } else if (propiedad === "Email" && oUsuario[propiedad] !== undefined) {
                        if (that._validateEmail(oUsuario[propiedad]) === null) {
                            this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                            bNoValidUser = true;
                            iMessage = 2;
                        } else {
                            this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                        }
                    }

                    if (propiedad === "Phone" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 3;
                    } else if (propiedad === "Phone" && oUsuario[propiedad] !== undefined) {
                        if (oUsuario[propiedad].length > 9 || oUsuario[propiedad].length < 7) {
                            this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                            bNoValidUser = true;
                            iMessage = 3;
                        } else {
                            this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                        }
                    }

                    if (propiedad === "ExpiracyDate" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === null)) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 4;
                    } else if (propiedad === "ExpiracyDate" && oUsuario[propiedad] !== undefined) {
                        if (oUsuario[propiedad].getTime() < new Date().getTime()) {
                            this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                            bNoValidUser = true;
                            iMessage = 4;
                        } else {
                            this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                        }
                    }

                    if (propiedad === "Ruc" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 5;
                    } else if (propiedad === "Ruc" && oUsuario[propiedad] !== undefined) {
                        if (oUsuario[propiedad].length !== 11) {
                            this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                            bNoValidUser = true;
                            iMessage = 5;
                        } else {
                            this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                        }
                    }

                    if (propiedad === "RolAgenteAduana" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === false)) {
                        iContadorRoles += 1;
                    } else if (propiedad === "RolAgenteAduana" && oUsuario[propiedad] !== undefined) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }

                    if (propiedad === "RolAgenteCarga" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === false)) {
                        iContadorRoles += 1;
                    } else if (propiedad === "RolAgenteCarga" && oUsuario[propiedad] !== undefined) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }

                    if (propiedad === "RolCliente" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === false)) {
                        iContadorRoles += 1;
                    } else if (propiedad === "RolCliente" && oUsuario[propiedad] !== undefined) {
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }
                    if (iContadorRoles >= 3) {
                        this.getModel("NewUserModel").getData()["State" + "RolCliente"] = "Error";
                        this.getModel("NewUserModel").getData()["State" + "RolAgenteCarga"] = "Error";
                        this.getModel("NewUserModel").getData()["State" + "RolAgenteAduana"] = "Error";
                        bNoValidUser = true;
                        iMessage = 6;
                    }
                });

                this.getModel("NewUserModel").refresh(true);
                return [bNoValidUser, iMessage];
            },
            onSearch: function (oEvent) {
                let oTablaUsuarios = this.byId("idUserTable"),
                    aUsuarios = [];

                oEvent.getParameter("selectionSet").forEach((oElemento) => {
                    if (oElemento.data().objectiveTable === "UsuarioPrimario") {
                        aUsuarios.push(oElemento);
                    }
                });

                this.onSearchTableFilters(oTablaUsuarios, aUsuarios);
            },
            onSearchTableFilters: function (oTabla, aSelectionSet) {
                let oTablaObjetivo = oTabla.getBinding(),
                    oFilter,
                    aFilters = [],
                    oFinalFilter;
                aSelectionSet.forEach((oElementoFiltro) => {
                    oFilter = "";
                    if (oElementoFiltro.data().controlType === "ComboBox" && oElementoFiltro.getSelectedKey() !== "") {
                        //Workaround para booleanos
                        if (oElementoFiltro.getSelectedKey() === "true") {
                            oFilter = new Filter(oElementoFiltro.data().controlPath, FilterOperator.EQ, true);
                        } else if (oElementoFiltro.getSelectedKey() === "false") {
                            oFilter = new Filter(oElementoFiltro.data().controlPath, FilterOperator.EQ, false);
                        } else {
                            oFilter = new Filter(oElementoFiltro.data().controlPath, FilterOperator.EQ, oElementoFiltro.getSelectedKey());
                        }
                    } else if (oElementoFiltro.data().controlType === "Input" && oElementoFiltro.getValue() !== "") {
                        oFilter = new Filter(oElementoFiltro.data().controlPath, FilterOperator.Contains, oElementoFiltro.getValue());
                    } else if (oElementoFiltro.data().controlType === "DateRange" && oElementoFiltro.getFrom() !== null) {
                        oFilter = new Filter(
                            oElementoFiltro.data().controlPath,
                            FilterOperator.BT,
                            oElementoFiltro.getFrom(),
                            oElementoFiltro.getTo()
                        );
                    } else if (oElementoFiltro.data().controlType === "CheckBox") {
                        if (oElementoFiltro.getSelected()) {
                            oFilter = new Filter(oElementoFiltro.data().controlPath, FilterOperator.EQ, oElementoFiltro.data().controlValue);
                        }
                    }

                    if (oFilter !== "") aFilters.push(oFilter);
                });
                if (aFilters.length !== 0) {
                    oFinalFilter = new Filter({
                        filters: aFilters,
                        and: true,
                        caseSensitive: false,
                    });
                    oTablaObjetivo.filter(oFinalFilter);
                    oTablaObjetivo.refresh(true);
                }
            },
            onRestoreFilters: function (oEvent) {
                let oTablaUsuarios = this.byId("idUserTable").getBinding();

                try {
                    oTablaUsuarios.filter();
                    oTablaUsuarios.refresh(true);
                } catch (oError) { }

                oEvent.getParameters().selectionSet.forEach((oElementoFiltro) => {
                    if (oElementoFiltro.data().controlType === "CheckBox") {
                        oElementoFiltro.setSelected(false);
                    } else if (oElementoFiltro.data().controlType === "ComboBox") {
                        oElementoFiltro.setSelectedKey("");
                    } else {
                        oElementoFiltro.setValue("");
                    }
                });
            },
            onCreateEditUser: function (oEvent) {
                let sMode = that.getModel("ConfigModel").getData()["newUserDialogTitle"];
                if (sMode === "Crear usuario") {
                    that.onCreateUserIas(oEvent.getSource().getParent());
                } else if (sMode === "Editar usuario") {
                    that.onEditUserIas(oEvent.getSource().getParent());
                }
            },

            onCreateUserIas: function (auxDialog) {
                let oUserForm = this.getModel("NewUserModel").getData();
                let oDialog = auxDialog;
                if (that.onValidarUserIas(oUserForm)[0]) {
                    switch (that.onValidarUserIas(oUserForm)[1]) {
                        case 1:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser1"));
                            break;
                        case 2:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser2"));
                            break;
                        case 3:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser3"));
                            break;
                        case 4:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser4"));
                            break;
                        case 5:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser5"));
                            break;
                        case 6:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser6"));
                            break;
                    }
                } else {
                    let oUserObject = that.getUserObject(oUserForm, "Principal"),
                        sFilters;
                    //Cambio para los perfiles de usuario, 3 para agente aduanas, 4 para agente , 5 para cliente
                    if (oUserForm.hasOwnProperty("RolAgenteAduana")) {
                        if (oUserForm["RolAgenteAduana"]) {
                            oUserObject["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.push({
                                name: "customAttribute3",
                                value: "AgenteAduanas",
                            });
                        }
                    }
                    if (oUserForm.hasOwnProperty("RolAgenteCarga")) {
                        if (oUserForm["RolAgenteCarga"]) {
                            oUserObject["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.push({
                                name: "customAttribute4",
                                value: "AgenteCarga",
                            });
                        }
                    }
                    if (oUserForm.hasOwnProperty("RolCliente")) {
                        if (oUserForm["RolCliente"]) {
                            oUserObject["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.push({
                                name: "customAttribute5",
                                value: "Cliente",
                            });
                        }
                    }

                    sap.ui.core.BusyIndicator.show();

                    sFilters =
                        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' +
                        oUserForm.Ruc +
                        '"' +
                        " and " +
                        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal"';

                    iasService
                        .readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"))
                        .then((oResult) => {

                            if (oResult.totalResults > 0) {
                                MessageBox.error("No se puede crear usuarios primarios con el mismo ruc");
                            } else {
                                sFilters = 'userName co "' + oUserObject.userName + '"'; //Buscar por displayName
                                return iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));
                            }
                        })
                        .then((oResult) => {

                            oUserObject.userName += String(oResult.totalResults + 1).padStart(3, 0);
                            oUserObject.displayName += String(oResult.totalResults + 1).padStart(3, 0);

                            return iasService.createUser(deployed, oUserObject);
                        })
                        .then((oResult) => {
                            //Agregar rol base a usuario creado
                            let oGroup = that.actionUserToRoleGroup("add", oResult);
                            oGroup.Operations[0].value[0].value = oResult.id;

                            return iasService.updateByPatchGroup(deployed, oGroup, that.rolBaseId);
                        })
                        .then((oResult) => {
                            MessageToast.show(this._getI18nText("msgOnSuccessCreateUser"));
                            sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal"';
                            return iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));
                        })
                        .then((oResult) => {

                            //Aqui se deben diferenciar entre los ambientes
                            //Lectura de usuarios con esquema custom
                            let aUsers = [];
                            if (oResult.Resources !== undefined) {
                                oResult.Resources.filter((user) => {
                                    return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                                }).forEach((UserCustom) => {
                                    if (
                                        UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((customAt) => {
                                            if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)) {
                                                return customAt;
                                            }
                                        })
                                    ) {
                                        aUsers.push(UserCustom);
                                    }
                                });
                            }
                            //Fin de lectura

                            if (aUsers.length !== 0) {
                                that.getModel("AppModel").getData()["UsuariosPrincipales"] = that.formatUsersArray(aUsers);
                                that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = aUsers.length;
                            } else {
                                that.getModel("AppModel").getData()["UsuariosPrincipales"] = [];
                                that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = 0;
                            }

                            that.getModel("AppModel").refresh(true);
                        })
                        .catch((oError) => {
                            if (oError.status === 409) {
                                MessageBox.error(this._getI18nText("msgOnErrorCreateUserUniqueness"));
                            }
                        })
                        .finally((oFinal) => {
                            sap.ui.core.BusyIndicator.hide();
                            oDialog.close();
                        });
                }
            },
            onEditUserIas: function (auxDialog) {
                let oUserEdited = this.getModel("NewUserModel").getData();
                let oUserBefore = this.getModel("AppModel").getData()["UsuarioActual"];
                let oDialog = auxDialog;

                if (that.onValidarUserIas(oUserEdited)[0]) {
                    switch (that.onValidarUserIas(oUserEdited)[1]) {
                        case 1:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser1"));
                            break;
                        case 2:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser2"));
                            break;
                        case 3:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser3"));
                            break;
                        case 4:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser4"));
                            break;
                        case 6:
                            MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser6"));
                            break;
                    }
                } else {
                    let oUserObject, sFilters;
                    sFilters = 'emails.value eq "' + oUserBefore.Correo + '"';
                    sap.ui.core.BusyIndicator.show();
                    iasService.readUsers(deployed, sFilters).then((oResult) => {
                            oUserObject = oResult.Resources[0];
                            oUserObject.name.familyName = `${oUserEdited.LastName1} ${oUserEdited.LastName2}`;
                            oUserObject.name.givenName = oUserEdited.Name;
                            oUserObject.phoneNumbers[0].value = oUserEdited.Phone;
                            oUserObject["urn:ietf:params:scim:schemas:extension:sap:2.0:User"].phoneNumbers[0].value = oUserEdited.Phone;
                            oUserObject["urn:ietf:params:scim:schemas:extension:sap:2.0:User"].validTo = formatter.dateToZDate(oUserEdited.ExpiracyDate);
                            oUserObject["active"] = oUserBefore["Status"];

                            //Cambio para los perfiles de usuario, 3 para agente aduanas, 4 para agente , 5 para cliente

                            if (oUserEdited.hasOwnProperty("RolAgenteAduana")) {
                                if (oUserEdited["RolAgenteAduana"]) {
                                    that.editCustomAttribute(oUserObject, 3, "AgenteAduanas");
                                } else {
                                    that.editCustomAttribute(oUserObject, 3, "");
                                }
                            }
                            if (oUserEdited.hasOwnProperty("RolAgenteCarga")) {
                                if (oUserEdited["RolAgenteCarga"]) {
                                    that.editCustomAttribute(oUserObject, 4, "AgenteCarga");
                                } else {
                                    that.editCustomAttribute(oUserObject, 4, "");
                                }
                            }
                            if (oUserEdited.hasOwnProperty("RolCliente")) {
                                if (oUserEdited["RolCliente"]) {
                                    that.editCustomAttribute(oUserObject, 5, "Cliente");
                                } else {
                                    that.editCustomAttribute(oUserObject, 5, "");
                                }
                            }
                            return iasService.updateByPutUser(deployed, oUserObject, oUserBefore["UserId"]);
                        })
                        .then((oResult) => {
                            MessageToast.show(this._getI18nText("msgOnSuccessEditedUser"));
                            sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Principal"';
                            return iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));
                        })
                        .then((oResult) => {

                            //Aqui se deben diferenciar entre los ambientes
                            //Lectura de usuarios con esquema custom
                            let aUsers = [];
                            if (oResult.Resources !== undefined) {
                                oResult.Resources.filter((user) => {
                                    return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                                }).forEach((UserCustom) => {
                                    if (
                                        UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find((customAt) => {
                                            if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)) {
                                                return customAt;
                                            }
                                        })
                                    ) {
                                        aUsers.push(UserCustom);
                                    }
                                });
                            }
                            //Fin de lectura

                            if (aUsers.length !== 0) {
                                that.getModel("AppModel").getData()["UsuariosPrincipales"] = that.formatUsersArray(aUsers);
                                that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = aUsers.length;
                            } else {
                                that.getModel("AppModel").getData()["UsuariosPrincipales"] = [];
                                that.getModel("AppModel").getData()["CantUsuariosPrincipales"] = 0;
                            }

                            that.getModel("AppModel").refresh(true);
                        })
                        .catch((oError) => {
                            that.controlXHRErrors(oError);
                        })
                        .finally((oFinal) => {
                            sap.ui.core.BusyIndicator.hide();
                            oDialog.close();
                        });
                }
            },

            onCloseDialog: function (oEvent) {
                oEvent.getSource().getParent().close();
            },
            getUserObject: function (oUser, sUserType = "") {
                let oUserObject = {
                    schemas: [
                        "urn:ietf:params:scim:schemas:core:2.0:User",
                        "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
                        "urn:ietf:params:scim:schemas:extension:sap:2.0:User",
                        "urn:sap:cloud:scim:schemas:extension:custom:2.0:User",
                    ],
                    userName: formatter.getUserName(oUser.Name, oUser.LastName1 + oUser.LastName2),
                    name: {
                        familyName: oUser.LastName1 + " " + oUser.LastName2,
                        givenName: oUser.Name,
                    },
                    displayName: formatter.getUserName(oUser.Name, oUser.LastName1 + oUser.LastName2),
                    active: true,
                    emails: [
                        {
                            value: oUser.Email,
                            primary: true,
                        },
                    ],
                    phoneNumbers: [
                        {
                            value: oUser.Phone,
                            primary: true,
                            type: "work",
                        },
                    ],
                    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
                        division: sUserType,
                        costCenter: oUser.Ruc,
                        organization: oUser.RazonSocial,
                    },
                    "urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
                        validTo: formatter.dateToZDate(oUser.ExpiracyDate),
                        sendMail: true,
                    },
                    "urn:sap:cloud:scim:schemas:extension:custom:2.0:User": {
                        attributes: [
                            {
                                name: "customAttribute2",
                                value: that.ambiente,
                            },
                        ],
                    },
                };
                return oUserObject;
            },

            onUnassignRoleToUser: async function (oEvent) {
                let oUpdatedGroup, oUser;
                let oRolSeleccionado = oEvent.getSource().getParent().getBindingContext("AppModel").getObject();

                //Comprobar que se repita el mismo rol

                let oUsuarioActual = that.getModel("AppModel").getData()["UsuarioActual"];
                let oGroup = that.actionUserToRoleGroup("remove", oUsuarioActual);

                sap.ui.core.BusyIndicator.show();
                oUpdatedGroup = await iasService.updateByPatchGroup(deployed, oGroup, oRolSeleccionado.value);

                oUser = await iasService.readSingleUser(deployed, oUsuarioActual.UserId);

                if (that.ambiente === "QAS") {
                    oUsuarioActual.Grupos = oUser.groups.filter((x) => {
                        return x.display.includes("ClientPortal") && x.display.includes("DEV/QAS");
                    });
                } else if (that.ambiente === "PRD") {
                    oUsuarioActual.Grupos = oUser.groups.filter((x) => {
                        return x.display.includes("ClientPortal") && x.display.includes("PRD");
                    });
                }

                that.getModel("AppModel").getData().tempGroups = that.getModel("AppModel").getData().Groups.filter(x => { return !oUsuarioActual.Grupos.find(y => { return y.value === x.GroupId; }); });

                that.getModel("AppModel").refresh(true);
                sap.ui.core.BusyIndicator.hide();
                MessageToast.show(that._getI18nText("msgOnSuccessUnassignedRole"));
            },
            onAssignRoleToUser: async function (oEvent) {
                let oUpdatedGroup, oUser;
                let oRolSeleccionado = oEvent.getSource().getParent().getBindingContext("AppModel").getObject();
                let oRolesUsuarioActual = that.getModel("AppModel").getData()["UsuarioActual"]["Grupos"];
                if (oRolesUsuarioActual === undefined) {
                    oRolesUsuarioActual = [];
                }

                //Comprobar que no se repita el mismo rol
                let oRolRepetido = oRolesUsuarioActual.find((rol) => {
                    return rol.value === oRolSeleccionado.GroupId;
                });

                if (oRolRepetido) {
                    MessageBox.error(that._getI18nText("msgOnDuplicatedRole"));
                    return true;
                }

                let oUsuarioActual = that.getModel("AppModel").getData()["UsuarioActual"];

                let oGroup = that.actionUserToRoleGroup("add", oUsuarioActual);

                sap.ui.core.BusyIndicator.show();

                oUpdatedGroup = await iasService.updateByPatchGroup(deployed, oGroup, oRolSeleccionado.GroupId);

                //Obtener los roles del nuevo usuario
                oUser = await iasService.readSingleUser(deployed, oUsuarioActual.UserId);

                if (that.ambiente === "QAS") {
                    oUsuarioActual.Grupos = oUser.groups.filter((x) => {
                        return x.display.includes("ClientPortal") && x.display.includes("DEV/QAS");
                    });
                } else if (that.ambiente === "PRD") {
                    oUsuarioActual.Grupos = oUser.groups.filter((x) => {
                        return x.display.includes("ClientPortal") && x.display.includes("PRD");
                    });
                }

                that.getModel("AppModel").getData().tempGroups = that.getModel("AppModel").getData().Groups.filter(x => { return !oUsuarioActual.Grupos.find(y => { return y.value === x.GroupId; }); });

                that.getModel("AppModel").refresh(true);
                sap.ui.core.BusyIndicator.hide();
                MessageToast.show(that._getI18nText("msgOnSuccessAssignedRole"));
            },
            actionUserToRoleGroup: function (sAction, oUser) {
                let oIasGroup = {
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: [],
                };
                switch (sAction) {
                    case "add":
                        oIasGroup.Operations.push({
                            op: "add",
                            path: "members",
                            value: [
                                {
                                    value: oUser.UserId,
                                },
                            ],
                        });
                        break;
                    case "remove":
                        oIasGroup.Operations.push({
                            op: "remove",
                            path: 'members[value eq "' + oUser.UserId + '"]',
                        });
                        break;
                }

                return oIasGroup;
            },

            handleUploadDNIFront: function (oEvent) {
                let aFiles = oEvent.getParameters().files;
                let currentFile = aFiles[0];

                if (currentFile) {
                    var reader = new FileReader();
                    reader.onload = function (readerEvt) {
                        var binaryString = readerEvt.target.result;
                        that.getModel("UploadModel").getData().FrontDNI = btoa(binaryString);
                    };
                    reader.readAsBinaryString(currentFile);
                }
            },

            handleUploadDNIBack: function (oEvent) {
                let aFiles = oEvent.getParameters().files;
                let currentFile = aFiles[0];

                if (currentFile) {
                    var reader = new FileReader();

                    reader.onload = function (readerEvt) {
                        var binaryString = readerEvt.target.result;
                        that.getModel("UploadModel").getData().BackDNI = btoa(binaryString);
                    };

                    reader.readAsBinaryString(currentFile);
                }
            },

            getDocumentFromDS: function (sId) {
                let sPath = `${window.RootPath}/services/api/DocumentServiceService?documentoId=` + sId;
                return new Promise(function (resolve, reject) {
                    fetch(sPath, {
                        method: "GET",
                    })
                        .then((oResult) => oResult.arrayBuffer())
                        .then((oResult) => {
                            var blob = new Blob([oResult], {
                                type: "image/jpeg",
                            });

                            // process to auto download it
                            const fileURL = URL.createObjectURL(blob);
                            resolve(fileURL);
                        })
                        .catch((oError) => {
                            reject(oError);
                        });
                });
            },
            uploadDNI: function (jsonDni) {
                try {
                    return new Promise(function (resolve, reject) {
                        let sPath = `${window.RootPath}/services/api/dms/uploadDNI`;
                        fetch(sPath, {
                            method: "POST",
                            headers: {
                                Accept: "application/json",
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(jsonDni),
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                resolve(data);
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    });
                } catch (oError) {
                    console.log(oError);
                }
            },

            onGetJsonDni: function (ambiente, idUsuario, dniFront, dniBack) {
                let oDni = {
                    Ambiente: ambiente,
                    IdUsuario: idUsuario,
                    DniFront: dniFront,
                    DniBack: dniBack,
                };
                return oDni;
            },
            onUploadDocument: function (oEvent) {
                let uploadModel = that.getModel("UploadModel").getData();
                if (
                    uploadModel.FrontDNI === undefined ||
                    uploadModel.FrontDNI === "" ||
                    uploadModel.BackDNI === undefined ||
                    uploadModel.BackDNI === ""
                ) {
                    MessageToast.show(that._getI18nText("msgOnErrorCompleteDocument"));
                } else {
                    sap.ui.core.BusyIndicator.show();
                    let oObjetoUsuario;
                    iasService
                        .readSingleUser(deployed, uploadModel.id)
                        .then((oResult) => {
                            let bFlagExisteDocumento =
                                oResult["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.find((x) => {
                                    return x.name === "customAttribute10";
                                }) === undefined
                                    ? false
                                    : true;

                            /* if (bFlagExisteDocumento){
                                        MessageBox.error(that._getI18nText("msgOnErrorDocumentAlreadySubmitted"));
                                        return Promise.reject();
                                    } */

                            let oBody = that.onGetJsonDni(that.ambiente, uploadModel.id, uploadModel.FrontDNI, uploadModel.BackDNI);
                            oObjetoUsuario = oResult;

                            return that.uploadDNI(oBody);
                        })
                        .then((oResult) => {
                            oObjetoUsuario["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.push({
                                name: "customAttribute10",
                                value: JSON.stringify({
                                    front: oResult[0].documento.Id,
                                    back: oResult[1].documento.Id,
                                }),
                            });

                            return iasService.updateByPutUser(deployed, oObjetoUsuario, oObjetoUsuario.id);
                        })
                        .then((oResult) => {
                            MessageBox.success(that._getI18nText("msgOnSuccessDocument"));
                        })
                        .catch((oError) => {
                            console.log(oError);
                        })
                        .finally((oFinal) => {
                            sap.ui.core.BusyIndicator.hide();
                            delete that.getModel("UploadModel").getData().FrontDNI;
                            delete that.getModel("UploadModel").getData().BackDNI;
                            this["ouploadDocument"].close();
                        });
                }
            },

            blobToBase64: function (blob) {
                return new Promise((resolve, _) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(",")[1]);
                    reader.readAsDataURL(blob);
                });
            },

            onOpenEditUserProfile: async function () {
                let sFilters, oIasServiceReading;
                //LECTURA DE SECUNDARIOS
                sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                sap.ui.core.BusyIndicator.show(0, 0);
                this._openDialogDinamic("busyDialogGeneric");
                oIasServiceReading = await iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));

                that.getModel("AppModel").getData().aUsersSecundarios = oIasServiceReading.Resources.filter(x => {
                    return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                }).filter(y => {
                    return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.find(z => {
                        return z.name.includes("customAttribute2") && z.value.includes(that.ambiente);
                    });
                });
                this._onCloseDialogDinamic("busyDialogGeneric");

                sap.ui.core.BusyIndicator.hide();

                this._openDialogDinamic("editProfiles");

            },
            onOpenExtendUserVigency: async function () {
                let sFilters, oIasServiceReading;
                //LECTURA DE SECUNDARIOS
                sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                sap.ui.core.BusyIndicator.show(0, 0);
                this._openDialogDinamic("busyDialogGeneric");
                oIasServiceReading = await iasService.readUsersWithPagination(deployed, sFilters, that.getModel("LoadingModel"));

                that.getModel("AppModel").getData().aUsersSecundarios = oIasServiceReading.Resources.filter(x => {
                    return x["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"];
                }).filter(y => {
                    return y["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.find(z => {
                        return z.name.includes("customAttribute2") && z.value.includes(that.ambiente);
                    });
                });
                this._onCloseDialogDinamic("busyDialogGeneric");

                sap.ui.core.BusyIndicator.hide();

                that.getModel("AppModel").setProperty("/ExtensionVigencia", {});
                this._openDialogDinamic("editHours");
            },
            onConfirmRoleToEdit: function (oEvent) {
                let sTitle = oEvent.getParameters().listItem.getProperty("title");
                let sRoleId, sAccion;
                if (that.getModel("AppModel").getData().TipoOperacionRoles === undefined) {
                    that.getModel("AppModel").getData().TipoOperacionRoles = "Add";
                }
                that.getModel("AppModel").getData().PerfilAEditar = sTitle;
                oEvent.getSource().getParent().close();

                this._openDialogDinamic("addDeleteRolesToProfile");
            },
            onConfirmRoleToExtendVigency: function (oEvent) {
                let aUsuarios = [], aUsuariosSec = [], aUsuariosAux = [], aUsuariosMain = [], aPromises = [];
                let oPatchObject, dFechaAux, iCont = 0;
                let sTitle = oEvent.getParameters().listItem.getProperty("title");
                let iAnos = that.getModel("AppModel").getData().ExtensionVigencia.Anos;
                if (iAnos === "" || iAnos === undefined){
                    MessageToast.show(that._getI18nText("msgAlertIngreseNAnos"));
                    return true;
                }
                //Fecha actual
                dFechaAux = new Date();
                dFechaAux = dFechaAux.setHours(23, 59, 59);
                //Tiempo de un ano
                dFechaAux = dFechaAux + (Number(iAnos) * 365 * 24 * 3600 * 1000);
                dFechaAux = new Date(dFechaAux);

                switch (sTitle) {
                    case "Agente de Carga":
                        aUsuariosMain = that.getModel("AppModel").getData().aAgtCarga;
                        break;
                    case "Agente de Aduana":
                        aUsuariosMain = that.getModel("AppModel").getData().aAgtAduana;
                        break;
                    case "Cliente":
                        aUsuariosMain = that.getModel("AppModel").getData().aClientes;
                        break;
                }
                //BUSCAR LOS SECUNDARIOS DE LOS USUARIOS SELECCIONADOS POR RUC
                for (let oUser of aUsuariosMain) {
                    aUsuariosAux = that.getModel("AppModel").getData().aUsersSecundarios.filter(a => {
                        return a["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].costCenter ===
                            oUser["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].costCenter;
                    })
                    aUsuariosSec = [...aUsuariosSec, ...aUsuariosAux];
                }
                //JUNTAR LOS USUARIOS
                aUsuarios = [...aUsuariosSec, ...aUsuariosMain];
                const localFunc = async function (){
                    try{
                        sap.ui.core.BusyIndicator.show();
                        while(aUsuarios.length > 0){
                            aPromises = [];
                            aUsuarios.splice(0,50).forEach((oUsuario) => {                            
                                //ObjetoPatch
                                oPatchObject = iasService.getPatchBaseObject();
                                oPatchObject.Operations.push({
                                    "op": "replace", 
                                    "path": "urn:ietf:params:scim:schemas:extension:sap:2.0:User:validTo",
                                    "value": dFechaAux
                                });
                                aPromises.push(iasService.updateByPatchUser(true, oPatchObject, oUsuario.id));
                            });
                            await Promise.all(aPromises).then(oResult => {console.log(oResult)});
                        }
                        MessageBox.success(that._getI18nText("msgOnSuccessExtendVigency", [iAnos])); 
                    }catch(oError){
                        that.controlXHRErrors(oError);   
                    }finally{
                        sap.ui.core.BusyIndicator.hide();
                    }
                }

                MessageBox.alert(that._getI18nText("msgOnAskExtendVigency", [aUsuarios.length]), {
                    actions: ["Extender fechas", "Cancelar"],
                    emphasizedAction: "Extender fechas",
                    onClose: function (sAction) {
                        if (sAction === "Extender fechas") {
                            localFunc();
                        }
                    }
                });
            },

            onOpenSetVigenciaBase: async function(){
                this._openDialogDinamic("setVigenciaBase");     
            },
            onSetVigenciaBase: function(){
                let oVigencia = that.getModel("AppModel").getData().oVigenciaBase;
                if (oVigencia.CONTENIDO === "" || oVigencia.CONTENIDO === undefined){
                    MessageToast.show(that._getI18nText("msgAlertIngreseNAnos"));
                    return true;
                }

                let sPath = that.oAppModel.createKey("/MasterSet", {"MASTER_ID": oVigencia.MASTER_ID}),
                oData = models.getBodyFechaVigencia(oVigencia, that.sUser);
                sap.ui.core.BusyIndicator.show();
                oDataService.oDataUpdate(that.oAppModel, sPath, oData).then((oResult) => {
                    debugger;
                    that.getModel("AppModel").setProperty("/oVigenciaBase", oResult.data);

                    MessageBox.success(that._getI18nText("msgOnSuccessExtendBaseVigency", [oVigencia.CONTENIDO]));
                    
                }).catch(oError => {
                    that.controlXHRErrors(oError);
                    return;
                }).finally(() => {
                    that._onCloseDialogDinamic("setVigenciaBase");
                    sap.ui.core.BusyIndicator.hide();
                });
            },
            onSearchRoles: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new Filter("Nombre", FilterOperator.Contains, sValue);
                var oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter([oFilter]);
            },
            getBodyModificacionPerfil: function (tipoOp, aUsuarios) {
                let aUserIds = [], oBase = {
                    schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
                    Operations: []
                };

                aUserIds = aUsuarios.map(x => { return x.id; });

                for (let sId of aUserIds) {
                    if (tipoOp === "Add") {
                        oBase.Operations.push({
                            op: "add",
                            path: "members",
                            value: [{ value: sId }]
                        });
                    } else if (tipoOp === "Del") {
                        oBase.Operations.push({
                            op: "remove",
                            path: 'members[value eq "' + sId + '"]'
                        });
                    }
                }

                return oBase;

            },
            sliceMyArray: function (aArray) {
                let iTimes = 0, iLimite = 50,
                    aResults = [];

                iTimes = Math.floor(aArray.length / iLimite);

                if (iTimes > 0) {
                    for (let i = 0; i <= iTimes; i++) {
                        aResults.push(aArray.slice(i * iLimite, (i + 1) * iLimite));
                    }
                } else {
                    aResults = [aArray];
                }

                return aResults;
            },
            onConfirmRolesToAddDelete: function (oEvent) {
                let aRoles = [], aFinalUserList = [], aUsuarios = [], aUsuariosAux = [], aUsuariosSecAux = [], aPromises = [], oBodyMod, sFilters;

                for (let oRol of oEvent.getParameters().selectedContexts) {
                    aRoles.push(oRol.getObject());
                }

                switch (that.getModel("AppModel").getData().PerfilAEditar) {
                    case "Agente de Carga":
                        aUsuarios = that.getModel("AppModel").getData().aAgtCarga;
                        break;
                    case "Agente de Aduana":
                        aUsuarios = that.getModel("AppModel").getData().aAgtAduana;
                        break;
                    case "Cliente":
                        aUsuarios = that.getModel("AppModel").getData().aClientes;
                        break;
                }

                MessageBox.warning(that._getI18nText("msgOnAskAddDeleteRoles"), {
                    actions: ["Modificar perfil", "Cancelar"],
                    emphasizedAction: "Modificar perfil",
                    onClose: function (sAction) {
                        if (sAction === "Modificar perfil") {
                            for (let oRol of aRoles) {
                                oBodyMod = "";
                                if (that.getModel("AppModel").getData().TipoOperacionRoles === "Add") {
                                    aUsuariosAux = aUsuarios.filter(x => { return !x.groups?.find(y => { return y.value === oRol.GroupId; }); });
                                } else if (that.getModel("AppModel").getData().TipoOperacionRoles === "Del") {
                                    aUsuariosAux = aUsuarios.filter(x => { return x.groups?.find(y => { return y.value === oRol.GroupId; }); });
                                }
                                for (let oUser of aUsuariosAux) {
                                    aUsuariosSecAux = [...aUsuariosSecAux, ...that.getModel("AppModel").getData().aUsersSecundarios.filter(a => {
                                        return a["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].costCenter ===
                                            oUser["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].costCenter;
                                    })];
                                }

                                aFinalUserList = [...aUsuariosAux, ...aUsuariosSecAux];
                                if (aFinalUserList.length > 0) {

                                    aFinalUserList = that.sliceMyArray(aFinalUserList);

                                    for (let oAux of aFinalUserList) {
                                        oBodyMod = that.getBodyModificacionPerfil(that.getModel("AppModel").getData().TipoOperacionRoles, oAux);
                                        aPromises.push(iasService.updateByPatchGroup(deployed, oBodyMod, oRol.GroupId));
                                    }
                                }
                            }

                            sap.ui.core.BusyIndicator.show();
                            if (aPromises.length > 0) {
                                Promise.all(aPromises).then(oResults => {
                                    MessageBox.success(that._getI18nText("onModProfileSuccess"));
                                    sap.ui.core.BusyIndicator.hide();
                                }).catch(oError => {
                                    that.controlXHRErrors(oError);
                                    sap.ui.core.BusyIndicator.hide();
                                })
                            } else {
                                MessageBox.success(that._getI18nText("onModProfileSuccess"));
                                sap.ui.core.BusyIndicator.hide();
                            }
                        }
                    }
                });
            }
        });
    }
);
