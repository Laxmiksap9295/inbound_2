var oThat;
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
], function (Controller, JSONModel, MessageBox, Filter, FilterOperator, BusyDialog, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("ZGT_MM_INBOUND.controller.Operational_Tat", {
        onInit: function () {
            oThat = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getRoute("OperationalTat").attachMatched(this._onRouteMatched, this);

            // Single instance of BusyDialog
            this.BusyDialog = new BusyDialog();

            // Initialize table visibility model
            var oVisibilityModel = new JSONModel({
                TruckInVisible: true,
                PreQualVisible: true,
                UnloadingVisible: false,
                PreQualExpVisible: false,
                LoadingVisible: false,
                TruckOutVisible: false,
            });
            this.getView().setModel(oVisibilityModel, "TableVisibility");
            this.oRouter.attachRouteMatched((oEvent) => { // 👈 arrow function binds 'this' correctly
                const sRouteName = oEvent.getParameter("name");
                if (sRouteName !== "OperationalTat") {
                    if (this._refreshInterval) {
                        clearInterval(this._refreshInterval);
                        this._refreshInterval = null;
                    }
                }
            });
        },

        _onRouteMatched: function (oEvent) {
            var oView = this.getView();
            oView._bInitialClearDone = false;
            var oInput = oView.byId("idPlantInputF4");
            if (oInput) { // ✅ check if fragment/input is already loaded
                oInput.setValue("");
            }
            // Open plant fragment immediately
            this._openPlantFragment();
            this._fetchPlantDataAndAutoSelect();
        },

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
            this._loadOperationalData(sPlant, ["TruckIn", "PreQual"]);
            this._startAutoRefresh(sPlant);
        },

        _closePlantFragment: function () {
            this._pPlantFragment && this._pPlantFragment.then(function (oFragment) {
                oFragment.close();
            });
        },

        // onClosePlantF4 : function(){
        //     this._closePlantFragment();
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

        _startAutoRefresh: function (sPlant) {
            var oThat = this;
            // Define refresh phases
            var aPhases = [{
                    filters: ["TruckIn", "PreQual"],
                    visibleProps: ["TruckInVisible", "PreQualVisible"]
                },
                {
                    filters: ["Unloading", "PreQualExp"],
                    visibleProps: ["UnloadingVisible", "PreQualExpVisible"]
                },
                {
                    filters: ["Loading", "TruckOut"],
                    visibleProps: ["LoadingVisible", "TruckOutVisible"]
                }
            ];

            var iCurrentPhase = 0;
            var oVisibilityModel = this.getView().getModel("TableVisibility");

            function refreshPhase() {
                var oPhase = aPhases[iCurrentPhase];
                // Reset all visibility to false
                Object.keys(oVisibilityModel.getData()).forEach(function (key) {
                    oVisibilityModel.setProperty("/" + key, false);
                });
                // Set visible tables for current phase
                oPhase.visibleProps.forEach(function (prop) {
                    oVisibilityModel.setProperty("/" + prop, true);
                });
                // Load data for visible tables
                oThat._loadOperationalData(sPlant, oPhase.filters)
                    .finally(function () {
                        iCurrentPhase = (iCurrentPhase + 1) % aPhases.length;
                    });
                MessageToast.show("Refreshing: " + oPhase.filters.join(" & "));
            }

            // Immediate first load
            refreshPhase();

            // Every 30 seconds
            if (oThat._refreshInterval) clearInterval(oThat._refreshInterval);
            oThat._refreshInterval = setInterval(refreshPhase, 45000);
        },

        _loadOperationalData: function (sPlant, aActiveFilters) {
            var oModel = this.getOwnerComponent().getModel();
            var aFilters = [
                new Filter("Check", FilterOperator.EQ, "X"),
                new Filter("Werks", FilterOperator.EQ, sPlant),
            ];
            if (Array.isArray(aActiveFilters)) {
                aActiveFilters.forEach(function (sField) {
                    aFilters.push(new Filter(sField, FilterOperator.EQ, "X"));
                });
            }
            // Open BusyDialog
            if (!oThat.BusyDialog) oThat.BusyDialog = new BusyDialog();
            oThat.BusyDialog.open();
            return new Promise(function (resolve) {
                oModel.read("/GetOppTatSet", {
                    filters: aFilters,
                    urlParameters: {
                        "$expand": "GateEntryNav,LoadingNav,PreQualityExcepNav,TruckOutNav,PreQualityNav,UnloadingNav"
                    },
                    success: function (oData) {
                        oThat.BusyDialog.close();
                        if (oData.results && oData.results.length > 0) {
                            var oResult = oData.results[0];
                            var oJsonModel = new JSONModel({
                                GateEntry: oResult.GateEntryNav.results || [],
                                Loading: oResult.LoadingNav.results || [],
                                PreQualityExcep: oResult.PreQualityExcepNav.results || [],
                                TruckOut: oResult.TruckOutNav.results || [],
                                PreQuality: oResult.PreQualityNav.results || [],
                                Unloading: oResult.UnloadingNav.results || [],
                                TotalTruck: oResult.TotalTruck || 0,
                                TruckToday: oResult.TruckToday || 0,
                                Flags: {
                                    View: oResult.View,
                                    Edit: oResult.Edit
                                },
                                // Calculated counts for headers
                                // GateEntryCount: (oResult.GateEntryNav.results || []).length,
                                // PreQualityCount: (oResult.PreQualityNav.results || []).length,
                                // PreQualityExcepCount: (oResult.PreQualityExcepNav.results || []).length,
                                // UnloadingCount: (oResult.UnloadingNav.results || []).length,
                                // LoadingCount: (oResult.LoadingNav.results || []).length,
                                // TruckOutCount: (oResult.TruckOutNav.results || []).length
                                GateEntryCount: (oResult.GateEntryNav?.results?.[0]?.Count || 0),
                                PreQualityCount: (oResult.PreQualityNav?.results?.[0]?.Count || 0),
                                PreQualityExcepCount: (oResult.PreQualityExcepNav?.results?.[0]?.Count || 0),
                                UnloadingCount: (oResult.UnloadingNav?.results?.[0]?.Count || 0),
                                LoadingCount: (oResult.LoadingNav?.results?.[0]?.Count || 0),
                                TruckOutCount: (oResult.TruckOutNav?.results?.[0]?.Count || 0),

                            });
                            // **Set sizeLimit for model
                            var maxLength = Math.max(
                                oResult.GateEntryNav?.results?.length || 0,
                                oResult.LoadingNav?.results?.length || 0,
                                oResult.PreQualityExcepNav?.results?.length || 0,
                                oResult.TruckOutNav?.results?.length || 0,
                                oResult.PreQualityNav?.results?.length || 0,
                                oResult.UnloadingNav?.results?.length || 0
                            );
                            oJsonModel.setSizeLimit(maxLength);
                            oThat.getView().setModel(oJsonModel, "OperationalTATModel");
                        }
                        resolve();
                    },
                    error: function (oError) {
                        oThat.BusyDialog.close();
                        MessageBox.error(oError.responseText);
                        resolve();
                    }
                });
            });
        },

        onNavBack: function () {
            oThat.oRouter.navTo("Inbound");
        },

        onExit: function () {
            if (this._refreshInterval) {
                clearInterval(this._refreshInterval);
                this._refreshInterval = null;
            }
        },

    });
});