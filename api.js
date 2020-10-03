const API = {

    init: function (appID) {

        return new Promise(function (resolve, reject) {
            
            API.appInfo.appID = appID;
            
            API.appInfo.eventHandlers.appLaunchParametersReceiver = function (e) {
                
                API.appInfo.appLaunchParameters = e.detail.content;
                resolve();
                
            };
            
            API.eventManager.sendEvent("systemAppStatusEvent", "initiatedAPI", null);
            
        });

    },

    appInfo: {
        appID: undefined,
        eventHandlers: {
            appPrepareToCloseHandler: function () {
                API.appLifecycle.appReadyToClose();
            },
            appSettingsReceiver: undefined,
            appLaunchParametersUpdate: undefined,
        },
        appLaunchParameters: undefined,
        getAppLaunchParamaters: function () {
            return API.appInfo.appLaunchParameters;
        }
    },

    appLifecycle: {
        
        // Functions used to tell System when your app has completed certain lifecycle steps

        appContentReady: function (title) {
            API.eventManager.sendEvent("systemAppStatusEvent", "appContentReady", title);
        },
        appReadyToClose: function () {
            API.eventManager.sendEvent("systemAppStatusEvent", "appReadyToClose", undefined);
        },
        appWindowTitleUpdate: function (title) {
            API.eventManager.sendEvent("systemAppStatusEvent", "appWindowTitleUpdate", title);
        }

    },

    console: {

        // Allows the app to log messages to the System console

        log: function (message) {

            API.eventManager.sendEvent("systemAppConsoleEvent", "appConsoleLog", message);

        },
        error: function (message) {

            API.eventManager.sendEvent("systemAppConsoleEvent", "appConsoleError", message);

        }

    },

    notificationManager: {

        // Incomplete

        getPermissionStatus: function () {},
        registerNotification: function (type, notification, options) {

            switch (type) {

                case "instant":

                    API.eventManager.sendEvent("systemAppNotificationRegistrationEvent", type, "");

                    break;

                case "scheduled":
                    break;

                    /*
                case "conditional":
                    break;
                    */

            }

        },

    },

    eventManager: {

        // Handles sending events from the app to System

        sendEvent: function (type, header, content) {

            switch (type) {
                case "systemSettingsEvent":
                case "systemShopEvent":
                    if (type == "systemSettingsEvent" && API.appInfo.appID !== "settings") {
                        break;
                    }
                    if (type == "systemShopEvent" && API.appInfo.appID !== "shop") {
                        break;
                    }
                case "systemAppStatusEvent":
                case "systemAppStorageEvent":
                case "systemAppConsoleEvent":
                case "systemAppKeyboardEvent":
                case "systemAppNotificationRegistrationEvent":
                    var event = new CustomEvent(type, {
                        detail: {
                            type: type,
                            appID: API.appInfo.appID,
                            header: header,
                            content: content
                        }
                    })
                    window.parent.document.dispatchEvent(event);
                    return true;
                    break;

                default:
                    return false;
                    break;

            }

        }

    },

    UIManager: {

        openScreen: function (screenID) {

            var element = document.getElementById(screenID);
            element.style.display = "block";
            requestAnimationFrame(function () {
                element.style.opacity = 1;
                element.style.transform = "none";
            });

        },

        closeScreen: function (screenID) {

            var element = document.getElementById(screenID);
            element.style.opacity = 0;
            element.style.transform = "translate(25px, 0)";
            setTimeout(function () {
                element.style.display = "none";
            }, 200)

        }

    },

    keyboardEventForwarder: {

        keyDownHandler: function (e) {
            API.eventManager.sendEvent("systemAppKeyboardEvent", "keyDown", e);
        },

        keyUpHandler: function (e) {
            API.eventManager.sendEvent("systemAppKeyboardEvent", "keyUp", e);
        }

    }

}

// Set up receiving event listeners from System
window.document.addEventListener("systemAppStatusEvent", function (e) {

    switch (e.detail.header) {

        case "appPrepareToClose":
            API.appInfo.eventHandlers.appPrepareToCloseHandler();
            break;
            
        case "appLaunchParameters":
            API.appInfo.eventHandlers.appLaunchParametersReceiver(e);
            break;
            
        case "appLaunchParametersUpdate":
            API.appInfo.appLaunchParameters = e.detail.content;
            API.appInfo.eventHandlers.appLaunchParametersUpdate(e);
            break;

    }

}, false);

window.document.addEventListener("systemSettingsEvent", function (e) {

    switch (e.detail.header) {

        case "allSettingsEvent":
            API.appInfo.eventHandlers.appSettingsReceiver(e.detail.content);
            break;

    }

}, false);

window.document.addEventListener("systemShopEvent", function (e) {

    API.appInfo.eventHandlers.appShopReceiver(e);

}, false);

// Forward all keystrokes to System for keyboard shortcuts
window.addEventListener("keydown", API.keyboardEventForwarder.keyDownHandler);
window.addEventListener("keyup", API.keyboardEventForwarder.keyUpHandler);
