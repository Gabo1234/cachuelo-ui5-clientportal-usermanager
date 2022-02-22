sap.ui.define(["sap/ui/model/json/JSONModel"], function (JSONModel) {
    "use strict";
    return {
        oDataRead: function (oModel, sEntity, oUrlParameters, aFilter) {
            return new Promise(function (resolve, reject) {
                oModel.read("/" + sEntity, {
                    async: false,
                    filters: aFilter == null ? [] : aFilter,
                    urlParameters: oUrlParameters == null ? {} : oUrlParameters,
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    },
                });
            });
        },
        oDataReadExpand: function (oModel, sEntity, oExpand) {
            return new Promise(function (resolve, reject) {
                oModel.read("/" + sEntity, {
                    async: false,
                    urlParameters: {
						"$expand":oExpand
					},
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    },
                });
            });
        },
        oDataCreate: function (oModel, sEntity, oData) {
            return new Promise(function (resolve, reject) {
                oModel.create("/" + sEntity, oData, {
                    async: false,
                    success: function (data, header, request) {
                        resolve(header);
                    },
                    error: function (error) {
                        reject(error);
                    },
                });
            });
        },
        oDataUpdate: function (oModel, sEntity, oData) {
            //oKey = {BPRequestID: ""}
            return new Promise(function (resolve, reject) {
                oModel.update(sEntity, oData, {
                    async: false,
                    success: function (data, header, request) {
                        resolve(header);
                    },
                    error: function (error) {
                        reject(error);
                    },
                });
            });
        },
        oDataRemove: function (oModel, sEntity) {
            return new Promise(function (resolve, reject) {
                oModel.remove(sEntity, {
                    async: false,
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    },
                });
            });
        }
    };
});