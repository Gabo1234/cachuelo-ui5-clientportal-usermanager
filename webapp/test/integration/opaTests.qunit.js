/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require(["clientportal/saasa/com/pe/usermanager/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
