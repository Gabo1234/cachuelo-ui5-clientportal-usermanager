sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, UIComponent, MessageBox, MessageToast, Formatter) {
        "use strict";
        let that = this;
        that.ambiente = "PRD";
        that.appNamespace = "ClientPortal"; 



        return Controller.extend("clientportal.saasa.com.pe.usermanager.controller.BaseController", {
            /**
             * Convenience method for accessing the router.
             * @public
             * @returns {sap.ui.core.routing.Router} the router for this component
             */
            getRouter: function () {
                return UIComponent.getRouterFor(this);
            },

            /**
             * Convenience method for getting the view model by name.
             * @public
             * @param {string} [sName] the model name
             * @returns {sap.ui.model.Model} the model instance
             */
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            /**
             * Convenience method for setting the view model.
             * @public
             * @param {sap.ui.model.Model} oModel the model instance
             * @param {string} sName the model name
             * @returns {sap.ui.mvc.View} the view instance
             */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },
            /**
             * Getter for the resource bundle.
             * @public
             * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
             */
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

            /**
             * Returns a promises which resolves with the resource bundle value of the given key <code>sI18nKey</code>
             *
             * @public
             * @param {string} sI18nKey The key
             * @param {sap.ui.core.model.ResourceModel} oResourceModel The resource model
             * @param {string[]} [aPlaceholderValues] The values which will repalce the placeholders in the i18n value
             * @returns {Promise<string>} The promise
             */
            getBundleTextByModel: function (sI18nKey, oResourceModel, aPlaceholderValues) {
                //return oResourceModel.getResourceBundle().then(function (oBundle) {
                //    return oBundle.getText(sI18nKey, aPlaceholderValues);
                //});
            },
            // Mensajes de error.
            onErrorMessage: function (oError, textoI18n) {
                try {
                    if (oError.responseJSON) {
                        if (oError.responseJSON.error) {
                            MessageBox.error(oError.responseJSON.error.message.value);
                        } else {
                            if (oError.responseJSON[0]) {
                                if (oError.responseJSON[0].description) {
                                    MessageBox.error(oError.responseJSON[0].description);
                                } else {
                                    //MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText(textoI18n));
                                    MessageBox.error(this.i18nBundle.getText(textoI18n));
                                }
                            } else {
                                if (oError.responseJSON.message) {
                                    MessageBox.error(oError.responseJSON.message);
                                } else {
                                    MessageBox.error(oError.responseJSON.response.description);
                                }
                            }
                        }
                    } else if (oError.responseText) {
                        try {
                            if (oError.responseText) {
                                var oErrorRes = JSON.parse(oError.responseText),
                                    sErrorDetails = oErrorRes.error.innererror.errordetails;
                                MessageBox.error(sErrorDetails[0].message);
                            } else {
                                this.onErrorMessage("", "errorSave");
                            }
                        } catch (error) {
                            MessageBox.error(oError.responseText);
                        }
                    } else if (oError.message) {
                        MessageBox.error(oError.message);
                    } else {
                        MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText(textoI18n));
                    }
                } catch (oErrorT) {
                    this.onErrorMessage(oErrorT, "errorSave");
                }
            },
            _getI18nText: function (sText, sParams = "") {
                if(sParams === ""){
                    return (this.oView.getModel("i18n") === undefined)?false:this.oView.getModel("i18n").getResourceBundle().getText(sText);
                }else{
                    return (this.oView.getModel("i18n") === undefined)?false:this.oView.getModel("i18n").getResourceBundle().getText(sText, sParams);
                }
              },
              _openDialogDinamic: function (sDialog) {
                  var sDialogName = "o" + sDialog;
                  if (!this[sDialogName]) {
                    this[sDialogName] = sap.ui.xmlfragment(
                      "frg" + sDialog,
                      "clientportal.saasa.com.pe.usermanager" + ".view.dialogs." + sDialog,
                      this
                    );
                    this.getView().addDependent(this[sDialogName]);
                  }
                  this[sDialogName].open();
                },
                _validateEmail: function(sEmail){
                    return String(sEmail)
                    .toLowerCase()
                    .match(
                      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    );
                },
                formatUsersArray: function(aUserArray){
                    let aUsers = [], oFormattedUser = {};
                    aUserArray.forEach((oUser) =>{
                        oFormattedUser = {};
                        
                        oFormattedUser["UserId"] = oUser["id"];
                        oFormattedUser["Nombres"] = oUser["name"].givenName;
                        oFormattedUser["Apellidos"] = oUser["name"].familyName;
                        oFormattedUser["Dni"] = oUser["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].employeeNumber;
                        oFormattedUser["Correo"] = (oUser["emails"]===undefined)?null:oUser["emails"][0].value;
                        oFormattedUser["Telefono"] = (oUser["phoneNumbers"]===undefined)?null:oUser["phoneNumbers"][0].value; //Confirmar
                        oFormattedUser["Vigencia"] = (oUser["urn:ietf:params:scim:schemas:extension:sap:2.0:User"]===undefined)?null:Formatter.formatZDateToDate(oUser["urn:ietf:params:scim:schemas:extension:sap:2.0:User"]["validTo"]); //Formatear
                        oFormattedUser["Ruc"] = oUser["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].costCenter;
                        oFormattedUser["RazonSocial"] = oUser["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"].organization;
                        oFormattedUser["Status"] = oUser["active"];

                        if(oUser["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]){
                            oUser["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes.find(x=>{
                                if (x.name === "customAttribute3"){
                                    oFormattedUser["RolAgenteAduana"] = true;
                                }
                                if (x.name === "customAttribute4"){
                                    oFormattedUser["RolAgenteCarga"] = true;
                                }
                                if (x.name === "customAttribute5"){
                                    oFormattedUser["RolCliente"] = true;
                                }
                            });
                        }
        
                        if (oUser["groups"] !== undefined){
                            oFormattedUser["Grupos"] = oUser["groups"].filter(grupo =>{
                                return grupo["display"].includes(that.appNamespace + " -") && grupo["display"].includes("- " + that.ambiente); 
                            });
                        }
        
                        aUsers.push(oFormattedUser);
                    });
                    return aUsers;
                },
                formatGroupsArray: function(aGroupArray){
                    let aGroups = [], oFormattedGroup = {};
                    aGroupArray.forEach((oGroup) =>{
                        oFormattedGroup = {};
                        
                        oFormattedGroup["GroupId"] = oGroup["id"];
                        oFormattedGroup["Nombre"] = oGroup["displayName"];
                        oFormattedGroup["Descripcion"] = oGroup["urn:sap:cloud:scim:schemas:extension:custom:2.0:Group"].description;
                        
        
                        aGroups.push(oFormattedGroup);
                    });
                    return aGroups;
                },

                handleTypeMissmatch: function(){
                    MessageToast.show(this._getI18nText("msgErrorTypeMismatch"));
                },

                editCustomAttribute: function(oUser, idStat, sContent){
                    let bCustomSchema = (oUser["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"] === undefined) ? false : true;
                    let oAtt = {
                        "name" : "customAttribute" + idStat,
                        "value": sContent
                    };

                    if (bCustomSchema){
                        let aAttributes = oUser["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes;
                        if (sContent === ""){
                            aAttributes.splice(aAttributes.indexOf(aAttributes.filter((x) =>{return x.name === "customAttribute" + idStat; })),1);
                        }else{
                            let oAttToEdit = aAttributes.find(x =>{return x.name === "customAttribute" + idStat; });
                            if (oAttToEdit !== undefined){
                                oAttToEdit.value = sContent;
                            }else{
                                aAttributes.push(oAtt);
                            }
                        }
                    }else{
                        oUser.schemas.push("urn:sap:cloud:scim:schemas:extension:custom:2.0:User");
                        oUser["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"] = {"attributes" : [oAtt]};
                    }
                    
                    
                }

        });

    });