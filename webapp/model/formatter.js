sap.ui.define(
  ["sap/base/strings/formatMessage", "sap/ui/core/format/NumberFormat"],
  function (formatMessage, NumberFormat) {
    "use strict";

    return {
      formatMessage: formatMessage,

      /**
       * Determines the path of the image depending if its a phone or not the smaller or larger image version is loaded
       *
       * @public
       * @param {boolean} bIsPhone the value to be checked
       * @param {string} sImagePath The path of the image
       * @returns {string} path to image
       */
      srcImageValue: function (bIsPhone, sImagePath) {
        if (bIsPhone) {
          sImagePath += "_small";
        }
        return sImagePath + ".jpeg";
      },

      /**
       * Rounds the number unit value to 2 digits
       * @public
       * @param {string} sValue the number string to be rounded
       * @returns {string} sValue with 2 digits rounded
       */
      numberUnit: function (sValue) {
        if (!sValue) {
          return "";
        }
        return parseFloat(sValue).toFixed(2);
      },
      getFormatDate: function (sDate) {
        if (sDate) {
          var oDate = new Date(sDate);
          oDate.setDate(oDate.getDate() + 1);
          var sFormatDate = oDate.toUTCString();
          sFormatDate =
            this.formatter.paddZeroes(oDate.getUTCMonth() + 1, 2) +
            "-" +
            oDate.getFullYear();
          return sFormatDate;
        } else return "";
      },
      getFormatShortDate: function (sDate) {
        if (sDate) {
          var oDate = new Date(sDate);
          //oDate.setDate(oDate.getDate() + 1);
          var sFormatDate = oDate.toUTCString();
          sFormatDate =
            this.paddZeroes(oDate.getUTCDate(), 2) +
            "-" +
            this.paddZeroes(oDate.getUTCMonth() + 1, 2) +
            "-" +
            oDate.getFullYear();
          return sFormatDate;
        } else return "";
      },
      paddZeroes: function (number, size) {
        number = number.toString();
        while (number.length < size) number = "0" + number;
        return number;
      },
      Time: function (val) {
        if (val) {
          val = val.replace(/^PT/, "").replace(/S$/, "");
          val = val.replace("H", ":").replace("M", ":");

          var multipler = 60 * 60;
          var result = 0;
          val.split(":").forEach(function (token) {
            result += token * multipler;
            multipler = multipler / 60;
          });
          var timeinmiliseconds = result * 1000;
          var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
            pattern: "HH:mm:ss a",
          });

          var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
          return timeFormat.format(new Date(timeinmiliseconds + TZOffsetMs));
        }
        return null;
      },
      sumValues: function (var1) {
        var totals = this.getModel("Registros").getData();
        var tTotal1 = 0;
        for (var i = 0, len = totals.length; i < len; i++) {
          tTotal1 += parseInt(totals[i].Valor1, 0);
        }
        return tTotal1;
      },
      statusFormatter: function (estado) {
        var stsVal;
        if (estado === "Aprobado" || estado === "Aprobado Mesa") {
          stsVal = "Success";
        }
        if (estado === "Enviado") {
          stsVal = "Warning";
        }
        if (estado === "Rechazado") {
          stsVal = "Error";
        }
        return stsVal;
      },
      stateFormatter: function (bStatus) {
        var sState = "Warning";
        sState = "Information";
        if (bStatus) {
          sState = "Success";
        } else {
          sState = "Error";
        }
        return sState;
      },
      stateIconFormatter: function (bStatus) {
        var sState = "sap-icon://alert";
        sState = "sap-icon://information";
        if (bStatus) {
          sState = "sap-icon://sys-enter-2";
        } else {
          sState = "sap-icon://error";
        }
        return sState;
      },
      nvl: function (value1, value2) {
        if (value1 === null || value1 === "" || value1 == undefined)
          return value2;
        return value1;
      },
      formatValue: function (value) {
        value = parseFloat(value).toFixed(3);
        var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
          maxFractionDigits: 3,
          groupingEnabled: true,
          groupingSeparator: "",
          decimalSeparator: ".",
        });
        return oNumberFormat.format(value);
      },
      getDateDMYFormat: function (sDate) {
        if (sDate) {
          var oDate = new Date(sDate);
          //var sFormatDate = oDate.toUTCString();
          var sFormatDate =
            oDate.getDate() +
            "/" +
            this.formatter.paddZeroes(oDate.getMonth() + 1, 2) +
            "/" +
            oDate.getFullYear();
          return sFormatDate;
        } else return "";
      },
      getDateTimeDMYHSFormat: function (sDate) {
        if (sDate) {
          var oDate = new Date(sDate);
          var sFormatDate =
            oDate.getDate() +
            "/" +
            this.formatter.paddZeroes(oDate.getMonth() + 1, 2) +
            "/" +
            oDate.getFullYear() +
            " " +
            this.formatter.paddZeroes(oDate.getHours(), 2) +
            ":" +
            this.formatter.paddZeroes(oDate.getMinutes(), 2) +
            ":" +
            this.formatter.paddZeroes(oDate.getSeconds(), 2);
          return sFormatDate;
        } else return "";
      },
      getBoleanEdit: function (bValue) {
        if (!(bValue == null || bValue == undefined)) {
          return bValue;
        } else return false;
      },
      getBoleanDel: function (bValue) {
        if (!(bValue == null || bValue == undefined)) {
          return bValue;
        } else return true;
      },
      formatDateDMYHMS: function (sDate) {
        var oDate = new Date();
        if (sDate) {
          oDate = new Date(sDate);
        }

        var hours = "00";
        var minutes = "00";
        var seconds = "00";
        var day = "00";
        var month = "00";
        var year = "00";

        day = oDate.getDate();
        month = oDate.getMonth() + 1;
        year = oDate.getFullYear();

        hours = oDate.getHours();
        minutes = oDate.getMinutes();
        seconds = oDate.getSeconds();

        day = day <= 9 ? "0" + day : day;
        month = month <= 9 ? "0" + month : month;
        hours = hours <= 9 ? "0" + hours : hours;
        minutes = minutes <= 9 ? "0" + minutes : minutes;
        seconds = seconds <= 9 ? "0" + seconds : seconds;

        var fullDate = [year, month, day].join("-");
        var fullHour = [hours, minutes, seconds].join(":");
        var sDateFormat = [fullDate, fullHour].join(" ");
        return sDateFormat;
      },
      format: function (cellValue) {
        this.onAfterRendering = function () {
          var cellId = this.getId();
          $("#" + cellId)
            .parent()
            .parent()
            .parent()
            .css("background-color", "red");
          return cellValue;
        };
      },
      /**-----------------------------------------------*/
      /*                   COIN
              /**-----------------------------------------------*/
      formatWeight: function (weight) {
        if (!coin) coin = 0;

        var mOptions = {
          groupingSeparator: "",
          decimalSeparator: ".",
          minFractionDigits: 3,
          maxFractionDigits: 3,
        };

        try {
          var oFloatFormat = NumberFormat.getFloatInstance(mOptions);
          coin = oFloatFormat.format(weight);
        } catch (oError) {
          coin = this.formatMoney(
            coin,
            mOptions.maxFractionDigits,
            mOptions.decimalSeparator,
            mOptions.groupingSeparator
          );
        }
        return coin;
      },
      formatCoin: function (coin) {
        if (!coin) coin = 0;

        var mOptions = {
          groupingSeparator: "",
          decimalSeparator: ".",
          minFractionDigits: 3,
          maxFractionDigits: 3,
        };

        try {
          var oFloatFormat = NumberFormat.getFloatInstance(mOptions);
          coin = oFloatFormat.format(coin);
        } catch (oError) {
          coin = this.formatMoney(
            coin,
            mOptions.maxFractionDigits,
            mOptions.decimalSeparator,
            mOptions.groupingSeparator
          );
        }
        return coin;
      },
      formatMoney: function (number, decPlaces, decSep, thouSep) {
        (decPlaces = isNaN((decPlaces = Math.abs(decPlaces))) ? 2 : decPlaces),
          (decSep = typeof decSep === "undefined" ? "." : decSep);
        thouSep = typeof thouSep === "undefined" ? "," : thouSep;
        var sign = number < 0 ? "-" : "";
        var i = String(
          parseInt((number = Math.abs(Number(number) || 0).toFixed(decPlaces)))
        );
        var j = (j = i.length) > 3 ? j % 3 : 0;

        return (
          sign +
          (j ? i.substr(0, j) + thouSep : "") +
          i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
          (decPlaces
            ? decSep +
              Math.abs(number - i)
                .toFixed(decPlaces)
                .slice(2)
            : "")
        );
      },
      /**-----------------------------------------------*/
      /*                   DATE / TIME
        /**-----------------------------------------------*/

      /**
       * @Description
       * Funcion que devuelve la hora de un objeto
       *
       * @param  {Object} Edm.Time
       * @return  {String} [hours minutes seconds]
       * @example {
       *  var sHMS = fotmatter.getMsToHMS({Edm.Time});
       *  //sHMS -> 10:20:34
       *  <Text text="{path: 'oData>property_Time', formatter: '.formatter.getMsToHMS'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getMsToHMS: function (oEdmTime) {
        //Type="Edm.Time"
        try {
          var duration = oEdmTime.ms;
          var milliseconds = Math.floor((duration % 1000) / 100),
            seconds = Math.floor((duration / 1000) % 60),
            minutes = Math.floor((duration / (1000 * 60)) % 60),
            hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

          hours = hours < 10 ? "0" + hours : hours;
          minutes = minutes < 10 ? "0" + minutes : minutes;
          seconds = seconds < 10 ? "0" + seconds : seconds;
          return [hours, minutes, seconds].join(":");
        } catch (oError) {
          return ["00", "00", "00"].join(":");
        }
      },

      /**
       * @Description
       * Funcion que devuelve la fecha de un objeto
       *
       * @param  {Object} Date()
       * @return  {String} [day month year]
       * @example {
       *  var sDMY = fotmatter.getTimestampToDMY(new Date());
       *  //sDMY -> 28/09/2021
       * <Text text="{path: 'oData>property_Date', formatter: '.formatter.getTimestampToDMY'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getTimestampToDMY: function (oDate) {
        //Type="Edm.DateTime"
        if (oDate == undefined) {
          //d = new Date();
          return "";
        }
        let month = "" + (oDate.getUTCMonth() + 1),
          day = "" + oDate.getUTCDate(),
          year = oDate.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;
        return [day, month, year].join("/");
      },

      getTimestampToYMD: function (oDate) {
        //Type="Edm.DateTime"
        if (oDate == undefined) {
          //d = new Date();
          return "";
        }
        let month = "" + (oDate.getMonth() + 1),
          day = "" + oDate.getDate(),
          year = oDate.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;
        return [year, month, day].join("-");
      },

      /**
       * @Description
       * Funcion que devuelve la hora de un objeto
       *
       * @param  {Object} Date()
       * @return  {String} [hours minutes seconds]
       * @example {
       *  var sHMS = fotmatter.getTimestampToHMS(new Date());
       *  //sHMS -> 10:20:34
       *  <Text text="{path: 'oData>property_Date', formatter: '.formatter.getTimestampToHMS'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getTimestampToHMS: function (oDate) {
        //Type="Edm.DateTime"
        if (oDate == undefined) {
          //d = new Date();
          return "";
        }
        let hours =
            "" +
            (oDate.getUTCHours() < 5
              ? oDate.getUTCHours() + 19
              : oDate.getUTCHours() - 5),
          minutes = "" + oDate.getUTCMinutes(),
          seconds = oDate.getUTCSeconds(),
          milliseconds = oDate.getUTCMilliseconds();

        if (hours.length < 2) hours = "0" + hours;
        if (minutes.length < 2) minutes = "0" + minutes;
        if (seconds.length < 2) seconds = "0" + seconds;
        return [hours, minutes, seconds].join(":");
      },

      /**
       * @Description
       * Funcion que devuelve la fecha y hora de un objeto
       *
       * @param  {Object} Date()
       * @return  {String} [day month year hours minutes seconds]
       * @example {
       *  var sDMYHMS = fotmatter.getTimestampToDMYHMS(new Date());
       *  //sDMYHMS -> 28/09/2021 10:20:34
       *  <Text text="{path: 'oData>property_Date', formatter: '.formatter.getTimestampToDMYHMS'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getTimestampToDMYHMS: function (oDate) {
        //Type="Edm.DateTime"
        if (oDate == undefined) {
          //d = new Date();
          return "";
        }
        let month = "" + (oDate.getMonth() + 1),
          day = "" + oDate.getDate(),
          year = oDate.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        let hours = "" + oDate.getHours(),
          minutes = "" + oDate.getMinutes(),
          seconds = oDate.getSeconds(),
          milliseconds = oDate.getMilliseconds();

        if (hours.length < 2) hours = "0" + hours;
        if (minutes.length < 2) minutes = "0" + minutes;
        if (seconds.length < 2) seconds = "0" + seconds;

        var oDateTime = {
          date: [day, month, year].join("/"),
          time: [hours, minutes, seconds].join(":"),
        };

        return [oDateTime.date, oDateTime.time].join(" ");
      },
      getGenerateKey: function (oDate, sSeparate) {
        var sDate = getTimestampToDMYHMS(oDate);
        return sDate.replace(/[^a-zA-Z0-9]/g, sSeparate);
      },
      uuidv4: function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            var r = (Math.random() * 16) | 0,
              v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }
        );
      },

      /**
       * @Description
       * Funcion que devuelve la fecha y hora de un objeto
       *
       * @param  {Object} Date()
       * @return  {String} [day month year hours minutes seconds]
       * @example {
       *  var sTextMY = fotmatter.getTexMY(new Date());
       *  //sTextMY -> SEPTIEMBRE-2021
       *  <Text text="{path: 'oData>property_Date', formatter: '.formatter.getTexMY'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getTexMY: function (oDate) {
        var meses = [
          "ENERO",
          "FEBRERO",
          "MARZO",
          "ABRIL",
          "MAYO",
          "JUNIO",
          "JULIO",
          "AGOSTO",
          "SEPTIEMBRE",
          "OCTUBRE",
          "NOVIEMBRE",
          "DICIEMBRE",
        ];
        if (oDate) {
          oDate.setDate(oDate.getDate() + 1);
          var sFormatDate = meses[oDate.getMonth()] + "-" + oDate.getFullYear();
          return sFormatDate;
        } else return "";
      },
      /**-----------------------------------------------*/
      /*                     STATUS
              /**-----------------------------------------------*/

      /**
       * @Description
       * Funcion que devuelve el texto status de un estado en especifico
       *
       * @param  {String} estado
       * @return  {String} status
       * @example {
       *  var sStatus = fotmatter.getStatusText("Activo");
       *  //sStatus -> Success
       *  <ObjectStatus state="{path:'oData>property_Status',formatter: '.formatter.getStatusText'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getStatusText: function (estado) {
        var t = estado;
        if (t == "Activo") {
          return "Success";
        } else if (t == "Inactivo") {
          return "Error";
        }
      },

      /**
       * @Description
       * Funcion que devuelve el texto icon de un estado en especifico
       *
       * @param  {String} estado
       * @return  {String} sap-icon
       * @example {
       *  var sIcon = fotmatter.getStatusTextIcon("Activo");
       *  //sIcon -> sap-icon://message-success
       *  <ObjectStatus icon="{path:'oData>property_Status', formatter: '.formatter.getStatusTextIcon'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getStatusTextIcon: function (estado) {
        var t = estado;
        if (t == "Activo") {
          return "sap-icon://message-success";
        } else if (t == "Inactivo") {
          return "sap-icon://message-error";
        }
      },

      /**
       * @Description
       * Funcion que devuelve el texto status de un estado booleano
       *
       * @param  {Boolean} bEstado
       * @return  {String} status
       * @example {
       *  var sStatus = fotmatter.getStatusText(true);
       *  //sStatus -> Success
       *  <ObjectStatus state="{path:'oData>property_Status',formatter: '.formatter.getStatusText'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getBStatusText: function (bEstado) {
        var t = bEstado;
        if (t) {
          return "Habilitado";
        } else {
          return "Deshabilitado";
        }
      },

      /**
       * @Description
       * Funcion que devuelve el texto status de un estado booleano
       *
       * @param  {Boolean} bEstado
       * @return  {String} status
       * @example {
       *  var sStatus = fotmatter.getStatusText(true);
       *  //sStatus -> Success
       *  <ObjectStatus state="{path:'oData>property_Status',formatter: '.formatter.getStatusText'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getBStatus: function (bEstado) {
        var t = bEstado;
        if (t) {
          return "Success";
        } else {
          return "Error";
        }
      },

      /**
       * @Description
       * Funcion que devuelve el texto icon de un estado booleano
       *
       * @param  {Boolean} estado
       * @return  {String} sap-icon
       * @example {
       *  var sIcon = fotmatter.getStatusTextIcon(true);
       *  //sIcon -> sap-icon://message-success
       *  <ObjectStatus icon="{path:'oData>property_Status', formatter: '.formatter.getStatusTextIcon'}" ... />
       * }
       * @History
       * v1.0 – Version inicial
       *
       */
      getBStatusTextIcon: function (bEstado) {
        var t = bEstado;
        if (t) {
          return "sap-icon://message-success";
        } else {
          return "sap-icon://message-error";
        }
      },
      getDateFormatSap: function (sDate) {
        var day = "";
        var month = "";
        var year = "";
        var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
          pattern: "yyyy-MM-ddTHH:mm:ss",
        });
        var aDate = sDate.split("/");
        if (aDate.length < 3) aDate = sDate.split("-");
        if (aDate.length < 3) {
          year = sDate.substr(0, 4);
          month = sDate.substr(4, 2);
          day = sDate.substr(6, 2);
        } else {
          day = aDate[2].length == 4 ? aDate[0] : aDate[2];
          month = aDate[1];
          year = aDate[2].length == 4 ? aDate[2] : aDate[0];
        }
        var dateFormat = [year, month, day].join("/");
        return oDateFormat.format(new Date(dateFormat));
      },
      orderStatusColor: function (sStatus) {
        let sValue;
        switch (sStatus) {
          case "Liberados":
            //Amarillo - 3
            sValue = "Indication03";
            break;
          default:
            //Rojo - 2
            sValue = "Indication02";
            break;
        }
        return sValue;
      },
      orderStatusIcon: function (sStatus) {
        let sValue;
        switch (sStatus) {
          case "Liberados":
            sValue = "sap-icon://status-in-process";
            break;
          default:
            sValue = "sap-icon://status-error";
            break;
        }
        return sValue;
      },
      setVisibleProgramado: function (sStatus) {
        if (sStatus === "PRSA") {
          return true;
        } else {
          return false;
        }
      },
      setVisibleNoProgramado: function (sStatus) {
        if (sStatus === "APAR" || sStatus === "ATEN") {
          return true;
        } else {
          return false;
        }
      },
      setProgramadoEnSala: function (sStatus) {
        if (sStatus === "PRSA") {
          return "X";
        } else {
          return "";
        }
      },
      formatStatus: function (bStatus) {
        if (bStatus) {
          return "Activo";
        } else {
          return "Inactivo";
        }
      },
      formatDateToString: function (sDate) {
        if (sDate) {
          let sDay = sDate.getUTCDate(),
            sMonth = String(sDate.getUTCMonth() + 1),
            sYear = sDate.getUTCFullYear();

          switch (sMonth) {
            case "1":
              sMonth = "Enero";
              break;
            case "2":
              sMonth = "Febrero";
              break;
            case "3":
              sMonth = "Marzo";
              break;
            case "4":
              sMonth = "Abril";
              break;
            case "5":
              sMonth = "Mayo";
              break;
            case "6":
              sMonth = "Junio";
              break;
            case "7":
              sMonth = "Julio";
              break;
            case "8":
              sMonth = "Agosto";
              break;
            case "9":
              sMonth = "Septiembre";
              break;
            case "10":
              sMonth = "Octubre";
              break;
            case "11":
              sMonth = "Noviembre";
              break;
            case "12":
              sMonth = "Diciembre";
              break;
          }

          return sDay + " de " + sMonth + " del " + sYear;
        }
      },
      formatZDateToDate: function (zDate) {
          if(zDate){
            
            return new Date(zDate.split("T")[0]);
          }
      },
      normalizeString: function(sString){
        return sString.toLowerCase().split(" ").join("");
      },
      getUserName: function(sUserName, sUserLastNames){
        let iLong = 8, sUser;
        sUser = this.normalizeString(sUserName)[0] + this.normalizeString(sUserLastNames);

        if(sUser.length < 8){    
            sUser += "xxxxxxxxx";
            sUser = sUser.slice(0, iLong);
        }else{
            sUser = sUser.slice(0, iLong);
        }
        return String(sUser).toLowerCase();
      },
      dateToZDate: function(oDate){
        let sDay = String(oDate.getUTCDate()),
            sMonth = ("00" + String(oDate.getUTCMonth() + 1)).slice(-2),
            sYear = String(oDate.getUTCFullYear()),
            sHour = "00",
            sMinute = "00",
            sSecond = "00";

            return sYear + "-" + sMonth + "-" + sDay + "T" + sHour + ":" + sMinute + ":" + sSecond + "Z";
      }
    };
  }
);
