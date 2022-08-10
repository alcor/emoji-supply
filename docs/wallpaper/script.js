let debug = false;

function random() {
  if (random.seed) {
    var x = Math.sin(random.seed++) * 10000;
    return x - Math.floor(x);
  }
  return Math.random();
}

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

const download = () => {
  document.getElementById("download-link").click()
}

const copy = (el) => {
  let options = Object.fromEntries(new URLSearchParams(location.search));

  let strings = []
  let title = document.getElementById("t");
  let text = ""
  if (options.t && options.t.length) {
    text = options.t + "\n" + decodeURIComponent(options.emoji);
  } else {
    let form = document.getElementById("form");
    form.childNodes.forEach(node => {
      if (node.className == "ignore") return;      
      if (node.options) {
        node = node.options[node.selectedIndex];
      } 
      let string = node.innerText || node.value || "";
      console.log("child", node, string)

      string = string.trim();
      if (string.length)
        strings.push(string.trim());
    })
    console.log("strings", strings)
    text = strings.join(" ");
  }
  text += "\n\n"
  text = location.href;
  copyToClipboard(text)
  document.getElementById("copy").innerText = "✓";
  setTimeout(e => {document.getElementById("copy").innerText = "COPY";}, 5000)
  return false;
}

var timer;

function updateForm() {
  let form = document.getElementById("form");
  let paramsString = window.location.search.substring(1);
  let params = new URLSearchParams(paramsString);
  let entries = params.entries();
  for (var [k, v] of entries) {
    let input = form.elements[k];
    if (!input) continue; // URL-only param
    if (k == "emoji") v = decodeURIComponent(v)
    switch(input.type) {
      case 'checkbox': input.checked = !!v; break;
      default:         input.value = v;     break;
    }
  }
}

function updateURL() {
  let form = document.getElementById("form");
  let params = new URLSearchParams(new FormData(form));
  let options = Object.fromEntries(params);

  // omit empty/default params
  for (const [k, v] of Object.entries(options)) {
    console.log("keep", k,v)
    if (k == 'emoji') continue; // except emoji, let that be empty
    if (v == '' || v == null) { params.delete(k) }
  }

  // This works around a bug in apple's url detection that can't handle a whole mess of encoded unicode characters
  params.set("emoji", encodeURIComponent(params.get("emoji")))
  history.replaceState(undefined, undefined, "?" + params.toString())
}

function setColor(e) {
  console.log("e", e)
  let color = e.value || e.getAttribute("value");
  console.log("setcolor", color)
  document.getElementById("colorPicker").value = color
  clearTimeout(timer);
  timer = setTimeout(render, 300);
}

function createCanvas(w, h) {
  var canvas = document.createElement('canvas');
  canvas.setAttribute('width', w);
  canvas.setAttribute('height', h);
  return canvas;
}

var ua = navigator.userAgent;
var isMac = /Macintosh/.test(ua)
var isWin = /Windows/.test(ua)
var iOS = /iPad|iPhone|iPod/.test(ua)
var a = document.getElementById("download-link");
var c = document.getElementById("canvas");
var fullbleed = false;

if (iOS) {
  //document.getElementById("textPicker").style.display = "none"
}

function render() {
  updateURL();
  renderContent();
}

document.fonts.onloadingdone = function (fontFaceSetEvent) {
  renderContent();
};

var startTime = undefined;
function renderFrame(time) {
  if(!startTime){ startTime = time; }
  renderContent(time, 1);
  if (shouldAnimate) {
    setTimeout(() => {
      window.requestAnimationFrame(renderFrame);
      }, 1000 / 30);
  }
}


