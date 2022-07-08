
export default async (request, context) => {
  const ua = request.headers.get("user-agent");
  let url = new URL(request.url);
  let query = url.search.substring(1);
  if (ua?.indexOf("Twitterbot") == -1) {
    return Response.redirect(query);
  }
  let res = await fetch(query)
  return new Response(res.body, { headers:res.headers });
}
