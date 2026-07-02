import puppeteer from "puppeteer";
(async () => {
  console.log("Launching puppeteer...");
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", error => console.log("PAGE ERROR:", error.message));
  await page.goto("http://localhost:8080/");
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
