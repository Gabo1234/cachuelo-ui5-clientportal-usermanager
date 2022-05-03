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
    "sap/ui/core/routing/History",
    "../myServices/iasService",
    "../model/formatter",
    'sap/ui/export/Spreadsheet',
    'sap/ui/export/library'
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
    History,
    iasService,
    formatter,
    Spreadsheet,
    exportLibrary
  ) {
    "use strict";
    let that;
    let deployed;
    let EdmType = exportLibrary.EdmType;

    return BaseController.extend(
      "clientportal.saasa.com.pe.usermanager.controller.Home",
      {
        formatter: formatter,
        onInit: function () {
            that = this;
            deployed = !(sap.ushell === undefined);

            //Referencias principales
            that.oAppModel = this.getOwnerComponent().getModel();

            that.ambiente = "QAS";
            
          that.appNamespace = (that.ambiente === "QAS") ? "CLIENTPORTAL" : "PORTAL";
          if (that.ambiente === "QAS"){
            that.rolBaseId = "af492883-9776-4ff4-b1bc-cd8478e5f564";
            that.rolAdmin = that.ambiente + "_" + (that.appNamespace).toUpperCase() + "_USERMANAGERADMIN";
          }else if (that.ambiente === "PRD"){
            that.rolBaseId = "c261303c-477d-4cea-a5db-88824f7491cc";
            that.rolAdmin = that.ambiente + "_" + (that.appNamespace).toUpperCase() + "_ADMIN_PORTAL";
          }
            //Creacion de modelos
            that.setModel(new JSONModel({}), "DetailModel");
            that.setModel(new JSONModel({}), "NewUserModel");
            //Configuracion Model
            that.setModel(new JSONModel({}), "ConfigModel");
            that.setConfig();            
            //Navegacion
            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteDetail").attachPatternMatched(this._onPressedUser, this);
        },
        setConfig: function(){
            that.getModel("ConfigModel").getData()["visibleFooterEditBtn"] = true;
            that.getModel("ConfigModel").getData()["visibleFooterSaveBtn"] = false;
            that.getModel("ConfigModel").getData()["visibleFooterCancelBtn"] = false;
            that.getModel("ConfigModel").refresh(true);
        }, 
        _onPressedUser: function(oEvent){
            let sFilters;

            //Leer usuario seleccionado
            sap.ui.core.BusyIndicator.show();
            iasService.readSingleUser(deployed, oEvent.getParameter("arguments").usuarioPrincipal).then(oResult =>{
                let aUsuario = that.formatUsersArray([oResult]);
                that.getModel("DetailModel").getData()["UsuarioPrincipal"] = aUsuario[0];
                that.getModel("DetailModel").getData()["DetailTitle"] = aUsuario[0].RazonSocial;

                that.getModel("DetailModel").refresh(true);

                sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' + that.getModel("DetailModel").getData()["UsuarioPrincipal"].Ruc + '"'
                + ' and ' + 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                return iasService.readUsers(deployed, sFilters);
            }).then(oResult =>{
                //Aqui se deben diferenciar entre los ambientes
                //Lectura de usuarios con esquema custom
                let aUsers = [];
                if (oResult.Resources !== undefined){
                    oResult.Resources.filter( user => {
                        return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]
                    }).forEach( UserCustom =>{
                        if (UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find(customAt =>{
                            if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)){
                                return customAt;
                            }
                        })){
                            aUsers.push(UserCustom);
                        }
                    });
                }
                //Fin de lectura
                if(aUsers.length > 0){
                    that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(aUsers);
                    that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = aUsers.length;
                }else{
                    that.getModel("DetailModel").getData()["UsuariosSecundarios"] = [];
                    that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = 0;
                }
                that.getModel("DetailModel").refresh(true);
            }).finally(oFinal =>{
                sap.ui.core.BusyIndicator.hide();
            }).catch(oError =>{
                console.log(oError);
            });

            //Leer grupos de roles
            sap.ui.core.BusyIndicator.show();
            sFilters = 'urn:sap:cloud:scim:schemas:extension:custom:2.0:Group:name co "' + that.ambiente + "_" + that.appNamespace + '"'; //Filtro para Names
            //sFilters = 'displayName co "' + that.appNamespace + '"'; //Filtro para DisplayNames
            iasService.readGroups(deployed, sFilters).then(oResult =>{
                that.getModel("DetailModel").getData()["Groups"] = that.formatGroupsArray(oResult.Resources);
                that.getModel("DetailModel").refresh(true);
            }).finally(oFinal =>{
                sap.ui.core.BusyIndicator.hide();
            }).catch(oError =>{
                console.log(oError);
            });

            //Setear permiso de administrador
            that.getModel("DetailModel").getData().IsAdmin = (oEvent.getParameter("arguments").isAdmin === 'true');
            that.getModel("DetailModel").refresh();
        },
        onNavBack: function () {
            var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(that);

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} 
				
            oRouter.navTo("RouteMain", true);
			
        },
        
        
        onFilterSecondaryUser: function(oEvent){
            let sActualValue = oEvent.getParameters()["newValue"];
            let oTableBinding = that.byId("idUserTableDetail").getBinding();
            let aFilters = [];

            aFilters.push(new Filter("Nombres",FilterOperator.Contains, sActualValue));
            aFilters.push(new Filter("Apellidos",FilterOperator.Contains, sActualValue));
            aFilters.push(new Filter("Correo",FilterOperator.Contains, sActualValue));

            let oFinalFilter = new Filter({
                filters: aFilters,
                and: false,
                caseSensitive: false
              });
            
            oTableBinding.filter(oFinalFilter);
        },
        onSelectionSecondaryUserChange: function(oEvent){
            if(oEvent.getSource().getSelectedIndices().length < 1){
                this.byId("idBtnDeleteSecondaryUser").setEnabled(false);
                this.byId("idBtnEditSecondaryUser").setEnabled(false);
                this.byId("idBtnAssignRolesSecondaryUser").setEnabled(false); 
                this.byId("idBtnBlockSecondaryUser").setEnabled(false); 
                this.byId("idBtnUploadDocument").setEnabled(false); 

                
                that.getModel("DetailModel").getData()["UsuarioActual"] = null;
                that.getModel("DetailModel").refresh(true);                
            }else{
                this.byId("idBtnDeleteSecondaryUser").setEnabled(true);
                this.byId("idBtnEditSecondaryUser").setEnabled(true); 
                this.byId("idBtnAssignRolesSecondaryUser").setEnabled(true);  
                this.byId("idBtnBlockSecondaryUser").setEnabled(true); 
                this.byId("idBtnUploadDocument").setEnabled(true); 

    
                
                that.getModel("DetailModel").getData()["UsuarioActual"] = this.byId("idUserTableDetail")._getContexts()[oEvent.getSource().getSelectedIndex()].getObject();
                that.getModel("DetailModel").refresh(true);
            }
        },
        onEditMainUser: function(){
            that.getModel("ConfigModel").getData()["visibleFooterEditBtn"] = false;
            that.getModel("ConfigModel").getData()["visibleFooterSaveBtn"] = true;
            that.getModel("ConfigModel").getData()["visibleFooterCancelBtn"] = true;
            that.getModel("ConfigModel").refresh(true);
        },
        onCancelMainUser: function(){
            that.getModel("ConfigModel").getData()["visibleFooterEditBtn"] = true;
            that.getModel("ConfigModel").getData()["visibleFooterSaveBtn"] = false;
            that.getModel("ConfigModel").getData()["visibleFooterCancelBtn"] = false;
            that.getModel("ConfigModel").refresh(true);
        },
        onSaveMainUser: function(){
            let oUserEdited = that.getModel("DetailModel").getData()["UsuarioPrincipal"], sFilters;
            sFilters = 'emails.value eq "' + oUserEdited.Correo + '"';

            iasService.readUsers(deployed, sFilters).then(oResult => {
                oResult.Resources[0].name.familyName = oUserEdited.Apellidos;
                oResult.Resources[0].name.givenName = oUserEdited.Nombres;
                oResult.Resources[0].phoneNumbers[0].value = oUserEdited.Telefono;
                oResult.Resources[0]["urn:ietf:params:scim:schemas:extension:sap:2.0:User"].validTo = formatter.dateToZDate(oUserEdited.Vigencia);

                return iasService.updateByPutUser(deployed,oResult.Resources[0], oUserEdited.UserId);
            }).then(oResult =>{
                MessageToast.show(that._getI18nText("msgOnSuccessEditedUser"));
                that.getModel("DetailModel").getData()["UsuarioPrincipal"].Apellidos = oUserEdited.Apellidos;
                that.getModel("DetailModel").getData()["UsuarioPrincipal"].Nombres = oUserEdited.Nombres;
                that.getModel("DetailModel").getData()["UsuarioPrincipal"].Telefono = oUserEdited.Telefono;
                that.getModel("DetailModel").getData()["UsuarioPrincipal"].Vigencia = oUserEdited.Vigencia;

                that.getModel("DetailModel").refresh();
            }).finally(oFinal =>{
                that.getModel("ConfigModel").getData()["visibleFooterEditBtn"] = true;
                that.getModel("ConfigModel").getData()["visibleFooterSaveBtn"] = false;
                that.getModel("ConfigModel").getData()["visibleFooterCancelBtn"] = false;
                that.getModel("ConfigModel").refresh(true);
            }).catch(oError =>{
                console.log(oError);
            });
        },
        onAssignRoles: function(){
            that._openDialogDinamic("assignRolesSecondary");
            that["oassignRolesSecondary"].setModel(that.getModel("DetailModel")); 
            
        },
        onCreateSecondaryUser: function(){
            this._openDialogDinamic("newUser");
            this.getModel("NewUserModel").setData({
                "ExpiracyDate": new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            });

            //Setear campos heredados
            this.getModel("NewUserModel").getData().Ruc = this.getModel("DetailModel").getData()["UsuarioPrincipal"].Ruc;
            this.getModel("NewUserModel").getData().RazonSocial = this.getModel("DetailModel").getData()["UsuarioPrincipal"].RazonSocial;

            //Setear configuracion
            this.getModel("ConfigModel").getData()["visibleEditUserSecondaryDialog"] = false;
            this.getModel("ConfigModel").getData()["visibleNewUserSecondaryDialog"] = true;
            this.getModel("ConfigModel").getData()["editableRuc"] = false;
            this.getModel("ConfigModel").getData()["editableMail"] = true;

            this.getModel("ConfigModel").getData()["newUserDialogTitle"] = this._getI18nText("btnCrearUsuario");

            
            this.getModel("NewUserModel").refresh(true);
            this.getModel("ConfigModel").refresh(true);
            this["onewUserSecondary"].setModel(this.getModel("NewUserModel")); 
            this["onewUserSecondary"].setModel(this.getModel("ConfigModel"));      
        },
        onEditUser: function(){
            this._openDialogDinamic("newUserSecondary");
            
            //Formatear campos
            this.getModel("NewUserModel").getData().Name = that.getModel("DetailModel").getData()["UsuarioActual"].Nombres;
            this.getModel("NewUserModel").getData().LastName1 = that.getModel("DetailModel").getData()["UsuarioActual"].Apellidos.split(" ")[0];
            this.getModel("NewUserModel").getData().LastName2 = that.getModel("DetailModel").getData()["UsuarioActual"].Apellidos.split(" ")[1];
            this.getModel("NewUserModel").getData().Email = that.getModel("DetailModel").getData()["UsuarioActual"].Correo;
            this.getModel("NewUserModel").getData().Phone = that.getModel("DetailModel").getData()["UsuarioActual"].Telefono;
            this.getModel("NewUserModel").getData().ExpiracyDate = that.getModel("DetailModel").getData()["UsuarioActual"].Vigencia;

            //Setear campos heredados
            this.getModel("NewUserModel").getData().Ruc = that.getModel("DetailModel").getData().UsuarioPrincipal.Ruc;
            this.getModel("NewUserModel").getData().RazonSocial = that.getModel("DetailModel").getData().UsuarioPrincipal.RazonSocial;

            //Setear configuracion
            this.getModel("ConfigModel").getData()["visibleEditUserSecondaryDialog"] = true;
            this.getModel("ConfigModel").getData()["visibleNewUserSecondaryDialog"] = false;
            this.getModel("ConfigModel").getData()["editableRuc"] = false;
            this.getModel("ConfigModel").getData()["editableMail"] = false;

            this.getModel("ConfigModel").getData()["newUserDialogTitle"] = this._getI18nText("btnEditarUsuario");

            
            this.getModel("NewUserModel").refresh(true);
            this.getModel("ConfigModel").refresh(true);
            this["onewUserSecondary"].setModel(this.getModel("NewUserModel")); 
            this["onewUserSecondary"].setModel(this.getModel("ConfigModel"));     
        },
        onDeleteUser: function(){
            let sFilters;
            MessageBox.alert(that._getI18nText("msgOnAskDeleteUser",that.getModel("DetailModel").getData()["UsuarioActual"].Correo),{
                actions: ["Borrar usuario", "Cancelar"],
				emphasizedAction: "Borrar usuario",
				onClose: function (sAction) {
					if(sAction === "Borrar usuario"){
                        sap.ui.core.BusyIndicator.show();
                        iasService.deleteSingleUser(deployed, that.getModel("DetailModel").getData()["UsuarioActual"].UserId).then(oResult =>{
                            MessageToast.show(that._getI18nText("msgOnSuccessDeleteUser"));
                            
                            sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' + that.getModel("DetailModel").getData()["UsuarioPrincipal"].Ruc + '"'
                            + ' and ' + 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                            return iasService.readUsers(deployed, sFilters); 
                        }).then(oResult =>{
                            //Aqui se deben diferenciar entre los ambientes
                            //Lectura de usuarios con esquema custom
                            let aUsers = [];
                            if (oResult.Resources !== undefined){
                                oResult.Resources.filter( user => {
                                    return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]
                                }).forEach( UserCustom =>{
                                    if (UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find(customAt =>{
                                        if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)){
                                            return customAt;
                                        }
                                    })){
                                        aUsers.push(UserCustom);
                                    }
                                });
                            }
                            //Fin de lectura
                            if(aUsers.length > 0){
                                that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(aUsers);
                                that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = aUsers.length;
                            }else{
                                that.getModel("DetailModel").getData()["UsuariosSecundarios"] = [];
                                that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = 0;
                            }
                            that.getModel("DetailModel").refresh(true);
                        }).finally(oFinal =>{
                            sap.ui.core.BusyIndicator.hide();
                        }).catch(oError =>{
                            console.log(oError);
                        });
                    }
				}
            });
        },

        onCreateEditUser: function(oEvent){
            let sMode = that.getModel("ConfigModel").getData()["newUserDialogTitle"];
            if(sMode === "Crear usuario"){
                that.onCreateUserIas(oEvent.getSource().getParent());
            }else if (sMode === "Editar usuario"){
                that.onEditUserIas(oEvent.getSource().getParent());
            }
        },

        onCreateUserIas: function(auxDialog){
            let oUserForm = this.getModel("NewUserModel").getData();
            let oDialog = auxDialog;
            if (that.onValidarUserIas(oUserForm)[0]){
                switch(that.onValidarUserIas(oUserForm)[1]){
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
                }
            }else{
                let oUserObject = that.getUserObject(oUserForm, "Secundario"), sFilters;
                sap.ui.core.BusyIndicator.show();
                sFilters = 'userName co "' + oUserObject.userName + '"'; //Buscar por displayName
                iasService.readUsers(deployed, sFilters).then(oResult =>{
                    oUserObject.userName += String(oResult.totalResults + 1).padStart(3,0);
                    oUserObject.displayName += String(oResult.totalResults + 1).padStart(3,0);
                    
                    return iasService.createUser(deployed, oUserObject);
                }).then(oResult =>{
                    //Agregar rol a usuario creado
                    let oGroup = that.actionUserToRoleGroup("add", oResult);
                    oGroup.Operations[0].value[0].value = oResult.id;

                    return iasService.updateByPatchGroup(deployed, oGroup, that.rolBaseId);
                }).then(oResult =>{
                    MessageToast.show(this._getI18nText("msgOnSuccessCreateUser"));

                    sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' + that.getModel("DetailModel").getData()["UsuarioPrincipal"].Ruc + '"'
                + ' and ' + 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                return iasService.readUsers(deployed, sFilters);
                }).then(oResult =>{
                    //Aqui se deben diferenciar entre los ambientes
                    //Lectura de usuarios con esquema custom
                    let aUsers = [];
                    if (oResult.Resources !== undefined){
                        oResult.Resources.filter( user => {
                            return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]
                        }).forEach( UserCustom =>{
                            if (UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find(customAt =>{
                                if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)){
                                    return customAt;
                                }
                            })){
                                aUsers.push(UserCustom);
                            }
                        });
                    }
                    //Fin de lectura
                    if(aUsers.length > 0){
                        that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(aUsers);
                        that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = aUsers.length;
                    }else{
                        that.getModel("DetailModel").getData()["UsuariosSecundarios"] = [];
                        that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = 0;
                    }
                    that.getModel("DetailModel").refresh(true);
                }).catch(oError =>{
                    MessageBox.error(oError);
                }).finally(oFinal =>{
                    sap.ui.core.BusyIndicator.hide();
                    oDialog.close();
                });
            }
        },
        onEditUserIas: function(auxDialog){
            let oUserEdited = this.getModel("NewUserModel").getData();
            let oUserBefore = this.getModel("DetailModel").getData()["UsuarioActual"];
            let oDialog = auxDialog;

            if (that.onValidarUserIas(oUserEdited)[0]){
                switch(that.onValidarUserIas(oUserEdited)[1]){
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
                }
            }else{
                let oUserObject = that.getUserObject(oUserEdited, "Secundario"), sFilters;
                sap.ui.core.BusyIndicator.show();

                sFilters = 'emails.value eq "' + oUserBefore.Correo + '"';
                iasService.readUsers(deployed, sFilters).then(oResult =>{
                    oUserObject["userName"] = oResult.Resources[0].userName;
                    oUserObject["displayName"] = oResult.Resources[0].displayName;
                    oUserObject["active"] = oUserBefore["Status"];
                    return iasService.updateByPutUser(deployed, oUserObject, oUserBefore["UserId"]);
                }).then(oResult =>{
                    MessageToast.show(this._getI18nText("msgOnSuccessEditedUser"));

                    sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' + that.getModel("DetailModel").getData()["UsuarioPrincipal"].Ruc + '"'
                + ' and ' + 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                return iasService.readUsers(deployed, sFilters);
                }).then(oResult =>{
                    //Aqui se deben diferenciar entre los ambientes
                    //Lectura de usuarios con esquema custom
                    let aUsers = [];
                    if (oResult.Resources !== undefined){
                        oResult.Resources.filter( user => {
                            return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]
                        }).forEach( UserCustom =>{
                            if (UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find(customAt =>{
                                if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)){
                                    return customAt;
                                }
                            })){
                                aUsers.push(UserCustom);
                            }
                        });
                    }
                    //Fin de lectura
                    if(aUsers.length > 0){
                        that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(aUsers);
                        that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = aUsers.length;
                    }else{
                        that.getModel("DetailModel").getData()["UsuariosSecundarios"] = [];
                        that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = 0;
                    }
                    that.getModel("DetailModel").refresh(true);
                }).catch(oError =>{
                    MessageBox.error(oError);
                }).finally(oFinal =>{
                    sap.ui.core.BusyIndicator.hide();
                    oDialog.close();
                });
            }
        },
        
        onValidarUserIas: function(oUsuario){
            
            let aPropiedades = ["Name", "LastName1", "LastName2", "Email", "Phone", "ExpiracyDate"],
                bNoValidUser = false, iMessage=0;

            aPropiedades.forEach(propiedad =>{ 
                if(propiedad === "Name" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                    bNoValidUser = true;
                    iMessage = 1;
                }else if(propiedad === "Name" && oUsuario[propiedad] !== undefined) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                }

                if(propiedad === "LastName1" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                    bNoValidUser = true;
                    iMessage = 1;
                }else if(propiedad === "LastName1" && oUsuario[propiedad] !== undefined) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                }

                if(propiedad === "LastName2" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                    bNoValidUser = true;
                    iMessage = 1;
                }else if(propiedad === "LastName2" && oUsuario[propiedad] !== undefined) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                }

                if(propiedad === "Email" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                    bNoValidUser = true;
                    iMessage = 2;
                }else if(propiedad === "Email" && oUsuario[propiedad] !== undefined) {
                    if(that._validateEmail(oUsuario[propiedad]) === null){
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 2;
                    }else{
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }
                }

                if(propiedad === "Phone" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                    bNoValidUser = true;
                    iMessage = 3;
                }else if(propiedad === "Phone" && oUsuario[propiedad] !== undefined) {
                    if(oUsuario[propiedad].length > 9 || oUsuario[propiedad].length < 7){
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 3;
                    }else{
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }
                }

                if(propiedad === "ExpiracyDate" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === null)) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                    bNoValidUser = true;
                    iMessage = 4;
                }else if(propiedad === "ExpiracyDate" && oUsuario[propiedad] !== undefined) {
                    if(oUsuario[propiedad].getTime() < new Date().getTime()){
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 4;
                    }else{
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }
                }

            });
            this.getModel("NewUserModel").refresh(true);
            return [bNoValidUser, iMessage];
        },
        onCloseDialog: function(oEvent){
            oEvent.getSource().getParent().close();
        },
        getUserObject: function(oUser, sUserType=""){
            
           let oUserObject = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
                "urn:ietf:params:scim:schemas:extension:sap:2.0:User",
                "urn:sap:cloud:scim:schemas:extension:custom:2.0:User"
            ],
            "userName": formatter.getUserName(oUser.Name, oUser.LastName1 + oUser.LastName2),
            "name": {
              "familyName": oUser.LastName1 + " " + oUser.LastName2,
              "givenName": oUser.Name,
            },
            "displayName": formatter.getUserName(oUser.Name, oUser.LastName1 + oUser.LastName2),
            "active": true,
            "emails": [
              {
                "value": oUser.Email,
                "primary": true
              }
            ],
            "phoneNumbers": [
              {
                "value": oUser.Phone,
                "primary": true,
                "type": "work"
              }
            ],
            "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
              "division": sUserType,
              "costCenter": oUser.Ruc,
              "organization": oUser.RazonSocial
            },
            "urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
                "validTo": formatter.dateToZDate(oUser.ExpiracyDate),
                "sendMail": true
              },
              "urn:sap:cloud:scim:schemas:extension:custom:2.0:User":{
                "attributes": [{
                    name: "customAttribute2",
                    value: that.ambiente
                }]
              }
            }
            return oUserObject;
        },
        onUnassignRoleToUser:function(oEvent){
            //Reconocer el rol
            let sPath1 = oEvent.getSource().getParent().getBindingContext("DetailModel").sPath.split("/")[1],
                sPath2 = oEvent.getSource().getParent().getBindingContext("DetailModel").sPath.split("/")[2],
                sIndex = oEvent.getSource().getParent().getBindingContext("DetailModel").sPath.split("/")[3];

            let oRolSeleccionado = that.getModel("DetailModel").getData()[sPath1][sPath2][sIndex];

            //Comprobar que se repita el mismo rol

            let oUsuarioActual = that.getModel("DetailModel").getData()["UsuarioActual"];
            let oGroup = that.actionUserToRoleGroup("remove", oUsuarioActual);
            sap.ui.core.BusyIndicator.show();

            let sFilters;
            iasService.updateByPatchGroup(deployed, oGroup, oRolSeleccionado.value).then((oResult) => {
                MessageToast.show(that._getI18nText("msgOnSuccessUnassignedRole"));
                //Obtener los roles del nuevo usuario
                sFilters = 'emails.value eq "' + oUsuarioActual.Correo + '"';
                return iasService.readUsers(deployed,sFilters);
            }).then(oResult =>{
                let oEditedUser = that.formatUsersArray(oResult.Resources)[0];
                that.getModel("DetailModel").getData()["UsuarioActual"] = oEditedUser;

                let iIndex = that.getModel("DetailModel").getData()["UsuariosSecundarios"].findIndex(x=>{
                    return x.UserId === oEditedUser.UserId;
                });

                that.getModel("DetailModel").getData()["UsuariosSecundarios"].splice(iIndex, 1, oEditedUser);                         that.getModel("DetailModel").refresh(true);
            }).finally((oFinal) => {
                sap.ui.core.BusyIndicator.hide();
            }).catch((oError) => {
                console.log(oError);
            });
        },
        onAssignRoleToUser:function(oEvent){
            let sPath = oEvent.getSource().getParent().getBindingContext("DetailModel").sPath.split("/")[1],
                sIndex = oEvent.getSource().getParent().getBindingContext("DetailModel").sPath.split("/")[2];

            let oRolSeleccionado = that.getModel("DetailModel").getData()[sPath][sIndex];
            let oRolesUsuarioActual = that.getModel("DetailModel").getData()["UsuarioActual"]["Grupos"];

            if (oRolesUsuarioActual === undefined){
                oRolesUsuarioActual = [];
            }

            //Comprobar que no se repita el mismo rol

            let oRolRepetido = oRolesUsuarioActual.find(rol => {
                return rol.value === oRolSeleccionado.GroupId;
            });

            if (oRolRepetido) {
                MessageBox.error(that._getI18nText("msgOnDuplicatedRole"));
            }else{
                let oUsuarioActual = that.getModel("DetailModel").getData()["UsuarioActual"];
                let oGroup = that.actionUserToRoleGroup("add", oUsuarioActual);
                sap.ui.core.BusyIndicator.show();

                let sFilters;
                iasService.updateByPatchGroup(deployed, oGroup, oRolSeleccionado.GroupId).then((oResult) => {
                    MessageToast.show(that._getI18nText("msgOnSuccessAssignedRole"));
                    //Obtener los roles del nuevo usuario
                    sFilters = 'emails.value eq "' + oUsuarioActual.Correo + '"';
                    return iasService.readUsers(deployed,sFilters);
                }).then(oResult =>{
                    let oEditedUser = that.formatUsersArray(oResult.Resources)[0];
                    that.getModel("DetailModel").getData()["UsuarioActual"] = oEditedUser;

                    let iIndex = that.getModel("DetailModel").getData()["UsuariosSecundarios"].findIndex(x=>{
                        return x.UserId === oEditedUser.UserId;
                    });

                    that.getModel("DetailModel").getData()["UsuariosSecundarios"].splice(iIndex, 1, oEditedUser);                    
                    
                    that.getModel("DetailModel").refresh(true);
                }).finally((oFinal) => {
                    sap.ui.core.BusyIndicator.hide();
                }).catch((oError) => {
                    console.log(oError);
                });
            }


        },
        actionUserToRoleGroup: function(sAction, oUser){
            let oIasGroup = {
                "schemas": [
                    "urn:ietf:params:scim:api:messages:2.0:PatchOp"
                  ],
                "Operations": []
            };
            switch(sAction){
                case "add":
                    oIasGroup.Operations.push({
                        "op": "add",
                        "path": "members",
                        "value": [
                          {
                            "value": oUser.UserId
                          }
                        ]
                      });
                    break;
                case "remove":
                    oIasGroup.Operations.push( {
                        "op": "remove",
                        "path": 'members[value eq "' + oUser.UserId + '"]'
                      });
                    break;
            }

            return oIasGroup;
        },

        onBlockUser: function(){
            let sFilters, oUsuarioActual = that.getModel("DetailModel").getData().UsuarioActual;
            MessageBox.alert(that._getI18nText("msgOnAskBlockUser"),{
                actions: ["Modificar usuario", "Cancelar"],
				emphasizedAction: "Modificar usuario",
				onClose: function (sAction) {
					if(sAction === "Modificar usuario"){
                        sap.ui.core.BusyIndicator.show();
                        sFilters = 'emails.value eq "' + oUsuarioActual.Correo + '"';
                        iasService.readUsers(deployed, sFilters).then(oResult =>{
                            oResult.Resources[0].active = !oResult.Resources[0].active;
                            return iasService.updateByPutUser(deployed, oResult.Resources[0], oUsuarioActual["UserId"]);
                        }).then(oResult =>{
                            sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' + that.getModel("DetailModel").getData()["UsuarioPrincipal"].Ruc + '"'
                            + ' and ' + 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                            return iasService.readUsers(deployed, sFilters); 
                        }).then(oResult =>{
                            //Aqui se deben diferenciar entre los ambientes
                            //Lectura de usuarios con esquema custom
                            let aUsers = [];
                            if (oResult.Resources !== undefined){
                                oResult.Resources.filter( user => {
                                    return user["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]
                                }).forEach( UserCustom =>{
                                    if (UserCustom["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]["attributes"].find(customAt =>{
                                        if (customAt.name === "customAttribute2" && customAt.value.includes(that.ambiente)){
                                            return customAt;
                                        }
                                    })){
                                        aUsers.push(UserCustom);
                                    }
                                });
                            }
                            //Fin de lectura
                            if(aUsers.length > 0){
                                that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(aUsers);
                                that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = aUsers.length;
                            }else{
                                that.getModel("DetailModel").getData()["UsuariosSecundarios"] = [];
                                that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = 0;
                            }
                            that.getModel("DetailModel").refresh(true);
                        }).finally(oFinal =>{
                            sap.ui.core.BusyIndicator.hide();
                        }).catch(oError =>{
                            console.log(oError);
                        });
                    }
				}
            });
        },
        onExportExcel: function(oEvent) {
            let aUsuariosSecundarios = that.getModel("DetailModel").getData()["UsuariosSecundarios"];
            
            let aCols, aUsuarios, oSettings, oSheet;

			aCols = that.createColumnConfig();
			aUsuarios = aUsuariosSecundarios;

			oSettings = {
				workbook: { columns: aCols },
				dataSource: aUsuarios
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then( function() {
					MessageToast.show(that._getI18nText("msgOnSuccessExport"));
				})
				.finally(oSheet.destroy);
        },
        createColumnConfig: function(){
            return [
				{
					label: that._getI18nText("excelLabelName"),
					property: "Nombres",
                    width: "100",
					type: EdmType.String
				},
				{
					label: that._getI18nText("excelLabelLastNames"),
					property: "Apellidos",
					width: "100",
					type: EdmType.String
                    
				},
				{
					label: that._getI18nText("excelLabelMail"),
					property: "Correo",
					width: "200",
                    type: EdmType.String
				},
				{
					label: that._getI18nText("excelLabelPhone"),
					property: "Telefono",
                    width: "10",
					type: EdmType.String
				},
				{
					label: that._getI18nText("excelLabelStatus"),
					property: "Status",
                    width: "10",
					type: EdmType.String
				}];
        },

        handleUploadDNIFront: function(oEvent){
            let aFiles=oEvent.getParameters().files;
            let currentFile = aFiles[0];

            if (currentFile) {
                var reader = new FileReader();
                reader.onload = function(readerEvt) {
                    var binaryString = readerEvt.target.result;
                    that.getModel("UploadModel").getData().FrontDNI = btoa(binaryString);
                };
                reader.readAsBinaryString(currentFile);
            }
        },

        handleUploadDNIBack: function(oEvent){
            let aFiles=oEvent.getParameters().files;
            let currentFile = aFiles[0];

            if (currentFile) {
                var reader = new FileReader();
        
                reader.onload = function(readerEvt) {
                    var binaryString = readerEvt.target.result;
                    that.getModel("UploadModel").getData().BackDNI = btoa(binaryString);
                };
        
                 reader.readAsBinaryString(currentFile);
            }
        },
        handleActionUploadDNI: function(oEvent){
            let oObject = that.getModel("DetailModel").getData()["UsuarioActual"];
            that.setModel(new JSONModel({"id": oObject.UserId, "email": oObject.Correo, "frontDNI": "", "backDNI":""}), "UploadModel");


            sap.ui.core.BusyIndicator.show();
            let sFilters = 'emails.value eq "' + oObject.Correo + '"';
            iasService.readUsers(deployed, sFilters).then(oResult =>{
                let aCamposCustom = oResult.Resources[0]["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes;
                let aPromise = [];
                let camposDNI = aCamposCustom.find(x=>{return x.name === "customAttribute10"});
                if( camposDNI !== undefined){
                    camposDNI = JSON.parse(camposDNI.value);
                    that.getModel("UploadModel").getData().bDNI = true;

                    aPromise.push(that.getDocumentFromDS(camposDNI.front));
                    aPromise.push(that.getDocumentFromDS(camposDNI.back));

                    Promise.all(aPromise).then(aResults =>{
                        that.getModel("UploadModel").getData().DNIAnverso = aResults[0];
                        that.getModel("UploadModel").getData().DNIReverso = aResults[1];
                        that.getModel("UploadModel").refresh(true);
                    });

                }else{
                    let sDefaultImage = sap.ui.require.toUrl(
                        "clientportal/saasa/com/pe/usermanager/assets/NotFound.jpg"
                    );
                    that.getModel("UploadModel").getData().bDNI = false;

                    that.getModel("UploadModel").getData().DNIAnverso = sDefaultImage;
                    that.getModel("UploadModel").getData().DNIReverso = sDefaultImage;

                }
                console.log(oResult);
            }).catch(oError =>{
                console.log(oError);
            }).finally(() =>{
                sap.ui.core.BusyIndicator.hide();
                that.getModel("UploadModel").refresh(true);
                this._openDialogDinamic("uploadDocument");
                this["ouploadDocument"].setModel(that.getModel("UploadModel"));
            });
        },
        uploadDNI: function(jsonDni){
            try {
                return new Promise(function (resolve, reject) {
                let sPath = `${window.RootPath}/services/api/dms/uploadDNI`;
                fetch(sPath, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonDni)
                }).then(response => response.json()).then(data =>{
                    resolve(data);
                }).catch(error =>{
                    reject(error);
                });
            });
            } catch (oError) {
                console.log(oError);
            }
        },
        getDocumentFromDS: function(sId){
            let sPath = `${window.RootPath}/services/api/DocumentServiceService?documentoId=` + sId;
            return new Promise(function (resolve, reject) {
                fetch(sPath, {
                    method: 'GET'
                }).then(oResult => oResult.arrayBuffer()).then(oResult =>{
                    var blob = new Blob([oResult], {type: "image/jpeg"});
                    
                    // process to auto download it
                    const fileURL = URL.createObjectURL(blob);
                    resolve(fileURL);
                }).catch(oError =>{
                    reject(oError);
                });
            });
        },
  
        onGetJsonDni: function(ambiente, idUsuario, dniFront, dniBack){
            let oDni = { 
                "Ambiente": ambiente,
                "IdUsuario": idUsuario,
                "DniFront": dniFront,
                "DniBack": dniBack
            };
            return oDni;
        },
        onUploadDocument: function(oEvent){
            let uploadModel = that.getModel("UploadModel").getData();
            if ((uploadModel.FrontDNI === undefined || uploadModel.FrontDNI === "") || (uploadModel.BackDNI === undefined || uploadModel.BackDNI === "")){
                MessageToast.show(that._getI18nText("msgOnErrorCompleteDocument"));
            }else{
                sap.ui.core.BusyIndicator.show();
                let oObjetoUsuario;
                iasService.readSingleUser(deployed, uploadModel.id).then(oResult =>{
                    let bFlagExisteDocumento = (oResult["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.find(x =>{
                        return x.name === "customAttribute10";
                    }) === undefined ? false : true);

                    /* if (bFlagExisteDocumento){
                        MessageBox.error(that._getI18nText("msgOnErrorDocumentAlreadySubmitted"));
                        return Promise.reject();
                    } */
                    
                   let oBody = that.onGetJsonDni(that.ambiente, uploadModel.id, uploadModel.FrontDNI, uploadModel.BackDNI);
                   oObjetoUsuario = oResult;
                   
                   return that.uploadDNI(oBody);
                }).then(oResult =>{
                    oObjetoUsuario["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.push({
                        "name": "customAttribute10",
                        "value": JSON.stringify({
                            "front": oResult[0].documento.Id,
                            "back": oResult[1].documento.Id
                        })
                    });
                    
                    return iasService.updateByPutUser(deployed, oObjetoUsuario, oObjetoUsuario.id);
                }).then(oResult =>{
                    MessageBox.success(that._getI18nText("msgOnSuccessDocument"));
                }).catch(oError =>{
                    console.log(oError);
                }).finally(oFinal =>{
                    sap.ui.core.BusyIndicator.hide();
                    delete that.getModel("UploadModel").getData().FrontDNI;
                    delete that.getModel("UploadModel").getData().BackDNI;
                    this["ouploadDocument"].close();
                });
            }
        }

      }
    );
  }
);
