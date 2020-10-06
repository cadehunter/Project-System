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
        getAppLaunchParameters: function () {
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

    contextMenuManager: {

        items: {},

        internal: {
            
            currentItems: {},

            generateContextMenu: function (e) {

                // Prevent the default operating system context menu from appearing
                e.preventDefault();

                // If the previous context menu hasn't been removed yet, remove it now.
                if (API.contextMenuManager.internal.contextMenuShown) {
                    API.contextMenuManager.internal.clearContextMenu();
                }

                // Get the coordinates for the position at which the right click occurred
                var mouseX = e.pageX;
                var mouseY = e.pageY;

                // Find the nearest ancestor element with context menu actions
                var currentAncestor = e.target;
                while (!currentAncestor.getAttribute("data-contextmenu")) {
                    currentAncestor = currentAncestor.parentElement;
                    if (currentAncestor == document.body) return;
                }
                
                // Get the context menu items for the element

                var listOfItems = currentAncestor.getAttribute("data-contextmenu").split(";");
                for (var i = 0; i < listOfItems.length; i++) {

                    // For each item, get the corresponding item from the API.contextMenuManager.items database.

                    /*
                     ** If the : character is found in the string, split the
                     ** string at the :, and take the latter half as the command
                     ** parameter.
                     */
                    var item;
                    if (listOfItems[i].indexOf(":")) {

                        var splitString = listOfItems[i].split(":");
                        item = API.contextMenuManager.items[splitString[0]](splitString[1]);

                    } else {

                        item = API.contextMenuManager.items[listOfItems[i]]();

                    }
                    

                    /*
                     ** The API.contextMenuManager.items Object contains the context menu
                     ** items used in the app. For each item the clicked element
                     ** requested, call the corresponding function in API.contextMenuManager.items
                     ** and see if it returned and item. If it did, show the item. If
                     ** not, the item is not supposed to be shown at this time.
                     */

                    // Only send the list item to System if the function actually returned an item
                    var itemsToSend = [];
                    if (item) {
                        itemsToSend.push(item);
                    } else {
                        break;
                    }

                }
                
                // Store the current items in the API.contextMenuManager.internal.currentItems object.
                API.contextMenuManager.internal.currentItems = {};
                for (var i = 0; i < itemsToSend.length; i++) {
                    API.contextMenuManager.internal.currentItems[itemsToSend[i].id] = itemsToSend[i];
                }
                
                var sentObject = {
                    items: itemsToSend,
                    x: mouseX,
                    y: mouseY
                };
                
                // Send event to System
                API.eventManager.sendEvent("systemAppContextMenuEvent", "open", sentObject);
                
                // Add event listener to clear the context menu
                document.body.addEventListener("click", API.contextMenuManager.internal.clearContextMenu, true);

            },

            clearContextMenu: function () {

                // Clear event listener
                document.body.removeEventListener("click", API.contextMenuManager.internal.clearContextMenu, true);
                
                // Send event to System
                API.eventManager.sendEvent("systemAppContextMenuEvent", "close", undefined);

            },
            
            performContextMenuAction: function (itemID) {
                
                API.contextMenuManager.internal.currentItems[itemID].action();
                
            }

        }

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
                case "systemAppContextMenuEvent":
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

window.document.addEventListener("systemAppContextMenuEvent", function (e) {
    
    switch (e.detail.header) {
       
        case "appContextMenuAction":
            API.contextMenuManager.internal.performContextMenuAction(e.detail.content);
            break;
            
    }
    
});

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

// Add context menu listener
window.addEventListener("contextmenu", API.contextMenuManager.internal.generateContextMenu);
