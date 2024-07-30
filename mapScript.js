let qtObject;

function initializeWebChannel() {
    new QWebChannel(qt.webChannelTransport, function(channel) {
        qtObject = channel.objects.myObject;
    });
}

function sendMessage() {
    if (qtObject) {
        qtObject.doSomething(42); // Call C++ slot
    } else {
        console.error("QtObject is not initialized.");
    }
}
