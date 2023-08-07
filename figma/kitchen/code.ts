figma.showUI(
  `<script>window.location = 'https://emoji.supply/kitchen'</script>`,
  { themeColors: true, width: 360, height: 640 }
);

figma.on('drop', (event: DropEvent) => {
  const { items } = event;
  if (items.length > 0 && items[0].type === 'text/uri-list') {
    const url = items[0].data;

    let size = 64;
    size = Math.round(size / figma.viewport.zoom);
    
    const node = figma.createRectangle() 
    node.resize(size, size)
  
    node.x = Math.round(event.absoluteX - size / 2);
    node.y = Math.round(event.absoluteY - size / 2);

    node.fills = [];
    figma.createImageAsync(url).then(async (image: Image) => {
      figma.currentPage.selection = [node];
      node.fills = [{
        type: 'IMAGE',
        imageHash: image.hash,
        scaleMode: 'FILL'
      }]
    })
  }
})