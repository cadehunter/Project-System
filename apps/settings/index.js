var lifecycle = API.init("settings");

var settings;

API.appInfo.eventHandlers.appSettingsReceiver = function (receivedSettings) {
    settings = receivedSettings;
    recallSettings()
}
API.eventManager.sendEvent("systemSettingsEvent", "getAllSettings", null)

function recallSettings() {
    
    // Recall settings and change UI to reflect previously-set settings. Also set event handlers on checkboxes to update the stored settings when changed.
    
    // WORKSPACE
    document.getElementsByName("workspaceBottomBarViewMode")[0].value = settings.workspaceBottomBarViewMode;
    document.getElementsByName("workspaceBottomBarViewMode")[0].onchange = function () {updateDropDownSetting("workspaceBottomBarViewMode")};
    
    document.getElementsByName("workspaceSidebarAppListViewMode")[0].value = settings.workspaceSidebarAppListViewMode;
    document.getElementsByName("workspaceSidebarAppListViewMode")[0].onchange = function () {updateDropDownSetting("workspaceSidebarAppListViewMode")};
    
    // APPS
    document.getElementsByName("showExtendedSplashScreen")[0].checked = settings.showExtendedSplashScreen;
    document.getElementsByName("showExtendedSplashScreen")[0].onchange = function () {updateCheckboxSetting("showExtendedSplashScreen")};
    
    document.getElementsByName("hideAppDetailsWhenNotActive")[0].checked = settings.hideAppDetailsWhenNotActive;
    document.getElementsByName("hideAppDetailsWhenNotActive")[0].onchange = function () {updateCheckboxSetting("hideAppDetailsWhenNotActive")};
    
    lifecycle.then(() => {API.appLifecycle.appContentReady("Settings")});
    
}

function updateCheckboxSetting(settingName) {
    
    API.eventManager.sendEvent("systemSettingsEvent", "updateSetting", [settingName, document.getElementsByName(settingName)[0].checked]);
    
}

function updateDropDownSetting(settingName) {
    
    API.eventManager.sendEvent("systemSettingsEvent", "updateSetting", [settingName, document.getElementsByName(settingName)[0].value]);
    
}