var oThat;
var sCurrentDirection = "IN"; // Default direction
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageToast",
], function (Controller, JSONModel, MessageBox, Filter, FilterOperator, BusyDialog, MessageToast) {
    "use strict";

    return Controller.extend("ZGT_MM_INBOUND.controller.Truck_Queue", {
        onInit: function () {
            // truck queue was new dev by srinivas on 27/09/2025 

            oThat = this;
            // oThat.BusyDialog = new BusyDialog();
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getRoute("TruckQueue").attachMatched(this._onRouteMatched, this);

            //  Stop auto refresh when navigating away from TruckQueue
            // this.oRouter.attachRouteMatched(function (oEvent) {
            //     var sRouteName = oEvent.getParameter("name");
            //     if (sRouteName !== "TruckQueue") {
            //         oThat._stopAutoRefresh();
            //         console.log("⏹️ Auto refresh stopped due to route change:", sRouteName);
            //     }
            // });

            //Stop auto refresh when navigating away from TruckQueue
            this.oRouter.attachRouteMatched((oEvent) => { // 👈 arrow function binds 'this' correctly
                const sRouteName = oEvent.getParameter("name");
                if (sRouteName !== "TruckQueue") {
                    this._stopAutoRefresh(); // ✅ now safely refers to your controller
                    console.log("⏹️ Auto refresh stopped due to route change:", sRouteName);
                }
            });

        },


        // _onRouteMatched: function (oEvent) {
        //     oThat = this;
        //     //oThat.BusyDialog = new BusyDialog();
        //     oThat._loadTruckData();
        //     // autorefresh for every 15 seconds 
        //        // 🔄 Auto-refresh every 15 seconds (alternate IN/OUT)
        //     if (oThat._refreshInterval) {
        //         clearInterval(oThat._refreshInterval);
        //     }

        //     oThat._refreshInterval = setInterval(function () {
        //         sCurrentDirection = sCurrentDirection === "IN" ? "OUT" : "IN";
        //         console.log("Refreshing Truck Data for Direction:", sCurrentDirection);
        //          MessageToast.show("Refreshing Truck Data for Direction : "  + sCurrentDirection);
        //         oThat._loadTruckData();
        //     }, 15000); // 15 seconds
        // },


        _onRouteMatched: function (oEvent) {
            var oThat = this;
            var oView = this.getView();
            var oTimerLabel = oView.byId("idRefreshTimer");
            var refreshInterval = 60; // seconds

            // initial load
            oThat._loadTruckData();

            // clear existing timers
            if (this._refreshInterval) clearInterval(this._refreshInterval);
            if (this._countdownInterval) clearInterval(this._countdownInterval);

            // set default direction if not defined
            if (typeof sCurrentDirection === "undefined") {
                sCurrentDirection = "IN";
            }

            // 🔁 Auto-refresh every 15s, alternate direction
            this._refreshInterval = setInterval(function () {
                sCurrentDirection = sCurrentDirection === "IN" ? "OUT" : "IN";
                console.log("Refreshing Truck Data for Direction:", sCurrentDirection);
                MessageToast.show("Refreshing Truck Data for Direction: " + sCurrentDirection);

                oThat._loadTruckData();
                refreshInterval = 60; // reset countdown
            }, 60000);

            // ⏱ Update countdown every 1s
            this._countdownInterval = setInterval(function () {
                if (refreshInterval > 0) {
                    oTimerLabel.setText("Refreshing in " + refreshInterval + "s (" + sCurrentDirection + ")");
                    refreshInterval--;
                }
            }, 1000);
        },

        _stopAutoRefresh: function () {
            if (this._refreshInterval) {
                clearInterval(this._refreshInterval);
                this._refreshInterval = null;
            }
            if (this._countdownInterval) {
                clearInterval(this._countdownInterval);
                this._countdownInterval = null;
            }
            console.log("⏹️ Auto-refresh stopped.");
        },

        onExit: function () {
            this._stopAutoRefresh();
        },
        onBeforeRendering: function () {
            this._stopAutoRefresh(); // optional safety
        },

        onNavBack: function () {
            // oThat._stopAutoRefresh();  //  stop the timers first
            this._stopAutoRefresh();
            oThat.oRouter.navTo("Inbound");
        },

        _loadTruckData: function () {
            var oModel = this.getOwnerComponent().getModel();

            var aFilters = [
                new Filter("Check", FilterOperator.EQ, "X"),
                new Filter("Direction", FilterOperator.EQ, sCurrentDirection)
            ];
            oThat.BusyDialog = new BusyDialog();
            oThat.BusyDialog.open();
            oModel.read("/GetTruckSet", {
                filters: aFilters,
                urlParameters: {
                    "$expand": "InboundNav,OutBoundNav,ReturnNav"
                },
                success: function (oData) {
                    // console.log("OData Success:", oData);
                    oThat.BusyDialog.close();
                    if (oData.results && oData.results.length > 0) {
                        var oResult = oData.results[0]; // take first entry

                        var oJsonModel = new JSONModel({
                            Inbound: oResult.InboundNav.results || [], // IN
                            Outbound: oResult.OutBoundNav.results || [], // OUT
                            Direction: sCurrentDirection,
                            Flags: {
                                View: oResult.View,
                                Edit: oResult.Edit
                            }
                        });

                        this.getView().setModel(oJsonModel, "TruckModel");
                    }
                }.bind(this),

                error: function (oError) {
                    oThat.BusyDialog.close();
                    // console.error("OData Error:", oError.responseText);
                    MessageBox.error(oError.responseText);
                }
            });
        },




        onPrioritize: function () {
            //  sap.m.MessageToast.show("Prioritize button clicked");
            oThat.BusyDialog = new BusyDialog();
            //oThat.BusyDialog.open();
            // Get references to all 3 tables
            if (sCurrentDirection === "IN") {
                // var oPurchaseTable = this.byId("idPurchaseCommodityTable");
                // var oTransfersTable = this.byId("idTransfersTable");
                // var oNcpTable = this.byId("idPurchaseNCPTable");
                 var oInboundTable = this.byId("idInboundTable");
           // var oOutboundTable = oView.byId("idOutboundTable");

                // Check which table has a selected row
                var oSelectedItem = oInboundTable.getSelectedItem();
            } else {
                 var oOutboundTable = this.byId("idOutboundTable");
                var oSelectedItem = oOutboundTable.getSelectedItem();
            }

            if (!oSelectedItem) {
                sap.m.MessageToast.show(oThat.getView().getModel("i18n").getResourceBundle().getText("Pleaseselectrow"));
                // oThat.BusyDialog.close();
                return;
            }

            // Get the binding context object of the selected row
            //   var oSelectedObject = oSelectedItem.getBindingContext("TruckModel").getObject();
            var oCtx = oSelectedItem.getBindingContext("TruckModel");
            var oSelectedObject = oCtx.getObject();
            var sPath = oCtx.getPath(); // e.g., "/results/1"
            var iIndex = parseInt(sPath.split("/").pop(), 10);

            // Only allow prioritize if index > 1
            // if (iIndex <= 1) {
            //     MessageToast.show(oThat.oView.getModel("i18n").getResourceBundle().getText("CannotPrioritize"));
            //     return;
            // }
            var sWbId = oSelectedObject.WbId;
            // 🔹 Create a dialog to capture the reason
            var oDialog = new sap.m.Dialog({
                title: "Enter Reason for Prioritization",
                type: "Message",
                content: [
                    new sap.m.Label({
                        text: "Please enter reason:",
                        labelFor: "reasonInput"
                    }),
                    new sap.m.Input("reasonInput", {
                        width: "100%",
                        placeholder: "Type your reason here for" + (sWbId ? " (" + sWbId + ")" : "")
                    })
                ],
                beginButton: new sap.m.Button({
                    text: "Submit",
                    type: "Emphasized",
                    press: function () {
                        var sReason = sap.ui.getCore().byId("reasonInput").getValue().trim();
                        if (!sReason) {
                            sap.ui.getCore().byId("reasonInput").setValueState("Error");
                            sap.ui.getCore().byId("reasonInput").setValueStateText("Reason is mandatory");
                            return;
                        }

                        oDialog.close(); // close dialog
                        oThat.BusyDialog.open();

                        var aFilters = [
                            new Filter("Check", FilterOperator.EQ, "X"),
                            new Filter("WbId", FilterOperator.EQ, oSelectedObject.WbId),
                            new Filter("Reason", FilterOperator.EQ, sReason),
                            new Filter("Direction", FilterOperator.EQ, sCurrentDirection)
                        ];
                        var oModel = oThat.getOwnerComponent().getModel(); // ODataModel
                        oModel.read("/GetTruckSet", {
                            filters: aFilters,
                            urlParameters: {
                                "$expand": "InboundNav,OutBoundNav,ReturnNav"
                            },
                            success: function (oData) {
                                oThat.BusyDialog.close();
                                if (oData.results && oData.results.length > 0 && oData.results[0].ReturnNav) {
                                    var aReturn = oData.results[0].ReturnNav.results;
                                    if (aReturn && aReturn.length > 0) {
                                        // Separate error and success messages
                                        var aErrorMsgs = aReturn.filter(function (msg) {
                                            return msg.Type === "E";
                                        });
                                        var aSuccessMsgs = aReturn.filter(function (msg) {
                                            return msg.Type === "S";
                                        });

                                        // Show error messages first if any
                                        if (aErrorMsgs.length > 0) {
                                            var sErrorMsg = aErrorMsgs.map(function (msg) {
                                                return msg.Message;
                                            }).join("\n");
                                            sap.m.MessageBox.error(sErrorMsg)
                                        }
                                        // If no errors, show success messages
                                        else if (aSuccessMsgs.length > 0) {
                                            var sSuccessMsg = aSuccessMsgs.map(function (msg) {
                                                return msg.Message;
                                            }).join("\n");
                                            sap.m.MessageBox.success(sSuccessMsg, {
                                                onClose: function (oAction) {
                                                    oThat._loadTruckData();
                                                }.bind(this)
                                            });
                                        }
                                    }
                                }

                            }.bind(this),

                            error: function (oError) {
                                oThat.BusyDialog.close();
                                MessageBox.error("OData Error: " + oError.responseText);
                            }
                        });

                    }
                }),
                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oThat.getView().addDependent(oDialog);
            oDialog.open();
        },

        onTableSelectionChange: function (oEvent) {
            var oSelectedTable = oEvent.getSource(); // Table that triggered the event
            var oView = this.getView();

            // Get references to all 3 tables
            var oInboundTable = oView.byId("idInboundTable");
            var oOutboundTable = oView.byId("idOutboundTable");
           // var oNcpTable = oView.byId("idPurchaseNCPTable");

            // var oSalesTable = this.byId("idSalesTable");
            // var oStoTable = this.byId("idSTOTable");
            // var oScrapSalesTable = this.byId("idScrapTable");

            // Clear selections in other tables except the one clicked
            if (oSelectedTable !== oInboundTable) {
                oInboundTable.removeSelections(true);
            }
            if (oSelectedTable !== oOutboundTable) {
                oOutboundTable.removeSelections(true);
            }
            // if (oSelectedTable !== oNcpTable) {
            //     oNcpTable.removeSelections(true);
            // }
            // if (oSelectedTable !== oSalesTable) {
            //     oSalesTable.removeSelections(true);
            // }
            // if (oSelectedTable !== oStoTable) {
            //     oStoTable.removeSelections(true);
            // }
            // if (oSelectedTable !== oScrapSalesTable) {
            //     oScrapSalesTable.removeSelections(true);
            // }
        }



    });
});