export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        ok: true,
        service: "syria-commerce",
        time: new Date().toISOString()
      });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Syria Commerce is running.", {
      headers: { "content-type": "text/plain; charset=UTF-8" }
    });
  }
};