console.log()
let emojiCanvas = [];
function renderContent(time, seed) {
  if (seed) random.seed = seed;

  var elapsed = (time - startTime) || 0;
  let options = Object.fromEntries(new URLSearchParams(location.search));

  let form = document.getElementById("form");
  let data = new FormData(form);

  let color = data.get('color');
  var lightColor = contrastColor(color, 10);
  var darkColor = contrastColor(color, -5);
  var textColor = contrastColor(color);
  var density = window.devicePixelRatio;
  var sh = screen.height, sw = screen.width;
  if (iOS && Math.abs(window.orientation) == 90) {
    [sw, sh] = [sh, sw]
  }
  
  sw *= density;
  sh *= density;

  let sizeString = document.querySelector('#sizePicker').value || "*";
  localStorage.setItem("size", sizeString)

  if (sizeString == "page" || fullbleed) {
    sw = window.innerWidth;
    sh = window.innerHeight;
    sw *= density;
    sh *= density;
  } else if (sizeString != "*") {
    let sizes = sizeString.split("x");
    sw = sizes[0]
    sh = sizes[1] || sw
    density = 2;
  }

  var filename = "emoji-" + color.replace("#","");

  let title = options.t || "";


  if (title.length) {
    filename = title
    document.title = title
  } else {
    document.title = "Emoji Wallpaper"
  }

  
  filename += "-" + sw / density + "x" + sh / density 
  + (density != 1 ? "@" + density + "x" : "") + ".png"
  
  // a.innerHTML = name + "<p>"
  a.download = filename;
  
  if (c.getAttribute("height") != sh) c.setAttribute("height", sh);
  if (c.getAttribute("width") != sw) c.setAttribute("width", sw);

  var ctx = c.getContext('2d');
  ctx.save()

  ctx.clearRect(0, 0, c.width/2, c.height);
  
  ctx.fillStyle = color || "#1e1e1e";
  ctx.lineWidth = 2 * density;
  ctx.fillRect(0,0,c.width,c.height);

  //   // Generate Linear Gradient
  //   var grd=ctx.createLinearGradient(0,40,0, c.height);
  //   grd.addColorStop(0,lightColor);
  //   grd.addColorStop(0.5,color);
  //   grd.addColorStop(1,darkColor);
  //   ctx.fillStyle=grd;
  //   ctx.fillRect(0,0,c.width,c.height);
  
  if (options.texture == 'flat') {
    ctx.fillStyle = color;
  } else {
    // Generate Raking Gradient
    var r2 = c.width * 2;
    var grd = ctx.createRadialGradient(
        c.width / 2, c.height - r2,
        r2, 
        c.width / 2, 0 - r2,
        r2);
    grd.addColorStop(0,darkColor);
    grd.addColorStop(0.5,color);
    grd.addColorStop(1,lightColor);
    ctx.fillStyle = grd;
  }
  ctx.fillRect(0,0, c.width, c.height);


  let pattern = options.pattern || 'foam';
  let size = Math.hypot(c.width, c.height) / 50;

  let scale = options.scale;
  size *= scale;
  let fontSize = parseFloat(options.fontSize) || size;

  let family = options.family;
  let font = "sans-serif";
  if (options.noto && options.noto.length) family = "Noto Color Emoji";
  else if (options.family && options.family.length) font = options.family;

  ctx.font = `${fontSize}px ${font}`;

  let margin = parseFloat(options.margin)/100
  if (isNaN(margin)) margin = 1.0;

  let marginX = size * 1.5 * margin;
  let marginY = size * 1.5 * margin;

  let width = c.width - marginX * 2;
  let height = c.height - marginY * 2;
  
  if (debug) ctx.strokeRect(marginX, marginY, width, height);
  if (debug) ctx.strokeRect(marginX, marginY, width, height);

  let spacingX = size;
  let spacingY = spacingX;
      
  ctx.lineWidth = 0.5
  ctx.textAlign = 'center'

  let order = options.order || 'random';

  ctx.globalAlpha = 0.95;
  if (options.texture == 'monochrome')
    ctx.globalCompositeOperation = "luminosity";
  ctx.shadowColor = 'rgba(0,0,0,0.05)';
  ctx.shadowOffsetY = size / 8;
  ctx.shadowBlur = size / 8;

  var lastEmoji = undefined;

  const randomEmoji = () => {
    let i = Math.floor(random() * emojis.length);

    if (emojis.length > 3 && i == lastEmoji) { 
      i += Math.ceil(random() * (emojis.length - 1))
      i %= emojis.length;
    }
    lastEmoji = i;
    return emojis[i];
  }

  const gridLayout = (emojis, options = {}) => {
    if (pattern == "diamond") {
      spacingX = size * 3 / 2;
      spacingY = spacingX / 3;
    }
    if (options.spacing && options.spacing.length) {
      spacingX *= options.spacing/100;
      spacingY *= options.spacing/100;
    }

    let cols = Math.round(width / (size + spacingX));
    let rows = Math.round(height / (size + spacingY));

    // Fit to the rect cleanly by fudging spacing
    spacingX *= (width -size/2) / (spacingX * cols);
    spacingY *= (height - size/2) / (spacingY * rows);
    
    if (pattern == "diamond" || pattern == "hex") {
      spacingX *= (width  - (size * (cols-1))) / (spacingX * (cols-1));
      spacingY *= (height - (size * (rows-1))) / (spacingY * (rows-1));
    } else {
      spacingX *= (width  - (size * (cols-1))) / (spacingX * (cols-1));
      spacingY *= (height - (size * (rows-1))) / (spacingY * (rows-1));
    }

    let stagger = pattern == "diamond" || pattern == "hex" || pattern == "random";

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        let staggerRow = stagger && y%2;
        if (staggerRow && x == cols - 1) continue;
        let emojiIndex = (x + y) % emojis.length
        let staggerX = staggerRow ? 0.5 : 0;
        let emoji = emojis[emojiIndex];

        if (order == 'random') {
          emoji = randomEmoji()
        }

        let randomScale = pattern == "random" ? 0.5 : 0.00;
        let rx = (random() - 0.5) * randomScale;
        let ry = (random() - 0.5) * randomScale;

        ctx.globalAlpha = 0.95;
        if (options.texture == 'monochrome')
          ctx.globalCompositeOperation = "luminosity";
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.shadowOffsetY = size / 8;
        ctx.shadowBlur = size / 8;

        ctx.save()
        ctx.translate(marginX + (spacingX + size) * (x + rx + staggerX), 
                      marginY + (spacingY + size) * (y + ry));
        
        let flip = false;
        if (order == 'alternating') {
          if (pattern == 'random') {
            flip = (random() < 0.5)
          } else {
            flip = y%2;
          }
        }
                        
        if (flip) {
          ctx.scale(-1, 1);
        }

        if (pattern == 'random') {
          ctx.rotate((random() - 0.5) * Math.PI/5)
        }

        if (debug) {
          ctx.strokeRect(-size/2, -size/2, size, size);
          ctx.strokeRect(-2, -2, 4, 4);
          ctx.globalAlpha = 0.2
          ctx.strokeRect(size/2, size/2, spacingX, spacingY);
        }
        ctx.fillText(emoji, 0, + size/3);
        ctx.restore();
      }
    }      
  }

  // Warning: computationally expensive.
  const foamLayout = (emojis, options = {}) => {
    var r;
    var maxSize = size * 2.5;
    var bubbs = [];
    var spacing = parseFloat(options.spacing)/100 || 0.0;
    console.log(spacing);
    for (var j = 0; j < 10000; j++) {
      let emoji = emojis[j % emojis.length];
      var x = random() * canvas.width;
      var y = random() * canvas.height;
      r = Math.min(x, canvas.width - x, y, canvas.height - y);
      // shrink radius by other extant bubble radii
      for (var i = 0; i < bubbs.length; i++) {
        r = Math.min(r, Math.hypot(x - bubbs[i].x, y - bubbs[i].y) - bubbs[i].r - size * spacing / 4);
        if (r < 5) break;
      }
      if (r < 5) {
        //if (debug) ctx.fillText("X", x, y);
        continue;
      }
      r = Math.min(maxSize, r);

      // we've got a good one
      bubbs.push({x:x, y:y, r:r, emoji:emoji});
    }

    bubbs.reverse();
    
    for (var i = 0; i < bubbs.length; i++) {
      var b = bubbs[i];
      ctx.save()
      ctx.translate(b.x, b.y);
      if (debug) {
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI*2, true);
        ctx.stroke();
        ctx.strokeRect(-2, -2, 4, 4);
        ctx.globalAlpha = 0.2
      }

      ctx.font = `${1.75*b.r}px ${font}`;

      if (order == 'alternating' || order == 'random') {
        ctx.scale(1 - 2*(i%2), 1);
      } 
      if (order == 'random') {
        ctx.rotate((random() - 0.5) * Math.PI/5)
      }

      if (options.pattern == 'many') {
        let scale = random()
        ctx.scale(1.5 + scale, 1.5 + scale);
        ctx.globalAlpha = 1.0;
      }

      ctx.fillText(b.emoji, 0, 0.6*b.r);
      ctx.restore();
    }
    //console.log(bubbs);
  }

  // Conceptually splits the canvas into a grid and lays out 2x2, 3x3, 4x4 emojis randomly
  // and fills any empty spaces with 1x1 emojis.
  const packingLayout = (emojis, options = {}) => {
    let cols = Math.ceil(width / size);
    let rows = Math.ceil(height / size);

    const sizes = [2, 3, 4];
    
    const bins = Array.from(Array(cols).keys()).map(i => {
      return new Array(rows).fill(false);
    });

    const randomSize = () => {
      return sizes[Math.floor(random() * sizes.length)]
    }
    const checkFittable = (bins, size, x, y) => {
      for (let ix = x; ix < x + size; ix++) {
        for (let iy = y; iy < y + size; iy++) {
          if (ix >= bins.length) {
            return false;
          }
          if (iy >= bins[ix].length) {
            return false;
          }
          if (bins[ix][iy] == true) {
            return false
          }
        }
      }
      return true
    }

    const fillBin = (bins, size, x, y) => {
      for (let ix = x; ix < x + size; ix++) {
        for (let iy = y; iy < y + size; iy++) {
          bins[ix][iy] = true;
        }
      }
    }


    let baseFontSize = (parseFloat(options.fontSize) || size);

    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.stroke = 'black'

    for (let x = 0; x < bins.length; x++) {
      for (let y = 0; y < bins[x].length; y++) {
        let occupied = bins[x][y]
        if (occupied) { continue; }

        let binSize = randomSize()
        let emoji = randomEmoji()

        // Try using the bin size that was randomly selected, if it doesn't fit
        // reduce size by one and try again.
        while (binSize > 0) {
          if (checkFittable(bins, binSize, x, y)) {
            fillBin(bins, binSize, x, y)
            const thisFontSize = baseFontSize * binSize;
            ctx.font = `${thisFontSize}px ${font}`;
            ctx.fillText(emoji, marginX + (x - 0.5) * size, marginY + (y + binSize) * size);
            //ctx.strokeRect(x * size, y * size, binSize * size, binSize * size)
            break
          }
          binSize -= 1
        }
      }
    }
  }

  // <em>r = c√n</em><br><em>θ = i × 137.5°</em>
  
  const spiralLayout = (emojis, options = {}, varyScale = false) => {

    var scale = size * 1.1,
    α = Math.PI * (3 - Math.sqrt(5));

    var maxRadius = Math.hypot(canvas.width/2, canvas.height/2)

    var spacing = parseFloat(options.spacing)/100 || 1.0;

    for (var i = 0; i < 100000; i++) {
        let emojiIndex = (i) % emojis.length
        let emoji = emojis[emojiIndex];
        if (order == 'random') {
          emoji = randomEmoji();
        }

        var r = Math.sqrt(i);
        if (varyScale) r = Math.pow(r/10, 2)*6;

        var a = i * α - elapsed/100000;

        if (scale*r*spacing > maxRadius) {
          break; 
        }

        let randomScale = pattern == "random" ? 1.0 : 0.00;
        let rx = (random() - 0.5) * randomScale;
        let ry = (random() - 0.5) * randomScale;

        var x = marginX + width / 2  + scale * r * Math.cos(a) * spacing + size * rx;
        var y = marginY + height / 2 + scale * r * Math.sin(a) * spacing + size * ry;
        
        if (x < -size || x > (width + marginX*2 + size)) continue;
        if (y < -size || y > (height + marginY*2 + size)) continue;

        ctx.save()
        if (i == 0) x+= size/2;//console.log(scale * r * Math.cos(a), scale * r * Math.sin(a))
        ctx.translate(x, y);
        let flip = false;
        if (order == 'alternating') {
          if (pattern == 'random') {
            flip = (random() < 0.5)
          } else {
            flip = i%2;
          }
        }
                        
        if (flip) {
          ctx.scale(-1, 1);
        }

        if (varyScale) {
          let rscale = Math.sqrt(r)/2;
          ctx.scale(rscale, rscale)
          ctx.globalAlpha = (r) / 10;
          ctx.rotate(a - Math.PI/2)
        }
        if (debug) {
          ctx.strokeRect(-size/2, -size/2, size, size);
          ctx.strokeRect(-2, -2, 4, 4);
          ctx.globalAlpha = 0.2
        }
  
          // ctx.fillText(emoji, 0, size * 0.375);
          
          ctx.drawImage(emojiCanvas[emojiIndex], -size, -size, size*2, size*2);
        
        ctx.restore();
      }
    }      
  
  let emojiString = document.querySelector('#emojiPicker').value || " ";
  let emojisRaw = runes(emojiString)
  let emojis = []

  let skinTones = ['\u{1F3FB}', '\u{1F3FC}', '\u{1F3FD}', '\u{1F3FE}', '\u{1F3FF}']
  for (var i = 0; i < emojisRaw.length; i++) {
    var emoji = emojisRaw[i];
    var nextEmoji = emojisRaw[i+1];
    if (skinTones.includes(nextEmoji)) {
      emoji = emoji + nextEmoji;
      i++;
    }
    emojis.push(emoji);
  }
  
  let iconSize = 160;
  emojiCanvas = emojis.map(emoji => {
    var imgcanvas = createCanvas(iconSize*2, iconSize*2);
    var imgctx = imgcanvas.getContext('2d');
    imgctx.clearRect(0, 0, iconSize, iconSize);
    imgctx.font = `${iconSize}px ${font}`;
    imgctx.textAlign = 'center'
    imgctx.fillText(emoji, imgcanvas.width/2, imgcanvas.height/2 + .375 * iconSize);
    return imgcanvas;
  })
  ctx.fillStyle = textColor;
  
  switch (pattern) {
    case 'hex':
    case 'diamond':
    case 'grid':
    case 'random':      
    {
      gridLayout(emojis, options);
      break;
    }

    case 'spiral':
    {
      spiralLayout(emojis, options);
      break;
    }
    case 'scalespiral':
      {
        let t1 = performance.now();
        spiralLayout(emojis, options, true);
        break;
      }
    case 'foam':
    case 'many':  
    {
      foamLayout(emojis, options);
      break;
    }
    case 'stacks': {
      packingLayout(emojis, options);
      break;
    }
      


    default: {
      gridLayout(emojis, options)
    }
  }


  

  // Generate Noise
  // var dt = ctx.getImageData(0,0, c.width, c.height);
  // var dd = dt.data, dl = dt.width * dt.height;
  // var p = 0, i = 0;
  // var intensity = 4;
  // for (; i < dl; ++i) {
  //   // var rand = Math.floor(random() * 2) - 1;
  //   dd[p++] += Math.round((random() - 0.5) * intensity);
  //   dd[p++] += Math.round((random() - 0.5) * intensity);
  //   dd[p++] += Math.round((random() - 0.5) * intensity);
  //   dd[p++] += 0 //255;
  // } 
  // ctx.putImageData(dt, 0, 0);
  vingette = options.texture != 'flat';
  if (vingette) {
    ctx.globalCompositeOperation = "hard-light";
    grd = ctx.createRadialGradient(
      c.width / 2, c.height/4,
      c.width/4, 
      c.width/2 , c.height/2 ,
      Math.hypot(c.width/2, c.height/2)*1.1);
  //  grd.addColorStop(0,darkColor);
  ctx.globalAlpha = 0.05
  grd.addColorStop(0.0,"rgba(0,0,0,0.0");
  grd.addColorStop(0.9,"rgba(0,0,0,0.8");
  grd.addColorStop(0.95,"rgba(0,0,0,0.9");
    grd.addColorStop(1.0,"rgba(0,0,0,1.0");
    ctx.fillStyle = grd;
    ctx.fillRect(0,0, c.width, c.height);
  }

  ctx.restore()

  if (fullbleed || time) return;

  c.toBlob(function(blob) {
    var date = new Date()
    window.URL.revokeObjectURL(blobURL);
    blobURL = window.URL.createObjectURL(blob);
    a.href = blobURL;
  });
}

