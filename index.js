const system = {

    DOMReferences: {

        loadingContainer: document.querySelector(".systemLoadingContainer"),
        setupContainer: document.querySelector(".systemSetupContainer"),
        workspaceContainer: document.querySelector(".systemWorkspaceContainer"),
        workspaceBottomBar: document.querySelector(".systemWorkspaceBottomBar"),
        workspaceSidebar: document.querySelector(".systemWorkspaceSidebar"),
        workspaceSidebarOverlay: document.querySelector(".systemWorkspaceSidebarOverlay"),
        workspaceSidebarAppList: document.querySelector(".systemWorkspaceSidebarAppList")

    },
    internalFunctions: {



    },
    internalVariables: {

        workspaceDragVariables: {

            active: false,
            dragItem: null,
            initialX: 0,
            initialY: 0,
            xOffset: 0,
            yOffset: 0,
            currentX: 0,
            currentY: 0

        }

    },
    console: {

        consoleHistory: [],
        log: function (type, id, message) {
            var logString = "LOG > " + id + ": " + message;
            system.console.consoleHistory.push(logString);
            console.log(logString);
        },
        error: function (type, id, message) {
            var errorString = "ERROR > " + id + ": " + message;
            system.console.consoleHistory.push(errorString);
            console.error(errorString);
        }

    },
    contextMenuManager: {

        contextMenuShown: false,
        generateContextMenu: function (e) {

            // Prevent the default Operating System context menu from appearing
            e.preventDefault();

            // If the previous context menu hasn't been removed yet, remove it.
            if (system.contextMenuManager.contextMenuShown) {
                system.contextMenuManager.clearContextMenu();
            }

            // Get the coordinates for the position at which the right click occurred
            var mouseX = e.pageX;
            var mouseY = e.pageY;

            // Generate the context menu UI
            var contextMenu = document.createElement("div");
            contextMenu.classList.add("systemContextMenu");
            contextMenu.style.left = mouseX + "px";
            contextMenu.style.top = mouseY + "px";

            // If the mouse is close to the right edge of the screen, show the context menu to the left of the cursor
            if (window.innerWidth - mouseX < 175) {
                contextMenu.style.transform = "translate(-100%, 0)";
            }

            // Find the nearest ancestor element with context menu actions
            var currentAncestor = e.target;
            while (!currentAncestor.getAttribute("data-contextmenu")) {
                currentAncestor = currentAncestor.parentElement;
                if (currentAncestor == document.body) return;
            }

            // Get the context menu actions for the given element
            var listOfItems = currentAncestor.getAttribute("data-contextmenu").split(";");

            for (var i = 0; i < listOfItems.length; i++) {

                // For each item, get the corresponding item from the contextMenuItems database.

                /*
                 ** If the : character is found in the string, split the
                 ** string at the :, and take the latter half as the command
                 ** parameter.
                 */
                var item;
                if (listOfItems[i].indexOf(":")) {

                    var splitString = listOfItems[i].split(":");
                    item = system.contextMenuManager.contextMenuItems[splitString[0]](splitString[1]);

                } else {

                    item = system.contextMenuManager.contextMenuItems[listOfItems[i]]();

                }

                /*
                 ** The contextMenuItems Object contains every context menu
                 ** item used in System. For each item the clicked element
                 ** requested, call the corresponding function in contextMenuItems
                 ** and see if it returned and item. If it did, show the item. If
                 ** not, the item is not supposed to be shown at this time.
                 */

                // Only show the list item in the UI if the function actually returned an item
                if (item) {

                    var itemElement = document.createElement("div");
                    itemElement.classList.add("menuItem");
                    itemElement.addEventListener("click", item.action);
                    itemElement.textContent = item.name;

                    contextMenu.appendChild(itemElement);

                } else {
                    break;
                }

            }

            system.contextMenuManager.contextMenuShown = true;
            document.body.appendChild(contextMenu);

            // Add event listener to clear the context menu
            document.body.addEventListener("click", system.contextMenuManager.clearContextMenu, true);

        },
        clearContextMenu: function () {

            document.body.removeEventListener("click", system.contextMenuManager.clearContextMenu, true);

            var contextMenuElement = document.querySelector(".systemContextMenu");
            contextMenuElement.style.opacity = 0;
            setTimeout(function () {
                contextMenuElement.parentElement.removeChild(contextMenuElement);
            }, 100);

            system.contextMenuManager.contextMenuShown = false;

        },

        contextMenuItems: {

            removeApp: function (appID) {
                return {

                    name: "Remove App",
                    action: function () {
                        var confirmation = confirm("Are you sure you want to remove this app?");
                        if (confirmation) {
                            system.appManager.removeApp(appID);
                        }
                    }

                };
            },
            copy: function (text) {
                return {

                    name: "Copy",
                    action: function () {
                        system.clipboardManager.copy(text)
                    }

                };
            },
            copyAppName: function (text) {
                return {

                    name: "Copy App Name",
                    action: function () {
                        system.clipboardManager.copy(text)
                    }

                };
            },
            appListShowAppInShop: function (appID) {

                return {

                    name: "Show in Shop",
                    action: function () {
                        system.workspaceManager.toggleWorkspaceSidebar("closed");
                        system.appManager.openApp("shop", appID);
                    }

                };
            },
            changeAppListViewMode: function () {

                var viewMode = system.storage.settings.workspaceSidebarAppListViewMode;
                var itemObject = {};

                if (viewMode == "list") {
                    itemObject.name = "View as Grid";
                    itemObject.action = function () {
                        system.workspaceManager.changeWorkspaceSidebarAppListViewMode("grid");
                    }
                } else {
                    itemObject.name = "View as List";
                    itemObject.action = function () {
                        system.workspaceManager.changeWorkspaceSidebarAppListViewMode("list");
                    }
                }

                return itemObject;
            },
            changeBottomBarViewMode: function () {

                var viewMode = system.storage.settings.workspaceBottomBarViewMode;
                var itemObject = {};

                if (viewMode == "fixed") {
                    itemObject.name = "View as Floating";
                    itemObject.action = function () {
                        system.workspaceManager.changeWorkspaceBottomBarViewMode("floating");
                    }
                } else {
                    itemObject.name = "View as Fixed";
                    itemObject.action = function () {
                        system.workspaceManager.changeWorkspaceBottomBarViewMode("fixed");
                    }
                }

                return itemObject;
            },

        }

    },
    appManager: {

        getProperCaseAppID: function (appID) {

            return appID.charAt(0).toUpperCase() + appID.slice(1);

        },

        addApp: function (appID) {

            system.storage.apps.installedApps.push(appID);
            system.storageManager.manualSave();
            system.workspaceManager.reloadWorkspaceSidebarAppList();

        },
        removeApp: function (appID) {

            system.storage.apps.installedApps.splice(system.storage.apps.installedApps.indexOf(appID), 1);
            system.storageManager.manualSave();
            system.workspaceManager.reloadWorkspaceSidebarAppList();

        },
        getAppInstallationStatus: function (appID) {

            if (system.storage.apps.installedApps.indexOf(appID) >= 0) {
                return true;
            } else {
                return false;
            }

        },
        getAppManifest: function (appID) {

            return new Promise(function (resolve, reject) {
                var request = new XMLHttpRequest();
                request.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        resolve(JSON.parse(this.responseText));
                    } else {
                        return false;
                    }
                };
                request.open("GET", "apps/" + appID + "/manifest.json", true);
                request.send();
            });

        },

        activeApp: undefined,
        openApps: [],
        openAppLaunchParameters: {},
        sendAppLaunchParameters: function (appID, didUpdate) {

            if (didUpdate) {
                var event = new CustomEvent("systemAppStatusEvent", {
                    detail: {
                        type: "systemAppStatusEvent",
                        appID: appID,
                        header: "appLaunchParametersUpdate",
                        content: system.appManager.openAppLaunchParameters?.[appID]
                    }
                });
            } else {
                var event = new CustomEvent("systemAppStatusEvent", {
                    detail: {
                        type: "systemAppStatusEvent",
                        appID: appID,
                        header: "appLaunchParameters",
                        content: system.appManager.openAppLaunchParameters?.[appID]
                    }
                });
            }
            document.querySelector(".system" + system.appManager.getProperCaseAppID(appID) + "Iframe").contentDocument.dispatchEvent(event);

        },
        splashScreenTimers: {},
        openApp: function (appID, launchParameters) {

            for (var i = 0; i < system.appManager.openApps.length; i++) {

                // If the app is already open, don't open it again, just send it the new launch parameters.
                if (appID == system.appManager.openApps[i]) {
                    system.appManager.openAppLaunchParameters[appID] = launchParameters;
                    system.appManager.sendAppLaunchParameters(appID, true);
                    return false;
                }

            }

            system.appManager.openAppLaunchParameters[appID] = launchParameters;

            var appIDProperCase = system.appManager.getProperCaseAppID(appID);

            var appWindow = document.createElement("div");
            appWindow.classList.add("systemAppWindow");
            appWindow.classList.add("system" + appIDProperCase + "Window");
            appWindow.style.top = (window.innerHeight / 2 - 150 + "px");
            appWindow.style.left = (window.innerWidth / 2 - 250 + "px");
            appWindow.addEventListener("mousedown", function () {

                system.appManager.activeApp = appID;

                system.appManager.moveAppWindowToTop(appID);

            });

            var appTopBarElement = document.createElement("div");
            appTopBarElement.classList.add("systemAppTopBar");
            appTopBarElement.classList.add("system" + appIDProperCase + "TopBar");

            var appTopBarCloseButtonElement = document.createElement("div");
            appTopBarCloseButtonElement.classList.add("systemAppTopBarCloseButton");
            appTopBarCloseButtonElement.innerHTML = "&times;";
            appTopBarCloseButtonElement.addEventListener("click", function () {
                system.appManager.closeApp(appID)
            });

            var appTopBarTitleElement = document.createElement("p");
            appTopBarTitleElement.classList.add("systemAppTopBarTitle");
            appTopBarTitleElement.classList.add("system" + appIDProperCase + "TopBarTitleElement");

            var appContentScreenElement = document.createElement("div");
            appContentScreenElement.classList.add("systemAppContentScreen");
            appContentScreenElement.classList.add("system" + appIDProperCase + "ContentScreen");

            var appIframeElement = document.createElement("iframe");
            appIframeElement.classList.add("systemAppIframe");
            appIframeElement.classList.add("system" + appIDProperCase + "Iframe");
            appIframeElement.setAttribute("src", "/apps/" + appID + "/index.html");

            var appSplashScreenElement = document.createElement("div");
            appSplashScreenElement.classList.add("systemAppSplashScreen");
            appSplashScreenElement.classList.add("system" + appIDProperCase + "SplashScreen");

            var appSplashScreenImage = document.createElement("img");
            appSplashScreenImage.classList.add("systemAppSplashScreenImage");
            appSplashScreenImage.classList.add("system" + appIDProperCase + "SplashScreenImage");
            appSplashScreenImage.setAttribute("src", "/apps/" + appID + "/assets/appIcon-250px.png");

            appTopBarElement.appendChild(appTopBarCloseButtonElement);
            appTopBarElement.appendChild(appTopBarTitleElement);
            appSplashScreenElement.appendChild(appSplashScreenImage);
            appContentScreenElement.appendChild(appIframeElement);

            appWindow.appendChild(appTopBarElement);
            appWindow.appendChild(appSplashScreenElement);
            appWindow.appendChild(appContentScreenElement);

            system.DOMReferences.workspaceContainer.appendChild(appWindow);
            requestAnimationFrame(function () {
                appWindow.style.opacity = 1;
                appWindow.style.transform = "scale(1)";
            });

            system.appManager.openApps.push(appID);
            system.appManager.activeApp = appID;
            system.appManager.moveAppWindowToTop(appID, true);

            // Only show the extended splash screen if the user has the showExtendedSplashScreen setting enabled
            if (system.storage.settings.showExtendedSplashScreen) {
                system.appManager.splashScreenTimers[appID] = setTimeout(function () {

                    // If the app is already ready to be shown, show it.
                    if (system.appManager.splashScreenTimers[appID] == "ready") {

                        // Hide splash screen and show app content
                        document.querySelector(".system" + appIDProperCase + "SplashScreen").style.opacity = 0;

                        var titleElement = document.querySelector(".system" + appIDProperCase + "TopBarTitleElement");
                        titleElement.textContent = system.appManager.splashScreenTimers[appID + "Title"];
                        titleElement.style.opacity = 1;

                        setTimeout(function () {
                            document.querySelector(".system" + appIDProperCase + "SplashScreen").style.display = "none";
                        }, 100);

                    } else {
                        // If not, set the noDelay flag for the appContentReady function.
                        system.appManager.splashScreenTimers[appID] = "noDelay";
                    }

                }, 1000);
            }

        },
        closeApp: function (appID) {

            var event = new CustomEvent("systemAppStatusEvent", {
                detail: {
                    type: "systemAppStatusEvent",
                    appID: appID,
                    header: "appPrepareToClose",
                    content: undefined
                }
            });
            document.querySelector(".system" + system.appManager.getProperCaseAppID(appID) + "Iframe").contentDocument.dispatchEvent(event);

        },
        closeAllApps: function () {

            with(system.appManager) {
                for (var i = 0; i < openApps.length; i++) {
                    closeApp(openApps[i]);
                }
            }

        },

        moveAppWindowToTop: function (appID, preserveActiveApp) {

            // Move the array item for the active app to the end of the array.
            with(system.appManager) {
                openApps.push(openApps.splice(openApps.indexOf(appID), 1)[0]);
            }

            for (var i = 0; i < system.appManager.openApps.length; i++) {
                document.querySelector(".system" + system.appManager.getProperCaseAppID(system.appManager.openApps[i]) + "Window").style.zIndex = i + 1;

                if (system.storage.settings.hideAppDetailsWhenNotActive) {
                    var appIDProperCase = system.appManager.getProperCaseAppID(system.appManager.openApps[i]);
                    if (system.appManager.openApps[i] != system.appManager.activeApp) {

                        // Show splash screen and hide app content
                        document.querySelector(".system" + appIDProperCase + "SplashScreen").style.display = "";

                        document.querySelector(".system" + appIDProperCase + "SplashScreen").style.opacity = 1;

                    } else {

                        if (!preserveActiveApp) {
                            // Hide splash screen and show app content
                            document.querySelector(".system" + appIDProperCase + "SplashScreen").style.opacity = 0;

                            setTimeout(function () {
                                document.querySelector(".system" + appIDProperCase + "SplashScreen").style.display = "none";
                            }, 100);
                        }

                    }
                }
            }

            system.DOMReferences.workspaceBottomBar.style.zIndex = ++i + 1;
            system.DOMReferences.workspaceSidebarOverlay.style.zIndex = ++i + 1;
            system.DOMReferences.workspaceSidebar.style.zIndex = ++i + 1;

        },

        appEventHandler: function (e) {

            var eventType = e.detail.type;
            switch (eventType) {

                case "systemAppStatusEvent":

                    switch (e.detail.header) {

                        case "initiatedAPI":
                            system.appManager.sendAppLaunchParameters(e.detail.appID);
                            break;
                        case "appContentReady":
                            system.appManager.appContentReady(e.detail.appID, e.detail.content);
                            break;
                        case "appReadyToClose":
                            system.appManager.appReadyToClose(e.detail.appID);
                            break;
                        case "appWindowTitleUpdate":
                            var titleElement = document.querySelector(".system" + system.appManager.getProperCaseAppID(e.detail.appID) + "TopBarTitleElement");
                            if (titleElement.textContent) {
                                titleElement.style.opacity = 0;
                                setTimeout(function () {
                                    titleElement.textContent = e.detail.content;
                                    titleElement.style.opacity = 1;
                                }, 100)
                            } else {
                                titleElement.textContent = e.detail.content;
                                titleElement.style.opacity = 1;
                            }

                    }

                    break;

                case "systemAppStorageEvent":

                    switch (e.detail.header) {

                        case "appStorageRead":

                            break;
                        case "appStorageWrite":

                            break;

                    }

                    break;

                case "systemAppConsoleEvent":

                    switch (e.detail.header) {

                        case "appConsoleLog":
                            system.console.log("app", e.detail.appID, e.detail.content);
                            break;
                        case "appConsoleError":
                            system.console.error("app", e.detail.appID, e.detail.content);
                            break;

                    }

                    break;

                case "systemAppKeyboardEvent":

                    switch (e.detail.header) {

                        case "keyDown":
                            system.keyboardManager.keyDownHandler(e.detail.content);
                            break;
                        case "keyUp":
                            system.keyboardManager.keyUpHandler(e.detail.content);
                            break;

                    }

                    case "systemAppNotificationRegistrationEvent":

                        switch (e.detail.header) {

                            case "instant":

                                break;

                            case "scheduled":

                                break;

                            case "conditional":

                                break;

                        }

                        break;

                    case "systemSettingsEvent":

                        switch (e.detail.header) {

                            case "getAllSettings":

                                var event = new CustomEvent("systemSettingsEvent", {
                                    detail: {
                                        type: "systemSettingsEvent",
                                        appID: e.detail.appID,
                                        header: "allSettingsEvent",
                                        content: system.storage.settings
                                    }
                                })
                                document.querySelector(".system" + system.appManager.getProperCaseAppID(e.detail.appID) + "Iframe").contentDocument.dispatchEvent(event);

                                break;

                            case "updateSetting":

                                var settingName = e.detail.content[0];
                                var settingState = e.detail.content[1];
                                system.storage.settings[settingName] = settingState;

                                system.storageManager.manualSave();

                                system.settingsManager.reload(settingName, settingState);

                                break;

                        }

                        break;

                    case "systemShopEvent":

                        switch (e.detail.header) {

                            case "getAppInstallationStatus":

                                var appInstallationStatus = system.appManager.getAppInstallationStatus(e.detail.content);

                                var event = new CustomEvent("systemShopEvent", {
                                    detail: {
                                        type: "systemShopEvent",
                                        appID: e.detail.appID,
                                        header: "appInstallationStatusEvent",
                                        content: appInstallationStatus
                                    }
                                });
                                document.querySelector(".system" + system.appManager.getProperCaseAppID(e.detail.appID) + "Iframe").contentDocument.dispatchEvent(event);

                                break;

                            case "getApp":

                                system.appManager.addApp(e.detail.content);

                                var event = new CustomEvent("systemShopEvent", {
                                    detail: {
                                        type: "systemShopEvent",
                                        appID: e.detail.appID,
                                        header: "shopGetAppEvent",
                                        content: true
                                    }
                                });
                                document.querySelector(".system" + system.appManager.getProperCaseAppID(e.detail.appID) + "Iframe").contentDocument.dispatchEvent(event);

                                break;

                            case "removeApp":

                                system.appManager.removeApp(e.detail.content);

                                var event = new CustomEvent("systemShopEvent", {
                                    detail: {
                                        type: "systemShopEvent",
                                        appID: e.detail.appID,
                                        header: "shopRemoveAppEvent",
                                        content: false
                                    }
                                });
                                document.querySelector(".system" + system.appManager.getProperCaseAppID(e.detail.appID) + "Iframe").contentDocument.dispatchEvent(event);

                                break;

                        }

                        break;

            }

        },
        appContentReady: function (appID, title) {

            // If the timer has already expired or the user has the showExtendedSplashScreen setting disabled, show the app instantly
            if (system.appManager.splashScreenTimers[appID] === "noDelay" || system.storage.settings.showExtendedSplashScreen === false) {

                var appIDProperCase = system.appManager.getProperCaseAppID(appID);

                // Hide splash screen and show app content
                document.querySelector(".system" + appIDProperCase + "SplashScreen").style.opacity = 0;

                var titleElement = document.querySelector(".system" + appIDProperCase + "TopBarTitleElement");
                titleElement.textContent = title;
                titleElement.style.opacity = 1;

                setTimeout(function () {
                    document.querySelector(".system" + appIDProperCase + "SplashScreen").style.display = "none";
                }, 100);

            } else {
                // If not, set the ready flag for the splash screen timer handler.
                system.appManager.splashScreenTimers[appID] = "ready";
                system.appManager.splashScreenTimers[appID + "Title"] = title;
            }

        },
        appReadyToClose: function (appID) {

            // Clear the app's launch parameters
            delete system.appManager.openAppLaunchParameters[appID];

            var indexOfAppID = system.appManager.openApps.indexOf(appID);

            // If the app was closed while the splash screen was showing,. this clears the splash screen timer
            clearTimeout(system.appManager.splashScreenTimers[appID]);
            system.appManager.splashScreenTimers[appID] = null;

            // Animate the app window out and then remove the element
            var appWindowElement = document.querySelector(".system" + system.appManager.getProperCaseAppID(appID) + "Window");
            appWindowElement.style.opacity = 0;
            appWindowElement.style.transform = "scale(0.9)";
            setTimeout(function () {
                appWindowElement.parentElement.removeChild(appWindowElement);
            }, 200);

            // Remove the app from the openApps array and set activeApp to the new active app 
            system.appManager.openApps.splice(indexOfAppID, 1);
            system.appManager.activeApp = system.appManager.openApps[system.appManager.openApps.length - 1];
            if (system.appManager.activeApp) {
                system.appManager.moveAppWindowToTop(system.appManager.activeApp);
            }

        }

    },
    workspaceManager: {

        toggleWorkspaceSidebar: function (toggleTo) {

            with(system.DOMReferences) {
                if (workspaceSidebar.classList.contains("open") || toggleTo == "closed") {

                    workspaceSidebar.classList.remove("open");
                    workspaceSidebarOverlay.style.opacity = 0;
                    setTimeout(function () {
                        workspaceSidebarOverlay.classList.remove("active");
                    }, 300);

                } else {

                    workspaceSidebar.classList.add("open");
                    workspaceSidebarOverlay.classList.add("active");
                    // Using requestAnimationFrame as a workaround for CSS not animating the opacity properly correctly in this situation.
                    requestAnimationFrame(function () {
                        workspaceSidebarOverlay.style.opacity = 0.5
                    });
                }
            }

        },
        reloadWorkspaceSidebarAppList: function () {

            var appList = system.DOMReferences.workspaceSidebarAppList;

            // Clear all current element children of the app list
            while (appList.firstElementChild) {
                appList.removeChild(appList.firstElementChild);
            }

            var installedApps = system.storage.apps.installedApps;
            for (var i = 0; i < installedApps.length; i++) {

                system.appManager.getAppManifest(installedApps[i]).then((manifest) => {

                    var currentAppID = manifest.appID;
                    var currentAppName = manifest.appName;

                    var appCard = document.createElement("div");
                    appCard.classList.add("appCard");

                    if (manifest.showInShop) {
                        appCard.setAttribute("data-contextmenu", "appListShowAppInShop:" + currentAppID + ";copyAppName:" + currentAppName + ";removeApp:" + currentAppID);
                    } else {
                        appCard.setAttribute("data-contextmenu", "copyAppName:" + currentAppName + ";removeApp:" + currentAppID);
                    }

                    // Using IIFE here to prevent currentAppID from being passed with a closure, and thus always referring to the last app.
                    (function (currentAppID) {
                        appCard.addEventListener("click", function () {

                            if (!system.keyboardManager.currentlyPressedKeys["AltLeft"] &&
                                !system.keyboardManager.currentlyPressedKeys["AltRight"]) {
                                system.workspaceManager.toggleWorkspaceSidebar("closed");
                            }
                            system.appManager.openApp(currentAppID);

                        });
                    })(currentAppID);

                    var icon = document.createElement("img");
                    icon.src = "apps/" + currentAppID + "/assets/appIcon-50px.png";

                    var label = document.createElement("p");
                    label.textContent = currentAppName;

                    appCard.appendChild(icon);
                    appCard.appendChild(label);
                    appList.appendChild(appCard);
                });

            }

        },

        changeWorkspaceSidebarAppListViewMode: function (viewMode) {

            if (viewMode == "list") {
                system.DOMReferences.workspaceSidebarAppList.classList.add("list");
                system.DOMReferences.workspaceSidebarAppList.classList.remove("grid");
                system.storage.settings.workspaceSidebarAppListViewMode = "list";
            } else if (viewMode == "grid") {
                system.DOMReferences.workspaceSidebarAppList.classList.add("grid");
                system.DOMReferences.workspaceSidebarAppList.classList.remove("list");
                system.storage.settings.workspaceSidebarAppListViewMode = "grid";
            }
            system.storageManager.manualSave();

        },
        changeWorkspaceBottomBarViewMode: function (viewMode) {

            if (viewMode == "fixed") {
                system.DOMReferences.workspaceBottomBar.classList.add("fixed");
                system.DOMReferences.workspaceBottomBar.classList.remove("floating");
                system.storage.settings.workspaceBottomBarViewMode = "fixed";
            } else if (viewMode == "floating") {
                system.DOMReferences.workspaceBottomBar.classList.add("floating");
                system.DOMReferences.workspaceBottomBar.classList.remove("fixed");
                system.storage.settings.workspaceBottomBarViewMode = "floating";
            }
            system.storageManager.manualSave();

        },

        workspaceDragFunctions: {

            mousedown: function (e) {

                with(system.internalVariables.workspaceDragVariables) {

                    xOffset = e.clientX - Number(e.target.parentElement.style.left.slice(0, -2));
                    yOffset = e.clientY - Number(e.target.parentElement.style.top.slice(0, -2));

                    //initialX = e.clientX;
                    //initialY = e.clientY;

                    if (e.target.classList.contains("systemAppTopBar")) {
                        dragItem = e.target;
                        active = true;
                        // Disable pointer events for iframes temporarily
                        var iframes = document.querySelectorAll("iframe");
                        for (var i = 0; i < iframes.length; i++) {
                            iframes[i].style.pointerEvents = "none";
                        }
                    }

                }

            },

            mouseup: function (e) {

                with(system.internalVariables.workspaceDragVariables) {
                    initialX = currentX;
                    initialY = currentY;

                    active = false;
                    // Re-enable pointer events for iframes
                    var iframes = document.querySelectorAll("iframe");
                    for (var i = 0; i < iframes.length; i++) {
                        iframes[i].style.pointerEvents = "";
                    }
                }

            },

            mousemove: function (e) {

                if (system.internalVariables.workspaceDragVariables.active) {

                    e.preventDefault();

                    with(system.internalVariables.workspaceDragVariables) {

                        currentX = e.clientX - xOffset;
                        currentY = e.clientY - yOffset;

                        dragItem.parentElement.style.top = currentY + "px";
                        dragItem.parentElement.style.left = currentX + "px";

                    }

                }

            }

        }

    },
    keyboardManager: {

        currentlyPressedKeys: {
            AltLeft: undefined,
            AltRight: undefined,
            KeyW: undefined,
            Escape: undefined
        },
        keyDownHandler: function (e) {

            system.keyboardManager.currentlyPressedKeys[e.code] = true;

            with(system.keyboardManager.currentlyPressedKeys) {

                if ((AltLeft || AltRight) && system.appManager.activeApp) {
                    document.querySelector(".system" + system.appManager.getProperCaseAppID(system.appManager.activeApp) + "TopBar").firstElementChild.classList.add("systemAppTopBarCloseButtonKeyboardShortcutIndicator");
                }

                if (((AltLeft || AltRight) && KeyW) && system.appManager.activeApp) {
                    system.appManager.closeApp(system.appManager.activeApp);
                    return;
                }

                if (Escape) {
                    if (system.DOMReferences.workspaceSidebar.classList.contains("open")) {

                        system.workspaceManager.toggleWorkspaceSidebar("closed");

                    }
                }

            }

        },
        keyUpHandler: function (e) {
            system.keyboardManager.currentlyPressedKeys[e.code] = undefined;

            with(system.keyboardManager.currentlyPressedKeys) {

                if (!(AltLeft || AltRight) && system.appManager.activeApp) {
                    document.querySelector(".system" + system.appManager.getProperCaseAppID(system.appManager.activeApp) + "TopBar").firstElementChild.classList.remove("systemAppTopBarCloseButtonKeyboardShortcutIndicator");
                }

            }
        }

    },
    clipboardManager: {

        clipboardContent: undefined,
        copy: function (text) {

            system.clipboardManager.clipboardContent = text;
            navigator.clipboard.writeText(text);

        },
        getClipboardContent: function () {

            return system.clipboardManager.clipboardContent;

        }

    },
    settingsManager: {

        reload: function (settingName, settingState) {

            switch (settingName) {

                case "workspaceBottomBarViewMode":
                    system.workspaceManager.changeWorkspaceBottomBarViewMode(settingState);
                    break;
                case "workspaceSidebarAppListViewMode":
                    system.workspaceManager.changeWorkspaceSidebarAppListViewMode(settingState);
                    break;

            }

        },

    },
    storageManager: {

        manualSave: function () {

            localStorage.setItem("storage", JSON.stringify(system.storage));

        }

    },
    storage: {},
    appStorage: {},

};

