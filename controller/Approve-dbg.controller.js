var oThat;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
], function (Controller, MessageBox, BusyDialog, JSONModel, Filter, FilterOperator, Fragment, MessageToast) {
	"use strict";

	return Controller.extend("ZGT_MM_INBOUND.controller.Approve", {
		onInit: function () {
			oThat = this;
			oThat.BusyDialog = new BusyDialog();
			oThat.oView = this.getView();
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("Approve").attachMatched(this._onRouteMatched, this);
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
			// oThat.Service = 'GET';
			// var oEntity = {
			// 	"d": {
			// 		"GateEntry": "",
			// 		"VehAssign": "",
			// 		"PreQual": "",
			// 		"UnloadConf": "",
			// 		"GateExit": "",
			// 		"Inbound": "X",
			// 		"Outbound": "",
			// 		"IvDelivery": "",
			// 		"IvPo": "",
			// 		"IvWbid": "",
			// 		"IvWerks": "",
			// 		"StatusUpdate": "",
			// 		"Approval": "X",
			// 		"GetReturnNav": [],
			// 		"PoItemNav": [],
			// 		"QualWbidNav": [],
			// 		"WbItemNav": [],
			// 		"WsItemNav": [],
			// 		"WbHeaderNav": [],
			// 		"StatusUpdateNav": [],
			// 		"ApprovalNav": []
			// 	}
			// };
			// oThat.onCallService(oThat.Service, oEntity);

			//Added by srinivas on 11/11/2025
			var oInput = oThat.oView.byId("idPlantInputF4");
			if (oInput) { // ✅ check if fragment/input is already loaded
				oInput.setValue("");
			}
			this._openPlantFragment();
			this._fetchPlantDataAndAutoSelect();
			//ended
		},
		//====================================================================================//
		//==================== Call Service =================================================//
		//===================================================================================//
		onCallService: function (service, Data) {
			oThat.BusyDialog.open();
			if (oThat.Service === 'GET') {
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
				oThat.oView.setModel(new JSONModel(oData), "oApproveModel");
				oThat.oView.getModel("oApproveModel").refresh(true);
			} else if (oThat.Service === 'SAVE') {
				oThat.Approve.destroy();
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
						"IvWerks": "",
						"StatusUpdate": "",
						"Approval": "X",
						"GetReturnNav": [],
						"PoItemNav": [],
						"QualWbidNav": [],
						"WbItemNav": [],
						"WsItemNav": [],
						"WbHeaderNav": [],
						"StatusUpdateNav": [],
						"ApprovalNav": []
					}
				};
				oThat.onCallService(oThat.Service, oEntity);
			}
		},
		myErrorHandler: function (oResponse) {
			oThat.BusyDialog.close();
			var vError = oThat.oView.getModel("i18n").getResourceBundle().getText("Title21");
			MessageBox.show(oResponse.responseText, MessageBox.Icon.ERROR, vError);
		},
		onPressListItem: function (oEvent) {
			var vPath = oEvent.getSource().getBindingContextPath();
			var oBject = oThat.oView.getModel("oApproveModel").getObject(vPath);
			oThat.oView.setModel(new JSONModel(oBject), "Approve");
			oThat.oView.getModel("Approve").refresh(true);
			oThat.Approve = sap.ui.xmlfragment("ZGT_MM_INBOUND.Fragments.Approve", oThat);
			oThat.oView.addDependent(oThat.Approve);
			oThat.Approve.setEscapeHandler(oThat.onEscapeApprove);
			oThat.Approve.open();

		},
		fnApproveReject: function (oEvent) {
			oThat.vId = oEvent.getSource().getId();
			var vApprovReject = "";
			if (oThat.vId.indexOf("id_BtnApprove") != -1) {
				vApprovReject = "A";
			} else if (oThat.vId.indexOf("id_BtnReject") != -1) {
				vApprovReject = "R";
				if (oThat.oView.getModel("Approve").getData().Reason == "") {
					MessageBox.error(oThat.oView.getModel("i18n").getResourceBundle().getText("ErrorMsg9"));
					return;
				}
			}
			var oEntity = {
				"d": {
					"GateEntry": "",
					"VehAssign": "",
					"PreQual": "",
					"UnloadConf": "",
					"GateExit": "",
					"Inbound": "X",
					"Approval": "X",
					"IvAction": vApprovReject,
					"IvWboj": oThat.EvWtype,
					"IvWbid": oThat.oView.getModel("Approve").getData().Wbid,
					"Outbound": "",
					"PostReturnNav": [],
					"PostWbHeaderNav": [{
						"Reason": oThat.oView.getModel("Approve").getData().Reason
					}],
					"PostWbitemNav": [],
					"PostWsItemNav": [],
					"PostDmsNav": []
				}
			};
			oThat.Service = "SAVE";
			oThat.onCallService(oThat.Service, oEntity);

		},
		onClickBack: function () {
			oThat.Approve.destroy();
		},
		//================================== Escape Handler ===================================//
		onEscapeApprove: function () {
			oThat.Approve.destroy();
		},
		//=================================================================================//
		//====================== Nav back =================================================//
		//=================================================================================//
		onNavBack: function () {
			this.oRouter.navTo("Inbound");
		},

		// added by srinivas on 11/10/2025 for Plant Popup
		_fetchPlantDataAndAutoSelect: function () {
			this._getPlantData()
				.then(function (aPlants) {
					if (aPlants?.results?.[0]?.F4PlantNav?.results?.length === 1) {
						this._handlePlantSelection(aPlants.results[0].F4PlantNav.results[0].Werks);
						this._closePlantFragment();
					} else {
						this._setPlantModelToFragment(aPlants);
					}
				}.bind(this))
				.catch(function (err) {
					MessageToast.show("Error fetching plants: " + err);
				});
		},

		_getPlantData: function () {
			var oThat = this;
			return new Promise(function (resolve, reject) {
				//  var oModel = oThat.getView().getModel();
				var aFilters = [
					new Filter("ProcessType", FilterOperator.EQ, "X"),
					new Filter("Plant", FilterOperator.EQ, "X"),
					new Filter("Vehtype", FilterOperator.EQ, "X")
				];
				oThat.BusyDialog.open();

				oThat.oModel.read("/F4ParametersSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "F4DirectionNav,F4ProcessNav,F4PlantNav,F4TransporterNav,F4VehTypeNav"
					},
					success: function (oData) {
						oThat.BusyDialog.close();
						resolve(oData);
					},
					error: function (err) {
						oThat.BusyDialog.close();
						reject(err);
					}
				});
			});
		},

		_openPlantFragment: function () {
			if (!this._pPlantFragment) {
				this._pPlantFragment = Fragment.load({
					id: this.getView().getId(),
					name: "ZGT_MM_INBOUND.Fragments.PlantSelection",
					controller: this
				}).then(function (oFragment) {
					this.getView().addDependent(oFragment);
					oFragment.open();
					return oFragment;
				}.bind(this));
			} else {
				this._pPlantFragment.then(function (oFragment) {
					oFragment.open();
				});
			}
		},

		_setPlantModelToFragment: function (aPlants) {
			var oPlantModel = new JSONModel(aPlants);
			this.getView().setModel(oPlantModel, "PlantF4");
		},

		onSelectPlantF4: function () {
			var oInput = this.byId("idPlantInputF4");
			var sSelectedPlant = oInput.getValue();
			if (!sSelectedPlant) {
				MessageToast.show("Please select a plant");
				return;
			}

			this._handlePlantSelection(sSelectedPlant);
			this._closePlantFragment();
		},

		_handlePlantSelection: function (sPlant) {
			var oInput = this.byId("idPlantInputF4");
			oInput && oInput.setValue(sPlant);
			// Initial load of first phase
			this._loadApprovallData(sPlant);
			//  this._startAutoRefresh(sPlant);
		},

		_closePlantFragment: function () {
			this._pPlantFragment && this._pPlantFragment.then(function (oFragment) {
				oFragment.close();
			});
		},

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
			if (!oThat.ValueHelp) {
				oThat.ValueHelp = sap.ui.xmlfragment("ZGT_MM_INBOUND.Fragments.Plant", this);
				oThat.getView().setModel(oInputModel, "F4Model");
				oThat.getView().addDependent(oThat.ValueHelp);
			}
			oThat.ValueHelp.open();
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
			if (oThat.ValueHelp) {
				oThat.ValueHelp.destroy();
				oThat.ValueHelp = null;
			}
		},

		onValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter([
				new Filter("Werks", FilterOperator.Contains, sValue),
				new Filter("Name1", FilterOperator.Contains, sValue)
			]);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},

		_loadApprovallData: function (sPlant) {
			// var oModel = this.getOwnerComponent().getModel();
			// var aFilters = [
			//     new Filter("Check", FilterOperator.EQ, "X"),
			//     new Filter("Werks", FilterOperator.EQ, sPlant),
			// ];
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
					"IvWerks": sPlant,
					"StatusUpdate": "",
					"Approval": "X",
					"GetReturnNav": [],
					"PoItemNav": [],
					"QualWbidNav": [],
					"WbItemNav": [],
					"WsItemNav": [],
					"WbHeaderNav": [],
					"StatusUpdateNav": [],
					"ApprovalNav": []
				}
			};
			oThat.onCallService(oThat.Service, oEntity);
		},

		fnSearchRefId: function (oEvent) {
			var vValue = oEvent.getSource().getValue();
			var list = this.getView().byId("vech_ass");
			if (vValue && vValue.length > 0) {
				var oFilter = new sap.ui.model.Filter("Wbid", sap.ui.model.FilterOperator.Contains, vValue);
				var oFilter2 = new sap.ui.model.Filter("Vehno", sap.ui.model.FilterOperator.Contains, vValue);
				var aFilters = new sap.ui.model.Filter([oFilter, oFilter2]);
			}
			var binding = list.getBinding("items");
			binding.filter(aFilters);
		},

		//  onClosePlantF4 : function(){
        //     this._closePlantFragment();
        // },
		//ended

	});

});