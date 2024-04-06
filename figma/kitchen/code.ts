let url = "https://emoji.supply/kitchen"; 
  url = "https://git.emoji.supply/kitchen/"
//  url = "http://localhost:8888/kitchen";

 console.log("url", url);
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
  if (supress) {
    console.log("supressing duplicate drop")
    return;
  }

  const { items } = event;
  let fromBrowser = event.dropMetadata?.fromBrowser;
  console.log("Plugin got drop", event);

  let url = items.filter(item => item.type === 'text/uri-list')?.pop()?.data;

  if (url) {
     if (fromBrowser) {
      let position = figma.viewport.center;
      let userposition =  figma.activeUsers[0]?.position;

      const { dropPosition, windowSize, offset, itemSize } = event.dropMetadata;

      console.log("client.xy", [dropPosition.x, dropPosition.y]);
      console.log("event.xy", [event.x, event.y]);
      console.log("event.absolute.xy", [event.absoluteX, event.absoluteY]);
      console.log("user.xy", [userposition?.x, userposition?.y]);
      console.log("offset.xy", [offset.x, offset.y]);

      const bounds = figma.viewport.bounds;    
      const zoom = figma.viewport.zoom;
      const hasUI = Math.round(bounds.width * zoom) !== windowSize.width;    
      const leftPaneWidth = windowSize.width - bounds.width * zoom - 240;
      console.log({hasUI, leftPaneWidth, zoom, bounds})
    
      const xFromCanvas = hasUI ? dropPosition.x - leftPaneWidth : dropPosition.x;
      const yFromCanvas = hasUI ? dropPosition.y - 40 : dropPosition.y;
      console.log("canvas.xy", [xFromCanvas, yFromCanvas]);

      figma.notify("Adding emoji. Use the Figma app for more precise placement.")

      dropIcon(url);

    } else {
      dropIcon(url, event.absoluteX, event.absoluteY);
    }
    supress = true;
    setTimeout(() => { supress = false; }, 100);
  }
})

const dropIcon = (url: string, x?: number, y?: number, size?: number) => {
  if (!size) {
    size = 64;
    size = Math.round(size / figma.viewport.zoom);
  }

  figma.createImageAsync(url).then(async (image: Image) => {
    const node = figma.createRectangle() 
    node.resize(size, size)
    node.fills = [{
      type: 'IMAGE',
      imageHash: image.hash,
      scaleMode: 'FILL'
    }]

    let position =  figma.activeUsers[0]?.position;
    let viewportCenter = figma.viewport.center;
    node.name = "Emoji";
    node.x = Math.round((x || position.x || viewportCenter.x) - size / 2);
    node.y = Math.round((y || position.y || viewportCenter.y) - size / 2);
    figma.currentPage.selection = [node];
  
  })
}