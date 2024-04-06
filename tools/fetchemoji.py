#! python3

from urllib.parse import quote
import json

import requests

api_url_format = "https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v6&q={}_{}"

with open("fetchemoji.txt") as f:
    emojis = set(f.read().strip().splitlines())
    emojis2 = emojis.copy()

urls = set()
multichar_ord = lambda s: '-'.join(map(lambda c: f"{ord(c):x}", (s)))

def check(emoji1, emoji2):
    api_url = api_url_format.format(quote(emoji1), quote(emoji2))
    data = requests.get(api_url).json()
    results = data["results"]
    if not results:
        print(f" {multichar_ord(emoji1)}_{multichar_ord(emoji2)} ({emoji1} + {emoji2})")
        return None
    print(f"✅ {multichar_ord(emoji1)}_{multichar_ord(emoji2)} ({emoji1} + {emoji2})")
    
    url = results[0]["media_formats"]["png_transparent"]["url"]
    fp = url.split('/')[-1]
    if fp in urls:
        print("  + duplicate")
    return url

for emoji1 in emojis:
    for emoji2 in emojis2:
        try:
            url = check(emoji1, emoji2)
            if url:
                urls.add(url)
        except BaseException:
            url = check(emoji1, emoji2)
            if url:
                urls.add(url)

    emojis2.remove(emoji1) #remove the last checked emoji to avoid duplicates

    with open("fetchemoji.json", "w") as f:
        json.dump(list(urls), f, indent=2)
