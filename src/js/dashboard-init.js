'use strict';

(function (mod) {

    mod.factory('pluginApi', ['$window', 'pluginName', function ($window, pluginName) {
        return $window.parent.pluginApi(pluginName);
    }]);

    mod.factory('tabManager', ['pluginApi', '$window', 'urlUtil', function (pluginApi, $window, urlUtil) {
        var tabWindow, selectedTreeItem;
        return {
            addTabs: function () {
                if ((pluginApi.configObject().showTrends && pluginApi.configObject().showTrends === true)) {
                    pluginApi.addMainTab('Trends', 'trends-tab', urlUtil.relativeUrl('trendsTab.html'));
                }
                pluginApi.addMainTab('Dashboard', 'dashboard-tab', urlUtil.relativeUrl('dashboard.html'),
                        {
                            priority: -1
                        });
                pluginApi.revealPlace('dashboard-tab');
            },
            setTabWindow: function (window) {
                tabWindow = window;
            },
            setSelectedTreeItem: function (item) {
                selectedTreeItem = item;
            },
            updateTab: function() {
                if (tabWindow && !selectedTreeItem) {
                    selectedTreeItem = {type : "System"};
                }
                if (tabWindow && selectedTreeItem && (window.parent.location.href.indexOf("#trends-tab") > -1)) {
                    var type = selectedTreeItem.type;
                    var entityId = selectedTreeItem.entity && selectedTreeItem.entity.id;
                    var entityName = selectedTreeItem.entity && selectedTreeItem.entity.name;
                    var entityClusterId = selectedTreeItem.entity && selectedTreeItem.entity.clusterId;
                    var configObject = pluginApi.configObject();
                    tabWindow.setTestData(type, entityId, entityName, entityClusterId, configObject);
                }
            }
        };
    }]);

    mod.factory('pluginEventHandlers', ['pluginApi','pluginName', 'tabManager', '$window', 'urlUtil', function (pluginApi, pluginName, tabManager, $window, urlUtil) {
        var sessionId;
        return {
            UiInit: function () {
                tabManager.addTabs();
            },
            RestApiSessionAcquired: function (session) {
                sessionId = session;
            },
            MessageReceived: function (dataString, sourceWindow) {
                var data = JSON.parse(dataString);
                if (data && data.sender === pluginName) {
                    if (data.action === 'GetTabData') {
                        tabManager.setTabWindow(sourceWindow);
                        tabManager.updateTab();
                    }
                    else if(data.action === 'getSession') {
                        sourceWindow.setSessionId(sessionId);
                    }
                }
            },
            SystemTreeSelectionChange: function (selectedItem) {
                tabManager.setSelectedTreeItem(selectedItem);
                tabManager.updateTab();
            }
        };
    }]);

    mod.factory('initService', ['pluginApi', 'pluginEventHandlers', '$window', '$location', function (pluginApi, pluginEventHandlers, $window, $location) {
        return {
            bootstrapPlugin: function () { 
                var messageOrigin = pluginApi.configObject().messageOrigins;
                if (!messageOrigin) {
                    var port = (($location.port()) && ($location.absUrl().indexOf($location.port().toString()) > 0)) ? ":" + $location.port() : "";
                    messageOrigin = $location.protocol() + "://" + $location.host() + port;
                }
                var apiOptions = {
                        allowedMessageOrigins: messageOrigin
                };
                pluginApi.options(apiOptions);
                pluginApi.register(pluginEventHandlers);
                pluginApi.ready();
            }
        };
    }]);

    mod.run(['initService', function (initService) {
        initService.bootstrapPlugin();
    }]);

}(
    angular.module('plugin.init', ['plugin.common'])
));
