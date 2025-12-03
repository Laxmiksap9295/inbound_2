var oThat;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/m/MessageToast",
	"sap/ui/model/FilterOperator"
], function (Controller, MessageBox, BusyDialog, JSONModel, Filter, MessageToast, FilterOperator) {
	"use strict";

	return Controller.extend("ZGT_MM_INBOUND.controller.Status_Update", {
		onInit: function () {
			oThat = this;
			oThat.BusyDialog = new BusyDialog();
			oThat.oView = this.getView();
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("Status").attachMatched(this._onRouteMatched, this);
		},
		//======================================================================================//
		//========================= Router matched handler function ===========================//
		//====================================================================================//
		_onRouteMatched: function (oEvent) {
			oThat.BusyDialog = new BusyDialog();
			oThat = this;
			oThat.oView = oThat.getView();
			oThat.Core = sap.ui.getCore();
			oThat.oModel = oThat.getOwnerComponent().getModel();
			oThat.oView.byId("id_InReason").setValue("");
			oThat.oView.byId("id_InVehicleNo").setValue("");
			oThat.oView.byId("id_InWbid").setValue("");
			oThat.oView.byId("id_InDate").setValue("");
			oThat.oView.byId("id_BtnSave").setVisible(false);
			oThat._getPlantData(); // added by srinivas on 11/11/2025
		},
		//====================================================================================//
		//==================== Call Service =================================================//
		//===================================================================================//
		onCallService: function (service, Data) {
			oThat.BusyDialog.open();
			if (oThat.Service === 'GET' || oThat.Service === 'CHECK') {
				oThat.oModel.create("/GetHeadersSet", Data, {
					success: oThat.mySuccessHandler,
					error: oThat.myErrorHandler
				});
			} else if (oThat.Service === 'SAVE') {
				oThat.oModel.create("/PostHeadersSet", Data, {
					success: oThat.mySuccessHandler,
					error: oThat.myErrorHandler
				});
			}
		},
		mySuccessHandler: function (oData, oResponse) {
			oThat.BusyDialog.close();
			if (oThat.Service === 'GET') {
				oThat.oView.setModel(new JSONModel(oData), "oStatusModel");
				oThat.oView.getModel("oStatusModel").refresh(true);
				// if(oData.StatusUpdateNav != null){
				if (oData.StatusUpdateNav.results.length != 0) {
					oThat.VehicleNo = sap.ui.xmlfragment("ZGT_MM_INBOUND.Fragments.VehicleNo", oThat);
					oThat.oView.addDependent(oThat.VehicleNo);
					oThat.VehicleNo.open();
				} else {
					oThat.oView.byId("id_InReason").setValue("");
					oThat.oView.byId("id_InVehicleNo").setValue("");
					oThat.oView.byId("id_InWbid").setValue("");
					MessageToast.show(oThat.oView.getModel("i18n").getResourceBundle().getText("ErrorMSg16"));
				}
				// }
			} else if (oThat.Service === 'CHECK') {
				// if(oData.GetReturnNav != null){
				if (oData.GetReturnNav.results.length != 0) {
					var aError = oData.GetReturnNav.results.filter(function (x) {
						if (x.Type == 'E') {
							return x;
						}
					});
					var msg = "";
					if (aError != 0) {
						for (var i = 0; i < aError.length; i++) {
							msg = msg + "\n" + aError[i].Message;
						}
						MessageBox.error(msg);
					}

				}
				// }
				else {
					oThat.oView.byId("id_BtnSave").setVisible(true);
				}
			} else if (oThat.Service === 'SAVE') {
				// if(oData.GetReturnNav != null){
				if (oData.PostReturnNav.results.length != 0) {
					var aError = oData.PostReturnNav.results.filter(function (x) {
						if (x.Type == 'E') {
							return x;
						}
					});
					if (aError != 0) {
						MessageBox.error(aError[0].Message);
					}
					var aSuccess = oData.PostReturnNav.results.filter(function (x) {
						if (x.Type == 'S') {
							return x;
						}
					});
					if (aSuccess != 0) {
						MessageBox.success(aSuccess[0].Message);
						oThat.oView.byId("id_BtnSave").setVisible(false);
						oThat.oView.byId("id_InReason").setValue("");
						oThat.oView.byId("id_InVehicleNo").setValue("");
						oThat.oView.byId("id_InWbid").setValue("");
						oThat.oView.byId("id_InDate").setValue("");
					}
				}
				// }
				else {
					oThat.oView.byId("id_BtnSave").setVisible(false);
					oThat.oView.byId("id_InReason").setValue("");
					oThat.oView.byId("id_InVehicleNo").setValue("");
					oThat.oView.byId("id_InWbid").setValue("");
					oThat.oView.byId("id_InDate").setValue("");
				}
			}
		},
		myErrorHandler: function (oResponse) {
			oThat.BusyDialog.close();
			var vError = oThat.oView.getModel("i18n").getResourceBundle().getText("Title21");
			MessageBox.show(oResponse.responseText, MessageBox.Icon.ERROR, vError);
		},
		onDateChange: function () {
			oThat.onValueHelpPress();
		},
		// added by srinivas for Plant on 11/11/2025
		// onValueHelpPlant: function(oEvent) {

		// },
		onValueHelpPlantF4: function (oEvent) {
			oThat.vId = oEvent.getSource().getId();
			oEvent.getSource().setValueState('None');
			var oInputModel = this.getView().getModel("PlantF4");
			if (!oInputModel) {
				MessageToast.show("No plant data available");
				return;
			}
			// if (oThat.ValueHelp) {
			//     oThat.ValueHelp.destroy();
			//     oThat.ValueHelp = null;
			// }
			if (!oThat.ValueHelpPlant) {
				oThat.ValueHelpPlant = sap.ui.xmlfragment("ZGT_MM_INBOUND.Fragments.Plant", this);
				oThat.getView().setModel(oInputModel, "F4Model");
				oThat.getView().addDependent(oThat.ValueHelpPlant);
			}
			oThat.ValueHelpPlant.open();
		},

		onValueHelpConfirmPlant: function (oEvent) {
			var oSelectedItem = oEvent.getParameter('selectedItem');
			if (oSelectedItem) {
				var sPlant = oSelectedItem.getDescription();
				var oInput = sap.ui.getCore().byId(oThat.vId);
				oInput.setValue(sPlant);
			}
			// oThat.ValueHelp.close();
			//oThat.ValueHelp.destroy();
			if (oThat.ValueHelpPlant) {
				oThat.ValueHelpPlant.destroy();
				oThat.ValueHelpPlant = null;
			}
		},

	
		// get Plant data
		onValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oBinding = oEvent.getSource().getBinding("items");
			if (!oBinding) return;
			var sPath = oBinding.getPath();
			var oFilter;
			if (sPath.includes("F4PlantNav")) {
				oFilter = new Filter([
					new Filter("Werks", FilterOperator.Contains, sValue),
					new Filter("Name1", FilterOperator.Contains, sValue)
				], false);
			} else  {
				// 🚗 Status F4
				oFilter = new Filter([
					new Filter("Vehno", FilterOperator.Contains, sValue),
					new Filter("Wbid", FilterOperator.Contains, sValue)
				], false);
			}
			oBinding.filter(oFilter ? [oFilter] : []);
		},

		
		_getPlantData: function () {
			var oThat = this;
			return new Promise(function (resolve, reject) {
				var oModel = oThat.getView().getModel();
				var aFilters = [
					new Filter("ProcessType", FilterOperator.EQ, "X"),
					new Filter("Plant", FilterOperator.EQ, "X"),
					new Filter("Vehtype", FilterOperator.EQ, "X")
				];
				oThat.BusyDialog.open();
				oModel.read("/F4ParametersSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "F4DirectionNav,F4ProcessNav,F4PlantNav,F4TransporterNav,F4VehTypeNav"
					},
					success: function (oData) {
						oThat.BusyDialog.close();
						resolve(oData);

						// 🔍 Extract Plant values
						var aPlants = oData?.results?.[0]?.F4PlantNav?.results || [];
						var oPlantModel = new sap.ui.model.json.JSONModel(oData);
						oThat.getView().setModel(oPlantModel, "PlantF4");

						// ✅ If only one Plant, auto populate it
						if (aPlants.length === 1) {
							var sPlant = aPlants[0].Plant || aPlants[0].PlantCode || "";
							if (sPlant) {
								var oPlantField = oThat.getView().byId("id_InPlant");
								if (oPlantField) {
									oPlantField.setValue(sPlant);
								}
							}
						} else {
							// ⚠️ More than one → keep field empty for F4 selection
							var oPlantField = oThat.getView().byId("id_InPlant");
							if (oPlantField) {
								oPlantField.setValue("");
							}
						}
					},
					error: function (err) {
						oThat.BusyDialog.close();
						reject(err);
					}
				});
			});
		},




		// ended
		onValueHelpPress: function (oEvent) {
			var vDate = oThat.oView.byId("id_InDate").getValue();
			var oPlant = oThat.oView.byId("id_InPlant").getValue();// added plant by srinivas on 11/11/2025
			if(!oPlant){
				return;
			}
			if (vDate !== null && vDate !== "") {
				var vDate = oThat.oView.byId("id_InDate").getDateValue();
				var vDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "yyyy-MM-ddT00:00:00"
				});
				var vInDate = vDateFormat.format(vDate);
				oThat.Service = 'GET';
				var oEntity = {
					"d": {
						"GateEntry": "",
						"VehAssign": "",
						"PreQual": "",
						"UnloadConf": "",
						"GateExit": "",
						"Inbound": "X",
						"Outbound": "",
						"IvDelivery": "",
						"IvPo": "",
						"IvWbid": "",
						"IvWerks": oPlant,
						"StatusUpdate": "X",
						"Approval": "",
						"GetReturnNav": [],
						"PoItemNav": [],
						"QualWbidNav": [],
						"WbItemNav": [],
						"WsItemNav": [],
						"WbHeaderNav": [],
						"StatusUpdateNav": [{
							"InDate": vInDate
						}]
					}
				};
				oThat.onCallService(oThat.Service, oEntity);
			} else {
				MessageBox.error(oThat.oView.getModel("i18n").getResourceBundle().getText("ErrorMsg6"));
			}
		},
		// onValueHelpSearch: function (oEvent) {
		// 	var sValue = oEvent.getParameter("value");
		// 	var oFilter;
		// 	oFilter = new sap.ui.model.Filter([
		// 		new Filter("Vehno", sap.ui.model.FilterOperator.Contains, sValue),
		// 		new Filter("Wbid", sap.ui.model.FilterOperator.Contains, sValue)
		// 	]);
		// 	var oFilter2 = new sap.ui.model.Filter(oFilter, false);
		// 	var oBinding = oEvent.getSource().getBinding("items");
		// 	oBinding.filter([oFilter2]);
		// },
		onValueHelpConfirm: function (oEvent) {
			var oSelectedItem = oEvent.getParameter('selectedItem');
			oThat.oView.byId("id_InVehicleNo").setValue(oSelectedItem.getTitle());
			oThat.oView.byId("id_InWbid").setValue(oSelectedItem.getDescription());
		},
		//============================= Check =============================================//
		onPressCheck: function (oEvent) {
			if (
				oThat.oView.byId("id_InVehicleNo").getValue() === "" ||
				oThat.oView.byId("id_InWbid").getValue() === "" ||
				oThat.oView.byId("id_InDate").getValue() === "" || oThat.oView.byId("id_InPlant").getValue() ==="" ||
				oThat.oView.byId("id_InDate").getValue() == null) {
				MessageBox.error(oThat.oView.getModel("i18n").getResourceBundle().getText("ErrorMsg7"));
			} else {
				var vDate = oThat.oView.byId("id_InDate").getDateValue();
				var vDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "yyyy-MM-ddT00:00:00"
				});
				var vInDate = vDateFormat.format(vDate);
				var oPlant = oThat.oView.byId("id_InPlant").getValue();// added by sinivas
				oThat.Service = 'CHECK';
				var oEntity = {
					"d": {
						"GateEntry": "",
						"VehAssign": "",
						"PreQual": "",
						"UnloadConf": "",
						"GateExit": "",
						"Inbound": "X",
						"Outbound": "",
						"IvDelivery": "",
						"IvPo": "",
						"IvWbid": oThat.oView.byId("id_InWbid").getValue(),
						"IvWerks": oPlant,
						"StatusUpdate": "X",
						"Approval": "",
						"GetReturnNav": [],
						"PoItemNav": [],
						"QualWbidNav": [],
						"WbItemNav": [],
						"WsItemNav": [],
						"WbHeaderNav": [],
						"StatusUpdateNav": [{
							"InDate": vInDate,
							"Vehno": oThat.oView.byId("id_InVehicleNo").getValue(),
							"Wbid": oThat.oView.byId("id_InWbid").getValue(),
							"Reason": oThat.oView.byId("id_InReason").getValue()
						}]
					}
				};
				oThat.onCallService(oThat.Service, oEntity);
			}
		},
		//====================================== on click Save ============================//
		onStatusSubmit: function (oEvent) {
			if (oThat.oView.byId("id_InReason").getValue() === "" ||
				oThat.oView.byId("id_InVehicleNo").getValue() === "" ||
				oThat.oView.byId("id_InWbid").getValue() === "" ||
				oThat.oView.byId("id_InDate").getValue() === "" ||
				oThat.oView.byId("id_InDate").getValue() == null) {
				MessageBox.error(oThat.oView.getModel("i18n").getResourceBundle().getText("ErrorMsg11"));
			} else {
				var vDate = oThat.oView.byId("id_InDate").getDateValue();
				var vDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "yyyy-MM-ddT00:00:00"
				});
				var vInDate = vDateFormat.format(vDate);
				oThat.Service = 'SAVE';
				var oEntity = {
					"d": {
						"GateEntry": "",
						"VehAssign": "",
						"PreQual": "",
						"UnloadConf": "",
						"GateExit": "",
						"Inbound": "X",
						"StatusUpdate": "X",
						"IvWboj": oThat.EvWtype,
						"Outbound": "",
						"PostReturnNav": [],
						"PostWbHeaderNav": [],
						"PostWbitemNav": [],
						"PostWsItemNav": [],
						"PostDmsNav": []
					}
				};
				var oObject = {
					"Vehno": oThat.oView.byId("id_InVehicleNo").getValue(),
					"Wbid": oThat.oView.byId("id_InWbid").getValue(),
					"Erdat": vInDate,
					"Ertim": "PT00H00M00S",
					"Tmode": 'MOBILITY',
					"Direction": "IN",
					"Del": "X",
					"Reason": oThat.oView.byId("id_InReason").getValue()
				};
				oEntity.d.PostWbHeaderNav.push(oObject);
				oThat.onCallService(oThat.Service, oEntity);
			}
		},
		//=================================================================================//
		//====================== Nav back =================================================//
		//=================================================================================//
		onNavBack: function () {
			this.oRouter.navTo("Inbound");
		}

	});

});