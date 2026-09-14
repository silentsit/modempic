/**
 * Apply Description-tab bodyHtml + SEO for Nervigesic 300 mg.
 * From web/: npx tsx scripts/apply-pregabalin-description.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { sanitizeProductBodyHtml } from "../src/lib/product-html";

function bootstrapEnvFromFiles() {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const fp = path.join(root, name);
    if (!fs.existsSync(fp)) continue;
    const txt = fs.readFileSync(fp, "utf8").replace(/^\uFEFF/, "");
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

bootstrapEnvFromFiles();
const prisma = new PrismaClient();

const SLUG = "buy-lyrica-pregabalin-nervigesic-300-mg";

const IMG = {
  box: "https://res.cloudinary.com/df923uv8w/image/upload/v1789362068/modempic/products/buy-lyrica-pregabalin-nervigesic-300-mg/00-main-box-blister.jpg",
  front:
    "https://res.cloudinary.com/df923uv8w/image/upload/v1789362069/modempic/products/buy-lyrica-pregabalin-nervigesic-300-mg/01-front-box-blister.jpg",
  foil: "https://res.cloudinary.com/df923uv8w/image/upload/v1789362070/modempic/products/buy-lyrica-pregabalin-nervigesic-300-mg/02-box-blister-foil.jpg",
  blister:
    "https://res.cloudinary.com/df923uv8w/image/upload/v1789362070/modempic/products/buy-lyrica-pregabalin-nervigesic-300-mg/03-box-and-blister.jpg",
};

function ext(href: string, label: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function intern(href: string, label: string): string {
  return `<a href="${href}">${label}</a>`;
}

function img(src: string, alt: string): string {
  return `<p><img src="${src}" alt="${alt}" loading="lazy" decoding="async" /></p>`;
}

function cite(...nums: number[]): string {
  return nums.map((n) => `<sup><a href="#ref-${n}">[${n}]</a></sup>`).join("");
}

const DAILYMED =
  "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d4734e7d-5079-455e-8ff5-8f4539c998a9";
const MEDLINE = "https://medlineplus.gov/druginfo/meds/a605045.html";
const MAYO = "https://www.mayoclinic.org/drugs-supplements/pregabalin-oral-route/description/drg-20067411";
const DEA_V =
  "https://www.federalregister.gov/documents/2005/07/28/05-15036/schedules-of-controlled-substances-placement-of-pregabalin-into-schedule-v";

const SEO_TITLE = "Buy Pregabalin Online";
const SEO_DESC =
  "Buy Pregabalin Online as Nervigesic 300 mg: 30, 60, or 90 capsule packs at $105, $195, or $255. Live USD prices, card or crypto checkout. Import rules vary.";
const SHORT_DESC =
  "Buy pregabalin online as Nervigesic 300 mg in 30, 60, and 90 capsule packs. Live USD checkout. Import rules vary by jurisdiction.";
const LONG_DESC =
  "Buy pregabalin online on this page as Nervigesic 300 mg capsules. Choose a 30, 60, or 90 pack. This is catalog copy, not medical advice. Pregabalin is a prescription medicine in many countries, and legal status and import rules vary by jurisdiction.";

function bodyHtml(): string {
  return `
<h2 id="introduction">Introduction</h2>
<p>Buy pregabalin online on this page as Nervigesic 300 mg capsules. The live checkout prices are $105 for 30, $195 for 60, and $255 for 90. Those figures sit in the buy box before you pay.</p>
<p>This tab is catalog copy and US-label education, not medical advice. In the United States, pregabalin (the generic name for Lyrica) is a Schedule V prescription medicine, not an opioid.${cite(1, 4)} Other countries set their own rules. Checkout does not ask for a prescription upload. That is a storefront rule, not a legal clearance.</p>

<h2 id="on-this-page">On this page</h2>
<ul>
<li><a href="#introduction">Introduction</a></li>
<li><a href="#what-it-is">What this listing actually is</a></li>
<li><a href="#used-for">What Lyrica and pregabalin are used for</a></li>
<li><a href="#dosage">Dosage forms on the US label</a></li>
<li><a href="#safety">Controlled substance, opioids, and side effects</a></li>
<li><a href="#buying-online">Buying, shipping, and checkout</a></li>
<li><a href="#pricing">Price, pack sizes, and catalog math</a></li>
<li><a href="#compare">Lyrica, Nervigesic, and other strengths</a></li>
<li><a href="#questions">Frequently asked questions</a></li>
<li><a href="#conclusion">Conclusion</a></li>
<li><a href="#references">References</a></li>
</ul>

<h2 id="what-it-is">What this listing actually is</h2>
${img(IMG.box, "Buy pregabalin online as Nervigesic 300 mg carton and blister")}
<p>This is the only published anti-epileptic SKU on Modempic right now. The other 17 published products are Modafinil, Armodafinil, or combos of those. If you opened this page looking for a wake drug, you are on the wrong listing.</p>
<p>Nervigesic 300 mg is a brand of pregabalin capsules. Lyrica is the US brand name for the same listed active ingredient.${cite(1, 2)} One capsule is 300 mg. The US ${ext(DAILYMED, "Lyrica prescribing information")} also lists 25, 50, 75, 100, 150, 200, and 225 mg capsules.${cite(1)}</p>
<p>The buy box on this page says "pills." The dosage form is capsules.</p>
<p>The product record has no manufacturer field. Indian trade listings for Nervigesic often name Signature Phytochemical Industries. That is a trade-listing claim, not a batch certificate on this page. The brand spelling here is Nervigesic. Nervisegic is a common mistype. It is not the name on the pack.</p>

<h2 id="used-for">What Lyrica and pregabalin are used for</h2>
${img(IMG.front, "Nervigesic 300 mg pregabalin capsules carton")}
<p>${ext(MEDLINE, "MedlinePlus")} lists pregabalin capsules for neuropathic pain from diabetic nerve damage and postherpetic neuralgia, nerve pain after a spinal cord injury, fibromyalgia, and add-on treatment for certain partial-onset seizures.${cite(2)} The US Lyrica label matches those five adult uses. The seizure use also covers pediatric patients from 1 month of age.${cite(1)}</p>
<p>Pregabalin is an anticonvulsant. MedlinePlus describes the action as decreasing the number of pain signals sent out by damaged nerves.${cite(2)} ${ext(MAYO, "Mayo Clinic")} calls it an anticonvulsant and neuropathic pain agent that works in the central nervous system.${cite(3)}</p>
<p>This page does not add a sixth labeled use for ordinary muscle aches.</p>

<h2 id="dosage">Dosage forms on the US label</h2>
<p>US labeling for adult indications starts at 150 mg per day, usually in two or three divided doses.${cite(1)} 300 mg per day is the labeled maximum for diabetic peripheral neuropathy pain. Some other adult indications allow 450 mg or 600 mg per day. The dose is cut when kidney function is reduced.${cite(1, 3)}</p>
<p>A 300 mg capsule is one labeled strength. It is not "take one of these once a day." Capsules and oral solution are usually taken two or three times a day, with or without food.${cite(2)} This page does not pick a dose for you.</p>
<p>MedlinePlus warns that pregabalin may be habit forming. Stopping suddenly can bring trouble sleeping, nausea, diarrhea, headache, or seizures. The usual labeled instruction is to taper over at least one week.${cite(1, 2)}</p>

<h2 id="safety">Controlled substance, opioids, and side effects</h2>
${img(IMG.foil, "Pregabalin 300 mg Nervigesic blister foil and carton")}
<p>Yes. In the United States, pregabalin is a controlled substance. The ${ext(DEA_V, "DEA placed pregabalin in Schedule V")} on 28 July 2005 (70 FR 43633).${cite(4)} DailyMed still marks Lyrica as CV.${cite(1)} Schedule V is the lowest US abuse schedule. It is still a schedule.</p>
<p>No. Lyrica is not an opioid and not a narcotic. It is an anticonvulsant.${cite(1, 3)} The schedule exists because abuse may lead to limited physical or psychological dependence relative to Schedule IV substances, and because some patients report euphoria.${cite(4)}</p>
<p>DailyMed lists dizziness, somnolence, dry mouth, edema, blurred vision, weight gain, and thinking abnormal (mostly trouble with concentration) as the most common adult reactions at or above 5% and twice placebo.${cite(1)} The label also warns about angioedema, hypersensitivity, suicidal thoughts or behavior, respiratory depression with other CNS depressants or in people with lung disease, and stopping too fast.${cite(1)}</p>
<p>Modempic does not screen buyers and does not write prescriptions. Anyone with kidney disease, a seizure history, pregnancy or breastfeeding questions, or a stacked sedative regimen should talk to a licensed clinician before ordering. The US label states that breastfeeding is not recommended.${cite(1)}</p>

<h2 id="buying-online">Buying, shipping, and checkout</h2>
${img(IMG.blister, "Buy Lyrica generic Nervigesic 300 mg pack")}
<p>You can check out on this page without uploading a clinic letter. That does not make import lawful where you live. In the US, distributing a Schedule V prescription medicine without a valid prescription is unlawful.${cite(1, 4)} We do not give legal advice for your address.</p>
<p>Payment is a card on CardToUSDT or cryptocurrency on Paymento. The steps sit on ${intern("/how-to-pay", "How to Pay")}. Guest checkout uses the email you enter.</p>
<p>Every paid order ships by express mail at no shipping charge. Orders are processed within 12 hours of payment confirmation. Typical delivery is 2–7 business days to the USA, Canada, the UK, and Australia. Those are estimates. Customs can add time. The notes are on ${intern("/shipping", "Shipping")}. This SKU is the only card in the ${intern("/shop/anti-epileptic", "anti-epileptic category")}.</p>
<p>A price that undercuts every other listing by a wide gap is a warning, not a bargain. Counterfeit and diverted pregabalin exist because the molecule is scheduled in several markets.</p>

<h2 id="pricing">Price, pack sizes, and catalog math</h2>
<p>These are the current Modempic checkout prices for this SKU, in USD. They can change. They are first-party catalog figures, not a scraped pharmacy average.</p>
<table>
<thead><tr><th>Pack</th><th>Checkout price</th><th>Per capsule</th><th>Vs buying 30s</th></tr></thead>
<tbody>
<tr><td>30 capsules</td><td>$105</td><td>$3.50</td><td>base pack</td></tr>
<tr><td>60 capsules</td><td>$195</td><td>$3.25</td><td>$15 less than two 30-packs ($210)</td></tr>
<tr><td>90 capsules</td><td>$255</td><td>$2.83</td><td>$60 less than three 30-packs ($315)</td></tr>
</tbody>
</table>
<p>Five Modafinil 200 mg SKUs share the cheapest 30-count on this catalog at $49: Modactive, Modaheal, Modawake, Modavinil, and Modvigil. This 30-count is $105. That is $56 more, about 2.1 times that floor.</p>
<p>The next 30-count steps on this catalog are $50, then $55, then $59 (Modalert 200 mg and Waklert 150 mg sit on the $59 row). Pregabalin is a different molecule. The gap is the price of this SKU, not a discount off those wake-drug rows. We do not have a US pharmacy cash price for branded Lyrica. We will not invent one.</p>

<h2 id="compare">Lyrica, Nervigesic, and other strengths</h2>
<p>Lyrica and Nervigesic are two brand names for pregabalin. They are not two different drugs. Lyrica is the US reference brand on DailyMed (packager listed there as Viatris Specialty LLC).${cite(1)} Nervigesic is the Indian generic brand on this listing. Bioequivalence for a specific batch is a regulatory file, not a slogan.</p>
<p>This catalog lists one pregabalin SKU: Nervigesic 300 mg. We do not sell 75 mg or 150 mg here. If you need a different labeled strength, this cart is the wrong cart.</p>
<p>Pregabalin is not gabapentin. People compare them because both are gabapentinoids used for nerve pain. This page does not sell gabapentin and does not pick a winner.</p>

<h2 id="questions">Frequently asked questions</h2>
<h3>Can I buy pregabalin online without a prescription?</h3>
<p>Yes, you can check out here without uploading one. That does not make the purchase lawful in every country. In the US, pregabalin is a prescription Schedule V medicine.${cite(1, 4)}</p>
<h3>Can you buy Lyrica online?</h3>
<p>Yes, as a catalog checkout for a pregabalin brand. This page sells Nervigesic 300 mg, not a Pfizer or Viatris Lyrica blister.</p>
<h3>Is it legal to buy Lyrica or pregabalin online?</h3>
<p>There is no single answer. US labeling and scheduling are not a worldwide license. This storefront does not certify legality for your address and does not offer legal advice.</p>
<h3>What is Lyrica used for?</h3>
<p>On the US label: neuropathic pain from diabetic peripheral neuropathy, postherpetic neuralgia, nerve pain after spinal cord injury, fibromyalgia, and add-on treatment for partial-onset seizures.${cite(1, 2)}</p>
<h3>What is the generic name of Lyrica?</h3>
<p>Pregabalin.${cite(1, 2)}</p>
<h3>Is Lyrica a controlled substance?</h3>
<p>Yes. The DEA placed pregabalin in Schedule V on 28 July 2005. DailyMed still lists Lyrica as CV.${cite(1, 4)}</p>
<h3>Is Lyrica an opioid or a narcotic?</h3>
<p>No. It is an anticonvulsant. It is still scheduled because of abuse and dependence risk, not because it is morphine.${cite(1, 3, 4)}</p>
<h3>Is Lyrica or pregabalin addictive?</h3>
<p>MedlinePlus says pregabalin may be habit forming. The US schedule finding was limited physical or psychological dependence relative to Schedule IV.${cite(2, 4)} Do not stop a prescribed course on your own.</p>
<h3>What is Nervigesic 300 mg?</h3>
<p>Nervigesic is a pregabalin brand. This listing is the 300 mg capsule. It is the only pregabalin SKU on this catalog.</p>
<h3>What is the pregabalin 300 mg price on Modempic?</h3>
<p>$105 for 30 capsules, $195 for 60, and $255 for 90, in USD. Per-capsule cost falls from $3.50 to $2.83. Confirm the buy box before you pay.</p>
<h3>What is the usual labeled adult dose?</h3>
<p>US labeling starts adult dosing at 150 mg per day in divided doses. 300 mg per day is a labeled maximum or step for several indications, not a once-daily default for a 300 mg capsule.${cite(1, 2)} This page does not personalize a dose.</p>

<h2 id="conclusion">Conclusion</h2>
<p>Buy pregabalin online from this page if you want the Nervigesic 300 mg capsule pack and you have already checked whether you may import it. Pick 30, 60, or 90. The 90-pack is $60 less than three 30-packs. If you want a 75 mg or 150 mg listing, it is not here. For the US label, start with DailyMed and MedlinePlus.${cite(1, 2)}</p>

<h2 id="references">References</h2>
<ol>
<li id="ref-1">U.S. Food and Drug Administration. <strong>LYRICA (pregabalin) capsules, CV, and oral solution [prescribing information].</strong> DailyMed. Packager: Viatris Specialty LLC. DEA schedule: CV. ${ext(DAILYMED, DAILYMED)}</li>
<li id="ref-2">U.S. National Library of Medicine. <strong>Pregabalin.</strong> MedlinePlus. Last revised 15 May 2020. ${ext(MEDLINE, MEDLINE)}</li>
<li id="ref-3">Mayo Foundation for Medical Education and Research. <strong>Pregabalin (oral route).</strong> Mayo Clinic. Portions of this document last updated 1 August 2026. ${ext(MAYO, MAYO)}</li>
<li id="ref-4">Drug Enforcement Administration. <strong>Schedules of Controlled Substances: Placement of Pregabalin Into Schedule V.</strong> Federal Register. 28 July 2005;70(144):43633-43635. Document 05-15036. ${ext(DEA_V, DEA_V)}</li>
</ol>
`.trim();
}

function wordCount(html: string): number {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

async function main() {
  const html = sanitizeProductBodyHtml(bodyHtml());
  const product = await prisma.product.findUnique({
    where: { slug: SLUG },
    select: { id: true },
  });
  if (!product) throw new Error(`missing ${SLUG}`);

  await prisma.product.update({
    where: { id: product.id },
    data: {
      bodyHtml: html,
      seoTitle: SEO_TITLE,
      seoDesc: SEO_DESC,
      shortDesc: SHORT_DESC,
      longDesc: LONG_DESC,
    },
  });

  const citationHrefs = [...html.matchAll(/href="#ref-(\d+)"/g)].map((m) => m[1]);
  const citationIds = [...html.matchAll(/id="ref-(\d+)"/g)].map((m) => m[1]);

  console.log(
    JSON.stringify(
      {
        slug: SLUG,
        words: wordCount(html),
        htmlLen: html.length,
        hasIntro: html.includes('id="introduction"'),
        hasToc: html.includes('id="on-this-page"'),
        hasFaq: html.includes('id="questions"'),
        hasConclusion: html.includes('id="conclusion"'),
        hasRefs: html.includes('id="references"'),
        emptyRel: / rel(?:="">|>)/.test(html) || html.includes(" rel>"),
        citationHrefs: [...new Set(citationHrefs)],
        citationIds,
        headingIds: [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((m) => m[1]),
      },
      null,
      2,
    ),
  );
}

void main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
