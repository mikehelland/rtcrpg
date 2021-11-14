function OMGEmbeddedViewerMAP (viewer) {
    this.tileSize = 16
    this.img = {
        characters: document.getElementById("characters-spritesheet"),
        tiles: {}
    }
    
    import(omg.apps["rtcrpg"].path + "rpgmap.js").then(o => {
        var OMGRPGMap = o.default
        this.map = new OMGRPGMap(viewer.data, {
            mapOnly: true,
            div: viewer.embedDiv,
            onload: () => {

                this.map.canvas.style.width = "100%"
                this.map.charCanvas.style.width = "100%"
                
                if (viewer.params.maxHeight) {
                    this.map.canvas.style.height = viewer.params.maxHeight + "px"
                    this.map.charCanvas.style.height = viewer.params.maxHeight + "px"
                }
                else {
                    this.map.canvas.style.height = "100%"
                    this.map.charCanvas.style.height = "100%"
                }
                
                this.map.drawCustom({
                    width: Math.min(32, viewer.data.width), 
                    height: Math.min(32, viewer.data.height)
                }) 
        
            }
        })
        
    })
    
}
