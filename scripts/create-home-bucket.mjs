// 创建 home-covers bucket (public)
const URL = "https://ozshflujnxonhfwdtunp.supabase.co";
const KEY = "sb_secret_fEejBwkVXXUUvx-zefAomA_Yqtko1zS";

async function main() {
  // 先看下 bucket 是否已存在
  const list = await fetch(`${URL}/storage/v1/bucket`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const buckets = await list.json();
  console.log("Existing buckets:", buckets.map(b => b.id));

  if (buckets.find(b => b.id === "home-covers")) {
    console.log("home-covers already exists, skip");
    return;
  }

  const r = await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: "home-covers",
      name: "home-covers",
      public: true,
      file_size_limit: 10485760,
    }),
  });
  const t = await r.text();
  console.log("Create bucket status:", r.status, t);
}

main().catch(e => { console.error(e); process.exit(1); });
