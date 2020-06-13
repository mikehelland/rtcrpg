function OMGEmbeddedViewerTILESET(viewer) {
    var data = viewer.data
    var prefix = data.prefix || "";
    var postfix = data.postfix || "";
    var newDiv;
    for (var code in data.tileCodes) {
        newDiv = document.createElement("img");
        newDiv.src = prefix + data.tileCodes[code] + postfix
        viewer.embedDiv.appendChild(newDiv);
    }
}
if (typeof omg === "object" && omg.types && omg.types["TILESET"])
    omg.types["TILESET"].embedClass = OMGEmbeddedViewerTILESET