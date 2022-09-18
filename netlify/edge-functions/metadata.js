function decodePrettyComponent(s) {
  let replacements = {'---': ' - ', '--': '-','-' : ' '}
  return decodeURIComponent(s.replace(/-+/g, e => replacements[e] ?? '-'))
}

const emojiUrl = (codePoint) => {
  let cp = codePoint.split("-").filter(x => x !== "fe0f").map(s => s.padStart(4,"0")).join("_");
  return `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/512/emoji_u${cp}.png`
}

const mixmojiUrl = (r, c, proxy, url) => {
  let padZeros = r < 20220500; // Revisions before 0522 had preceding zeros
  c[0] = c[0].split(/-/g).map(s => padZeros ? s.padStart(4,"0") : s).join("-u");
  c[1] = c[1].split(/-/g).map(s => padZeros ? s.padStart(4,"0") : s).join("-u");
  return `${proxy ? url.origin: 'https://www.gstatic.com/android/keyboard/'}/emojikitchen/${r}/u${c[0]}/u${c[0]}_u${c[1]}.png`
}

export default async (request, context) => {
  try {
    let url = new URL(request.url);
    if (!url.pathname.endsWith("/") || url.search.indexOf("&") != -1 ) {
      return; 
    }

    const ua = request.headers.get("user-agent");
    if (!ua) return;
    let metadataBots = [ "Twitterbot", "curl", "facebookexternalhit", "Slackbot-LinkExpanding", "Discordbot", "snapchat"]
    let isMetadataBot = metadataBots.some(bot => ua.indexOf(bot) != -1);
    if (!isMetadataBot) return;
    
    let search = url.search.substring(1);
    if (!search.length) return;
    let date;
    [search, date] = search.split("=");
    let components = search.split("+");

    let chars = components.map(c => Array.from(decodeURIComponent(c)));
    components = chars.map(c => c.map(a=>a.codePointAt(0).toString(16)).join("-"));
    
    let info = {
      s: "Emoji Kitchen Browser"
    }
    
    let isTwitter = ua.indexOf("Twitterbot") != -1 && ua.indexOf("facebookexternalhit") == -1;

    if (components.length > 1 && date) {
      date = 20200000 + parseInt(date,36);
      info.i = mixmojiUrl(date, components, isTwitter, url);
    } else {
      info.i = emojiUrl(components[0]);
    }
    info.title = chars.join(" + ").replace(",", "");// + " - " + info.s;

    console.log(chars.join("+"))
    
    let content = ['<meta charset="UTF-8">'];
    if (info.title) { content.push(`<title>${info.title}</title>`,`<meta property="og:title" content="${info.title}"/>`); }
    if (info.s) { content.push(`<meta property="og:site_name" content="${info.s}"/>`); }
    if (info.t) { content.push(`<meta property="og:type" content="${info.t}"/>`); }
    if (info.d) { content.push(`<meta property="og:description" content="${info.d}"/>`,`<meta name="description" content="${info.d}"/>`); }
    if (info.i) { 
      if (!info.i.startsWith("http")) info.i = atob(info.i.replace(/=/g,''));
      content.push(`<meta property="og:image" content="${info.i}"/>`); 
      if (ua?.indexOf("Twitterbot") != -1) {
        content.push(`<meta name="twitter:card" content="summary">`);
      } else {
        content.push(`<meta name="twitter:card" content="summary_large_image">`);
      }
      if (info.iw) content.push(`<meta property="og:image:width" content="${info.iw}"/>`); 
      if (info.ih) content.push(`<meta property="og:image:width" content="${info.ih}"/>`); 
    } 
    if (info.c) { content.push(`<meta name="theme-color" content="#${info.c}"/>`); }
    if (info.v) { 
      if (!info.v.startsWith("http")) info.v = atob(info.v.replace(/=/g,''));
      content.push(`<meta property="og:video" content="${info.v}"/>`); 
      if (info.vw) content.push(`<meta property="og:image:width" content="${info.vw}"/>`); 
      if (info.vh) content.push(`<meta property="og:image:width" content="${info.vh}"/>`); 
    } 
    if (info.f) {
      if (info.f.length > 9){
        if (!info.f.startsWith("http")) info.f = atob(info.f.replace(/=/g,''));
        content.push(`<link rel="icon" type="image/png" href="${info.f}">`);
      } else {
        let codepoints = Array.from(info.f).map(c => c.codePointAt(0).toString(16));
        content.push(`<link rel="icon" type="image/png" href="https://fonts.gstatic.com/s/e/notoemoji/14.0/${codepoints.join("_")}/128.png">`);
      }
    }
    return new Response(content.join("\n"), {
      headers: { "content-type": "text/html" },
    });
  } catch (e) {console.log(e)}
} 