var blobURL = undefined

function changeListeners() {
  updateForm();
  let form = document.getElementById("form");
  form.onchange = render;

  if (size = localStorage.getItem("size")) {
    form.elements["sizePicker"].value = size;
  }

  document.querySelectorAll('.swatch').forEach(e => {
    e.style.backgroundColor = e.value;
    e.addEventListener('click', e => {
      setColor(e.target);
    })
  });

  var emojiPicker = document.querySelector('#emojiPicker') 
    emojiPicker.addEventListener('input', e => {
    render();
  })

}

var shouldAnimate = false;
function startAnimation() {
  console.log("animate")
  shouldAnimate = !shouldAnimate;
  window.requestAnimationFrame(renderFrame);
}

function setFullbleed() {
  fullbleed = true;
  document.body.classList.add('fullscreen');
  window.onresize = renderAfterDelay;
}

let renderTimeout;

function renderAfterDelay() {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(render, 100);
}

if (inIframe()) {
  setFullbleed();
}


changeListeners()
render();
document.body.classList.remove('loading');

if (window.obsstudio) {
  document.body.classList.add('fullscreen')
  startAnimation()
}

document.fonts.ready.then(function () { 
  console.log("fonts loaded")  
});

function toggleAdvanced() {
  document.body.classList.toggle("advanced")
}

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}



