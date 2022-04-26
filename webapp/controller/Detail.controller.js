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
            that.appNamespace = "ClientPortal";
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
                if(oResult.Resources){
                    that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(oResult.Resources);
                    that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = oResult.totalResults;
                    that.getModel("DetailModel").refresh(true);
                }
            }).finally(oFinal =>{
                sap.ui.core.BusyIndicator.hide();
            }).catch(oError =>{
                console.log(oError);
            });

            //Leer grupos de roles
            sap.ui.core.BusyIndicator.show();
            sFilters = 'displayName co "' + that.appNamespace + '"'; //Filtro para DisplayNames
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

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("RouteMain", true);
			}
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
                 
                
                that.getModel("DetailModel").getData()["UsuarioActual"] = null;
                that.getModel("DetailModel").refresh(true);                
            }else{
                this.byId("idBtnDeleteSecondaryUser").setEnabled(true);
                this.byId("idBtnEditSecondaryUser").setEnabled(true); 
                this.byId("idBtnAssignRolesSecondaryUser").setEnabled(true);  
                this.byId("idBtnBlockSecondaryUser").setEnabled(true); 
    
                
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
            this.getModel("NewUserModel").setData({});

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
            this.getModel("NewUserModel").getData().Dni = that.getModel("DetailModel").getData()["UsuarioActual"].Dni;
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
                            that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(oResult.Resources);
                            that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = oResult.totalResults;
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
                    case 6:
                        MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser6"));
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
                    MessageToast.show(this._getI18nText("msgOnSuccessCreateUser"));

                    sFilters = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter eq "' + that.getModel("DetailModel").getData()["UsuarioPrincipal"].Ruc + '"'
                + ' and ' + 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division eq "Secundario"';
                return iasService.readUsers(deployed, sFilters);
                }).then(oResult =>{
                    that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(oResult.Resources);
                that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = oResult.totalResults;
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
                    case 6:
                        MessageBox.error(that._getI18nText("msgBoxErrOnCreateUser6"));
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
                    that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(oResult.Resources);
                that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = oResult.totalResults;
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
            
            let aPropiedades = ["Name", "LastName1", "LastName2", "Dni", "Email", "Phone", "ExpiracyDate"],
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

                if(propiedad === "Dni" && (oUsuario[propiedad] === undefined || oUsuario[propiedad] === "")) {
                    this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                    bNoValidUser = true;
                    iMessage = 6;
                }else if(propiedad === "Dni" && oUsuario[propiedad] !== undefined) {
                    if(oUsuario[propiedad].length != 8){
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "Error";
                        bNoValidUser = true;
                        iMessage = 6;
                    }else{
                        this.getModel("NewUserModel").getData()["State" + propiedad] = "None";
                    }
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
                "urn:ietf:params:scim:schemas:extension:sap:2.0:User"
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
                "employeeNumber": oUser.Dni,
                "division": sUserType,
              "costCenter": oUser.Ruc,
              "organization": oUser.RazonSocial
            },
            "urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
                "validTo": formatter.dateToZDate(oUser.ExpiracyDate),
                "sendMail": true
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
                that.getModel("DetailModel").getData()["UsuarioActual"] = that.formatUsersArray(oResult.Resources)[0];
                that.getModel("DetailModel").refresh(true);
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
                    that.getModel("DetailModel").getData()["UsuarioActual"] = that.formatUsersArray(oResult.Resources)[0];
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
                            that.getModel("DetailModel").getData()["UsuariosSecundarios"] = that.formatUsersArray(oResult.Resources);
                            that.getModel("DetailModel").getData()["CantUsuariosSecundarios"] = oResult.totalResults;
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
        }

      }
    );
  }
);
