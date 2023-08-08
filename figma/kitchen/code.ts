let url = "https://emoji.supply/kitchen"; 
// url = "http://localhost:8888/kitchen";

figma.showUI(
  `<script>window.location='${url}'</script>`,
  { themeColors: true, width: 360, height: 640 }
);

figma.ui.onmessage = (message) => {
  console.log("got this from the UI", message)
  if (message.clickedImage) {
    dropIcon(message.clickedImage);
  }
}

let supress = false;
figma.on('drop', (event: DropEvent) => {
  if (supress) return;  // Avoid duplicate drops, due to a browser bug

  const { items } = event;
  let fromBrowser = event.dropMetadata?.fromBrowser;
  console.log("Plugin got drop", event);

  let url = items.filter(item => item.type === 'text/uri-list')?.pop()?.data;

  if (url) {
     if (fromBrowser) {
      let position = figma.viewport.center; //figma.activeUsers[0]?.position || 
      console.log("drop position", position);
      dropIcon(url, position.x, position.y);
    } else {
      dropIcon(url, event.absoluteX, event.absoluteY);
    }
    supress = true;
    setTimeout(() => { supress = false; }, 100);
  }
})

const dropIcon = (url: string, x?: number, y?: number) => {
  let size = 64;
  size = Math.round(size / figma.viewport.zoom);
  
  const node = figma.createRectangle() 
  node.resize(size, size)

  let viewportCenter = figma.viewport.center;
  node.x = Math.round((x || viewportCenter.x) - size / 2);
  node.y = Math.round((y || viewportCenter.y) - size / 2);

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