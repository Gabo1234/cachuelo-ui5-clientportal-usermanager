sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "clientportal/saasa/com/pe/usermanager/model/models"
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("clientportal.saasa.com.pe.usermanager.Component", {
            metadata: {
                manifest: "json",
                config: { fullWidth: true }
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                

                window.AppId = this.getMetadata().getManifest()["sap.app"].id;
                console.log("*************************************")
                if (window.location.href.indexOf("applicationstudio.cloud.sap") > -1) {
                    window.RootPath = "";

                } else if (window.location.href.indexOf("https://cargarampadev.cpp.cfapps.br10.hana.ondemand.com") > -1 ||
                    window.location.href.indexOf("https://cargarampaqas.cpp.cfapps.br10.hana.ondemand.com") > -1 ||
                    window.location.href.indexOf("https://cargarampa.cpp.cfapps.br10.hana.ondemand.com") > -1) {

                    window.RootPath = "/" + window.location.href.split("/")[3];

                    if (window.RootPath === '/cp.portal') {
                        window.RootPath = jQuery.sap.getModulePath(window.AppId);
                    }
                } else {
                    window.RootPath = jQuery.sap.getModulePath(window.AppId);
                }

                console.log("RootPath", window.RootPath);
                console.log("*************************************")

                // enable routing
                this.getRouter().initialize();
                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);