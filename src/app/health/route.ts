export async function GET(): Promise<Response> {
  return Response.json(
    {
      status: "ok",
      service: "ecs-qc",
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