// Set up custom app event listeners
window.document.addEventListener("systemAppStatusEvent", function (e) {
    system.appManager.appEventHandler(e)
}, false);
window.document.addEventListener("systemAppStorageEvent", function (e) {
    system.appManager.appEventHandler(e)
}, false);
window.document.addEventListener("systemAppConsoleEvent", function (e) {
    system.appManager.appEventHandler(e)
}, false);
window.document.addEventListener("systemAppKeyboardEvent", function (e) {
    system.appManager.appEventHandler(e)
}, false);
window.document.addEventListener("systemAppNotificationRegistrationEvent", function (e) {
    system.appManager.appEventHandler(e)
}, false);
window.document.addEventListener("systemSettingsEvent", function (e) {
    system.appManager.appEventHandler(e)
}, false);
window.document.addEventListener("systemShopEvent", function (e) {
    system.appManager.appEventHandler(e)
}, false);

// Set up drag events for windows
system.DOMReferences.workspaceContainer.addEventListener("mousedown", system.workspaceManager.workspaceDragFunctions.mousedown, false);
system.DOMReferences.workspaceContainer.addEventListener("mouseup", system.workspaceManager.workspaceDragFunctions.mouseup, false);
system.DOMReferences.workspaceContainer.addEventListener("mousemove", system.workspaceManager.workspaceDragFunctions.mousemove, false);

