export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // รองรับ CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers
      });
    }

    // ตรวจสอบ API
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

    // วิเคราะห์ภาพ
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

        // รองรับชื่อ image หรือ imageData
        const imageData = body.image || body.imageData;

        if (!imageData) {
          return new Response(
            JSON.stringify({
              error: "ไม่พบรูปภาพที่ส่งมา"
            }),
            {
              status: 400,
              headers
            }
          );
        }

        const prompt = `
คุณคือ JSD HUNTER AI ผู้เชี่ยวชาญด้านการวิเคราะห์กราฟ XAUUSD

วิเคราะห์ภาพกราฟที่ผู้ใช้ส่งมา โดยใช้แนวคิด:

1. Market Structure
2. Trend
3. BOS
4. CHoCH
5. Liquidity
6. Buy Side Liquidity
7. Sell Side Liquidity
8. Premium / Discount
9. Order Block
10. Fair Value Gap
11. Fibonacci OTE

สรุปผลให้เข้าใจง่าย โดยระบุ:

- แนวโน้มหลัก
- โครงสร้างตลาด
- จุด Liquidity
- จุดเข้า Buy หรือ Sell
- Stop Loss
- Take Profit
- จุดที่ควรรอ
- ความเสี่ยง
- เหตุผลในการวิเคราะห์

ตอบเป็นภาษาไทยแบบชัดเจน
        `;

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: prompt
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageData
                      }
                    }
                  ]
                }
              ],
              max_tokens: 2000
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              error: data?.error?.message || "เกิดข้อผิดพลาดจาก OpenAI",
              details: data
            }),
            {
              status: response.status,
              headers
            }
          );
        }

        const result =
          data?.choices?.[0]?.message?.content ||
          "ไม่สามารถวิเคราะห์ภาพได้";

        return new Response(
          JSON.stringify({
            success: true,
            result: result
          }),
          {
            status: 200,
            headers
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error.message || "เกิดข้อผิดพลาดในการวิเคราะห์"
          }),
          {
            status: 500,
            headers
          }
        );
      }
    }

    // ไม่พบ Endpoint
    return new Response(
      JSON.stringify({
        error: "Not Found"
      }),
      {
        status: 404,
        headers
      }
    );
  }
};
