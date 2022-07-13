sap.ui.define(["sap/ui/model/json/JSONModel"], function (JSONModel) {
  "use strict";
  return {
    getRoute: function(deployed){
        let deployedRoute = window.RootPath + "/scim", undeployedRoute = window.RootPath + "/scim";
        let sRoute = (deployed)?deployedRoute:undeployedRoute;
            
            
        return sRoute;
    },
    readUsers: function (deployed, sFilters="") {
        try {
            let sRoute = this.getRoute(deployed);
            let filters = (sFilters==="")?"":"&filter=" + sFilters;
            return new Promise(function (resolve, reject) {
                $.ajax({
                    "url": sRoute + "/Users?startId=initial"+ filters,
                    "type": 'GET',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    },
    auxReadUsers: function (deployed, sFilters="", sPaginationId="") {
        try {
            let sRoute = this.getRoute(deployed);
            let filters = (sFilters==="")?"":"&filter=" + sFilters;
            return new Promise(function (resolve, reject) {
                $.ajax({
                    "url": sRoute + "/Users?startId=" + sPaginationId + filters,
                    "type": 'GET',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    },
    readUsersWithPagination: async function (deployed, sFilters="") {
        try {
            let bEnd = false;
            let oBatch, aUsuarios = [], nextId = "initial"; 
            while (!bEnd){
                oBatch = await this.auxReadUsers(deployed,sFilters, nextId);
                if (oBatch.nextId !== "end"){
                    nextId = oBatch.nextId;
                }else {
                    bEnd = true;
                }
                aUsuarios.push(oBatch);
            }
            let aAux = [], oAux = {};
            aUsuarios.forEach(x => {
                if (aAux.length !== 0) {
                    aAux = aAux.concat(x.Resources);
                }else{
                    aAux = x.Resources;
                }
            });
            oAux = {Resources: (aAux === undefined) ? [] : aAux, totalResults: (aAux === undefined) ? 0 : aAux.length};
            return oAux;
        } catch (oError) {
            console.log(oError);
        }
    },
    readSingleUser: function (deployed, sUser="") {
        try {
            let sRoute = this.getRoute(deployed);
            let user = (sUser==="")?"":"/" + sUser;
            return new Promise(function (resolve, reject) {
                $.ajax({
                    "url": sRoute + "/Users" + user,
                    "type": 'GET',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    },
    readGroups: function(deployed, sFilters=""){
        try {
            let sRoute = this.getRoute(deployed);
            let filters = (sFilters==="")?"":"&filter=" + sFilters;
            return new Promise(function (resolve, reject) {
                $.ajax({
                    "url": sRoute + "/Groups?count=500" + filters,
                    "type": 'GET',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    },
    createUser: function(deployed, oUserObject){
        try {
            let sRoute = this.getRoute(deployed);
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: sRoute + "/Users",
                    type: 'POST',
                    data: JSON.stringify(oUserObject),
                    contentType: 'application/scim+json',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    },

    deleteSingleUser: function (deployed, sUser=""){
        try {
            let sRoute = this.getRoute(deployed);
            let user = (sUser==="")?"":"/" + sUser;
            return new Promise(function (resolve, reject) {
                $.ajax({
                    "url": sRoute + "/Users" + user,
                    "type": 'DELETE',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    },

    updateByPatchUser: function (deployed, oUserObject, sUser=""){
        try {
            let sRoute = this.getRoute(deployed);
            let user = (sUser==="")?"":"/" + sUser;
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: sRoute + "/Users" + user,
                    type: 'PATCH',
                    data: JSON.stringify(oUserObject),
                    contentType: 'application/scim+json',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    },
    updateByPutUser: function(deployed, oUserObject, sUser=""){
        try {
            let sRoute = this.getRoute(deployed);
            let user = (sUser==="")?"":"/" + sUser;
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: sRoute + "/Users" + user,
                    type: 'PUT',
                    data: JSON.stringify(oUserObject),
                    contentType: 'application/scim+json',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    },
    updateByPatchGroup: function (deployed, oGroupObject, sGroupId){
        try {
            let sRoute = this.getRoute(deployed);
            let group = (sGroupId==="")?"":"/" + sGroupId;
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: sRoute + "/Groups" + group,
                    type: 'PATCH',
                    data: JSON.stringify(oGroupObject),
                    contentType: 'application/scim+json',
                    success: (resp) => {
                        resolve(resp);
                    },
                    error: (err) => {
                        reject(err);
                    }
                })
            });
        } catch (oError) {
            console.log(oError);
        }
    }
  };
});