// Set up right click listener
document.body.addEventListener("contextmenu", system.contextMenuManager.generateContextMenu);

if (localStorage.getItem("storage")) {
    // Recall storage if it exists
    system.storage = JSON.parse(localStorage.getItem("storage"));
} else {
    // Otherwise set defaults
    system.storage = {

        settings: {

            showExtendedSplashScreen: true,
            hideAppDetailsWhenNotActive: false,
            workspaceSidebarAppListViewMode: "list",
            workspaceBottomBarViewMode: "floating",

        },

        apps: {

            installedApps: ["shop", "settings", "testApp", "testApp2"]

        }

    }
    localStorage.setItem("storage", JSON.stringify(system.storage));
}

window.onload = function () {

    // Set Workspace Sidebar App List view mode
    system.DOMReferences.workspaceSidebarAppList.classList.add(system.storage.settings.workspaceSidebarAppListViewMode);

    // Set Workspace bottom bar view mode
    system.DOMReferences.workspaceBottomBar.classList.add(system.storage.settings.workspaceBottomBarViewMode);

    // Add app list to Workspace Sidebar
    system.workspaceManager.reloadWorkspaceSidebarAppList();

    // Hide loading screen and show the Workspace
    system.DOMReferences.loadingContainer.classList.add("hidden");
    system.DOMReferences.workspaceContainer.classList.remove("hidden");

    // Add keydown and keyup handlers for keyboard shortcuts
    window.addEventListener("keydown", system.keyboardManager.keyDownHandler);
    window.addEventListener("keyup", system.keyboardManager.keyUpHandler)

}
