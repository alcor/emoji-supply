let debug = false;

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

var timer;

function updateForm() {
  let form = document.getElementById("form");
  let paramsString = window.location.search.substring(1);
  let params = new URLSearchParams(paramsString);
  let entries = params.entries();
  for (var [k, v] of entries) {
    let input = form.elements[k];
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

  // This works around a bug in apple's url detection that can't handle a whole mess of encoded unicode characters
  params.set("emoji", encodeURIComponent(params.get("emoji")))
  history.replaceState(undefined, undefined, "?" + params.toString())
}




function setColor(e) {
  console.log("e", e)
  let color = e.value || e.getAttribute("value");
  console.log("setcolor", color)
  document.getElementById("colorPicker").value = color
  //document.getElementById("textPicker").value = color
  clearTimeout(timer);
  timer = setTimeout(render, 300);
}

var ua = navigator.userAgent;
var isMac = /Macintosh/.test(ua)
var isWin = /Windows/.test(ua)
var iOS = /iPad|iPhone|iPod/.test(ua)
var a = document.createElement("a");
var c = document.createElement("canvas");

if (iOS) {
  //document.getElementById("textPicker").style.display = "none"
}

function render() {
  updateURL();
  let options = Object.fromEntries(new URLSearchParams(location.search));


  let form = document.getElementById("form");
  let data = new FormData(form);

  let color = data.get('color');
  var lightColor = contrastColor(color, 10);
  var darkColor = contrastColor(color, -5);
  var textColor = contrastColor(color)
  var density = window.devicePixelRatio;
  var sh = screen.height, sw = screen.width;
  if (iOS && Math.abs(window.orientation) == 90) {
    [sw, sh] = [sh, sw]
  }
  
  sw *= density;
  sh *= density;

  let sizeString = document.querySelector('#sizePicker').value || "*";
  localStorage.setItem("size", sizeString)

  if (sizeString != "*") {
    let sizes = sizeString.split("x");
    sw = sizes[0]
    sh = sizes[1] || sw
    density = 2;
  }

  var name = "emoji-" + color.replace("#","") + "-"
  + sw / density + "x" + sh / density 
  + (density != 1 ? "@" + density + "x" : "") + ".png"
  
  a.innerHTML = name + "<p>"
  a.download = name;
  
  c.setAttribute("height", sh);
  c.setAttribute("width", sw);
  a.appendChild(c); 
  document.body.appendChild(a);
  var fontSize = 10 * density;
  var ctx = c.getContext('2d');
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
  ctx.fillRect(0,0, c.width, c.height);
  
  const gridLayout = (emojis, options = {}) => {

    let pattern = options.pattern || 'diamond';
    let size = Math.hypot(c.width, c.height) / 50;

    let scale = options.scale;
    size *= scale;
    ctx.font = size + "px sans-serif";
    let marginX = size*1.5;
    let marginY = size*1.5;

    let width = c.width - marginX * 2;
    let height = c.height - marginY * 2;
    
    let spacingX = size;
    let spacingY = spacingX;

    if (pattern == "diamond") {
      spacingX = size * 3 / 2;
      spacingY = spacingX / 3;
    }
    
    let cols = Math.round(width / (size + spacingX));
    let rows = Math.round(height / (size + spacingY));
    
    ctx.lineWidth = 0.5
    ctx.textAlign = 'center'

    if (debug) ctx.strokeRect(marginX, marginY, width, height);

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

    ctx.fillStyle = textColor;

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        let staggerRow = stagger && y%2;
        if (staggerRow && x == cols - 1) continue;
        let emojiIndex = (x + y) % emojis.length
        let staggerX = staggerRow ? 0.5 : 0;
        let emoji = emojis[emojiIndex];
        emoji = emojis[Math.floor(Math.random() * emojis.length)]

        let randomScale = pattern == "random" ? 0.5 : 0.00;
        let rx = (Math.random() - 0.5) * randomScale;
        let ry = (Math.random() - 0.5) * randomScale;

        ctx.globalAlpha = 0.95;
        //ctx.globalCompositeOperation = "luminosity";
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.shadowOffsetY = size / 8;
        ctx.shadowBlur = size / 8;

        ctx.save()
        ctx.translate(marginX + (spacingX + size) * (x + rx + staggerX), 
                      marginY + (spacingY + size) * (y + ry));
        if (y%2 && emojis.length == 1 && (pattern == 'diamond')) ctx.scale(-1, 1);

        if (pattern == 'random')
          ctx.rotate((Math.random() - 0.5) * Math.PI/4)

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

  let emojiString = document.querySelector('#emojiPicker').value || " ";
  let emojis = runes(emojiString)
  
  ctx.fillStyle = "black";
  
  let pattern = document.querySelector('#patternPicker').value || 'hex';

  console.log(options)
  switch (pattern) {
    case 'hex':
    case 'diamond':
    case 'random':
    case 'grid':
    {
      gridLayout(emojis, options);
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
  //   // var rand = Math.floor(Math.random() * 2) - 1;
  //   dd[p++] += Math.round((Math.random() - 0.5) * intensity);
  //   dd[p++] += Math.round((Math.random() - 0.5) * intensity);
  //   dd[p++] += Math.round((Math.random() - 0.5) * intensity);
  //   dd[p++] += 0 //255;
  // } 
  // ctx.putImageData(dt, 0, 0);
  
  var blob = c.toBlob(function(blob) {
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
changeListeners()
  

render();

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