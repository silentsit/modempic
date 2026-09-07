/**
 * Converts WooCommerce i18n/states.php into checkout-subdivisions.json.
 * Source: https://github.com/woocommerce/woocommerce (GPL-2.0+)
 */
import { writeFileSync } from "node:fs"

const SOURCE =
  "https://raw.githubusercontent.com/woocommerce/woocommerce/trunk/plugins/woocommerce/i18n/states.php"
const OUT = new URL("../src/lib/checkout/checkout-subdivisions.json", import.meta.url)

const php = await fetch(SOURCE).then((res) => {
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.text()
})

/** @type {Record<string, Array<{ code: string; name: string }>>} */
const byCountry = {}
let current = ""

for (const rawLine of php.split(/\r?\n/)) {
  const line = rawLine.trim()
  const empty = line.match(/^'([A-Z]{2})'\s*=>\s*array\(\s*\),/)
  if (empty) {
    current = ""
    continue
  }
  const start = line.match(/^'([A-Z]{2})'\s*=>\s*array\s*\(/)
  if (start) {
    current = start[1]
    byCountry[current] = []
    continue
  }
  if (!current) continue
  const state = line.match(/^'([^']+)'\s*=>\s*(?:__|_x)\(\s*'((?:\\'|[^'])*)'/)
  if (state) {
    byCountry[current].push({
      code: state[1],
      name: state[2].replace(/\\'/g, "'")
    })
  }
}

for (const [code, list] of Object.entries(byCountry)) {
  if (!list.length) delete byCountry[code]
}

const countryCount = Object.keys(byCountry).length
const stateCount = Object.values(byCountry).reduce((sum, list) => sum + list.length, 0)
if (countryCount < 50 || stateCount < 500) {
  throw new Error(`Unexpected parse size: ${countryCount} countries, ${stateCount} states`)
}
if (!byCountry.US?.some((entry) => entry.code === "GA")) {
  throw new Error("US list is missing Georgia (GA). Check _x() parsing.")
}

writeFileSync(OUT, `${JSON.stringify(byCountry)}\n`)
console.log(`Wrote ${countryCount} countries / ${stateCount} subdivisions`)
