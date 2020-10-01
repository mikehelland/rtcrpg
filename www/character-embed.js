function OMGEmbeddedViewerCHARACTER(viewer) {
    
    var newDiv = document.createElement("div")
    newDiv.innerHTML = viewer.data.images[0].url
    viewer.embedDiv.appendChild(newDiv);

    newDiv = document.createElement("img");
    newDiv.src = viewer.data.images[0].url
    newDiv.style.maxWidth = "100%"
    viewer.embedDiv.appendChild(newDiv);
    
}
if (typeof omg === "object") omg.registerEmbeddedViewer("CHARACTER", OMGEmbeddedViewerCHARACTER)