// 处理Chrome DevTools的自动工作区请求，避免404错误
export async function GET() {
  return new Response(JSON.stringify({
    message: 'Chrome DevTools request ignored'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