//
// Color Functions
//

function hexToRGB(hex) {
  var c = hex.substring(1);      // strip #
  var rgb = parseInt(c, 16);   // convert rrggbb to decimal
  var r = (rgb >> 16) & 0xff;  // extract red
  var g = (rgb >>  8) & 0xff;  // extract green
  var b = (rgb >>  0) & 0xff;  // extract blue
  return [r,g,b]; 
}

function luminance(rgb) {
  var luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];  
  var luma2 = rgb2lab(rgb);
  return luma;
}

function contrastColor(hex, shift) {
  var rgb = hexToRGB(hex);
  var lab = rgb2lab(rgb);
  
  if (shift) {
    lab[0] += shift;
  } else if (lab[0]< 40) {
    lab[0] += 25;
  } else {
    lab[0] -= 25;
  }
  rgb = lab2rgb(lab);
  var hsl = rgbToHsl(rgb);
  rgb[0] = Math.round(rgb[0]);
  rgb[1] = Math.round(rgb[1]);
  rgb[2] = Math.round(rgb[2]);
  
  hsl[0] = Math.round(hsl[0] * 360);
  hsl[1] = Math.round(hsl[1] * 100);
  hsl[2] = Math.round(hsl[2] * 100);
  return "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)" 
}

function lab2rgb(lab){
  var y = (lab[0] + 16) / 116,
      x = lab[1] / 500 + y,
      z = y - lab[2] / 200,
      r, g, b;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return [Math.max(0, Math.min(1, r)) * 255, 
          Math.max(0, Math.min(1, g)) * 255, 
          Math.max(0, Math.min(1, b)) * 255]
}

function rgb2lab(rgb){
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

function rgbToHsl(rgb) {
  var r = rgb[0], g = rgb[1], b = rgb[2];
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, l ];
}