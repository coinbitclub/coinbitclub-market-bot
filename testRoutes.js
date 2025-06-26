import axios from "axios";
import jwt from "jsonwebtoken";

async function main() {
  const baseUrl = process.argv[2] || "http://localhost:3000";
  const secret  = process.env.WEBHOOK_JWT_SECRET;
  if (!secret) {
    console.error("? WEBHOOK_JWT_SECRET não definido");
    process.exit(1);
  }
  const token   = jwt.sign({}, secret, { algorithm: "HS256" });
  const headers = { Authorization: `Bearer ${token}` };

  const routes = [
    { method: "GET",  path: "/" },
    { method: "GET",  path: "/healthz" },
    { method: "GET",  path: "/fetch/market",     headers },
    { method: "GET",  path: "/fetch/dominance",  headers },
    { method: "GET",  path: "/fetch/fear_greed", headers },
    { method: "POST", path: "/webhook/signal?token=" + token },
    { method: "POST", path: "/webhook/dominance?token=" + token },
    { method: "POST", path: "/webhook/fear_greed?token=" + token },
    { method: "GET",  path: "/metrics" }
  ];

  for (const r of routes) {
    try {
      console.log(`\n--- ${r.method} ${r.path} ---`);
      const resp = await axios({ method: r.method.toLowerCase(), url: `${baseUrl}${r.path}`, headers: r.headers });
      if (r.path === "/metrics") {
        console.log(resp.data.split("\n").filter(l => l.startsWith("process_")).join("\n"));
      } else {
        console.log(resp.data);
      }
    } catch (err) {
      console.error(`ERROR ${err.response?.status}:`, err.response?.data || err.message);
    }
  }
}

main();
