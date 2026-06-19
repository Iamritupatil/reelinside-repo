import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" })
await page.waitForTimeout(700)
await page.screenshot({ path: "shot.png", fullPage: true })
await browser.close()
console.log("done")
