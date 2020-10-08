API.init("testApp")
    .then(() => {
    
        API.appLifecycle.appContentReady("testApp");
    
    });

function store() {
    
    API.storageManager.write("a.b.c", "xyz");
    API.storageManager.write("x.y.z", "abc");
    
}

function recall() {
    
    API.storageManager.read(undefined).then(
        (content) => {
            console.log(content);
        },
        (content) => {
            console.log("Error: " + content);
        }
    );
    
}
