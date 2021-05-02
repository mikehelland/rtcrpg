function OMGEmbeddedViewerMAP (viewer) {
    this.tileSize = 16
    this.img = {
        characters: document.getElementById("characters-spritesheet"),
        tiles: {}
    }
    
    import(omg.apps["rtcrpg"].path + "rpgmap.js").then(o => {
        var OMGRPGMap = o.default
        this.map = new OMGRPGMap(viewer.data, {div: viewer.embedDiv})
        if (viewer.params && viewer.params.maxHeight) {
            this.map.canvas.style.width = "100%"
            this.map.canvas.style.height = "100%"
            viewer.embedDiv.style.height = viewer.params.maxHeight + "px"
            console.log(viewer.params.maxHeight)
        }

        this.map.draw() 
    })
    
}
