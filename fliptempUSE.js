// flip horizontol

tiles = []
editor.map.tiles.forEach(line=>{
	newLine = []
  tiles.push(newLine)
  for (i=line.length-1; i>=0;i--) { 
		newLine.push(line[i])
  }
})
editor.map.tiles = tiles
editor.map.draw()  

//rotate

tiles = []
for (i=editor.map.tiles.length-1; i>=0;i--) { 
	newLine = []
    tiles.push(newLine)
	editor.map.tiles.forEach(line=>{
		newLine.push(line[i])
  })
}
editor.map.tiles = tiles
editor.map.draw()  

// flip vertical

tiles = []
for (i=editor.map.tiles.length-1; i>=0;i--) { 
	newLine = []
    tiles.push(newLine)
	editor.map.tiles[i].forEach(line=>{
		newLine.push(line[i])
  })
}
editor.map.tiles = tiles
editor.map.draw()  
