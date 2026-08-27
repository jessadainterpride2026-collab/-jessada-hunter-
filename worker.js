export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers
      });
    }

    // ตรวจสอบสถานะ API
    if (url.pathname === "/" || url.pathname === "/api/status") {
      return new Response(
        JSON.stringify({
          status: "online",
          message: "JSD HUNTER API is running"
        }),
        {
          status: 200,
          headers
        }
      );
    }

    // วิเคราะห์ข้อความ
    if (url.pathname === "/api/analyze" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!env.OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({
              error: "OPENAI_API_KEY is not configured"
            }),
            {
              status: 500,
              headers
            }
          );
        }

        const response = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-5-mini",
              input: body.message || "วิเคราะห์กราฟนี้"
            })
          }
        );

        const data = await response.json();

        return new Response(
          JSON.stringify(data),
          {
            status: response.status,
            headers
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error.message
          }),
          {
            status: 500,
            headers
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "Not found"
      }),
      {
        status: 404,
        headers
      }
    );
  }
};
