function OMGEmbeddedViewerMAP (viewer) {
    this.canvas = document.createElement("canvas")
    this.context = this.canvas.getContext("2d")
    this.tileSize = 16
    this.img = {
        characters: document.getElementById("characters-spritesheet"),
        tiles: {}
    }
    
    this.canvas.style.width = "100%"
    this.canvas.style.height = "100%"
    viewer.embedDiv.appendChild(this.canvas)

    import(omg.apps["rtcrpg"].path + "rpgmap.js").then(o => {
        var OMGRPGMap = o.default
        this.map = new OMGRPGMap(viewer.data, {div: viewer.embedDiv})
        this.map.draw() 
    })
    
}
