API.init("shop")
    .then(() => {

        getAppDatabase().then((database) => {

            var appListElement = document.querySelector("#appList");
            var availableApps = database.shownInShop;
            for (var i = 0; i < availableApps.length; i++) {

                var currentAppID = availableApps[i];
                getAppManifest(currentAppID).then((manifest) => {

                    var appCard = document.createElement("div");
                    appCard.classList.add("appCard");
                    appCard.addEventListener("click", function () {
                        openShopPage(manifest.appID);
                    });

                    var icon = document.createElement("img");
                    icon.src = "../" + manifest.appID + "/assets/appIcon-50px.png";

                    var label = document.createElement("p");
                    label.textContent = manifest.appName;

                    appCard.appendChild(icon);
                    appCard.appendChild(label);

                    appListElement.appendChild(appCard);

                });

            }

        });

        var launchParameters = API.appInfo.getAppLaunchParameters();
        if (launchParameters) openShopPage(launchParameters);
    
        API.appInfo.eventHandlers.appLaunchParametersUpdate = function () {
            openShopPage(API.appInfo.getAppLaunchParameters());
        }

        API.appLifecycle.appContentReady("Shop");

    });

var appPreviewScreen = {
    img: document.querySelector("#appPreviewScreen img"),
    h2: document.querySelector("#appPreviewScreen h2"),
    button: document.querySelector("#getAppButton"),
}

function getAppDatabase() {

    return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                resolve(JSON.parse(this.responseText));
            } else {
                return false;
            }
        };
        request.open("GET", "../appDatabase.json", true);
        request.send();
    });

}

function getAppManifest(appID) {

    return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                resolve(JSON.parse(this.responseText));
            } else {
                return false;
            }
        };
        request.open("GET", "../" + appID + "/manifest.json", true);
        request.send();
    });

}

function openShopPage(appID) {

    // Get the app manifest
    getAppManifest(appID).then(function (manifest) {

        // Handle errors
        if (!manifest) {
            // ERROR CODE GOES HERE
        }

        // If there are no errors, set the contents of the app preview screen
        appPreviewScreen.img.src = "../" + appID + "/assets/appIcon-250px.png";
        appPreviewScreen.h2.textContent = manifest.appName;

        getAppInstallationStatus(appID).then((status) => {

            updateGetAppButton(appID, status);

            API.UIManager.openScreen("appPreviewScreen");
        });

    });

}

function getAppInstallationStatus(appID) {

    return new Promise(function (resolve, reject) {

        API.appInfo.eventHandlers.appShopReceiver = function (receivedEvent) {
            resolve(receivedEvent.detail.content);
        }

        API.eventManager.sendEvent("systemShopEvent", "getAppInstallationStatus", appID);

    });

}

function getApp(appID) {

    return new Promise(function (resolve, reject) {

        API.appInfo.eventHandlers.appShopReceiver = function (receivedEvent) {
            resolve(receivedEvent.detail.content);
        }

        API.eventManager.sendEvent("systemShopEvent", "getApp", appID);

    });

}

function removeApp(appID) {

    return new Promise(function (resolve, reject) {

        API.appInfo.eventHandlers.appShopReceiver = function (receivedEvent) {
            resolve(receivedEvent.detail.content);
        }

        API.eventManager.sendEvent("systemShopEvent", "removeApp", appID);

    });

}

function updateGetAppButton(appID, installationStatus) {

    if (installationStatus) {

        appPreviewScreen.button.textContent = "Remove app";
        appPreviewScreen.button.onclick = function () {
            removeApp(appID).then(() => {
                updateGetAppButton(appID, false);
            });
        };

    } else {

        appPreviewScreen.button.textContent = "Get app";
        appPreviewScreen.button.onclick = function () {
            getApp(appID).then(() => {
                updateGetAppButton(appID, true);
            });
        };

    }

}
