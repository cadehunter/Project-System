API.init("testApp")
    .then(() => {
    
        API.appLifecycle.appContentReady("testApp");
    
    })

/*API.appInfo.eventHandlers.appPrepareToCloseHandler = function () {
    API.appLifecycle.appReadyToClose();
}*/
