export type LegendaryStrain = {
  id: number
  name: string
  type: 'Indica' | 'Sativa' | 'Hybrid'
  era: string
  lore: string
}

const legendaryStrains: LegendaryStrain[] = [
  {
    id: 1,
    name: 'Afghan Kush',
    type: 'Indica',
    era: 'The Ancestors',
    lore: 'Originating in the Hindu Kush mountain range between Afghanistan and Pakistan, Afghan Kush is one of the oldest cannabis varieties in existence — cultivated by humans for thousands of years for both resin (hashish) and fibre. It is the genetic backbone of virtually every modern indica-dominant strain, contributing its signature dense buds, heavy resin production, and deeply sedating body effect. THC typically 17–20%. Aroma: earthy, woody, sweet hash. Effects: full-body relaxation, pain relief, sleep.',
  },
  {
    id: 2,
    name: 'Hindu Kush',
    type: 'Indica',
    era: 'The Ancestors',
    lore: 'A true landrace from the mountains straddling the Afghanistan-Pakistan border, Hindu Kush evolved in extreme conditions — harsh winters, dry summers — producing an exceptionally thick layer of trichomes as natural protection. Pure indica, with little hybridisation, it represents one of the most genetically stable ancient cannabis varieties. It brought the earthy, hash-like aromas and deep physical sedation of the high mountains to Western growers in the 1960s and 70s. THC 15–20%. Essential to almost all hash and indica genetics.',
  },
  {
    id: 3,
    name: 'Acapulco Gold',
    type: 'Sativa',
    era: 'The Ancestors',
    lore: 'A legendary Mexican sativa from the Guerrero region near Acapulco, this strain became the benchmark for cannabis quality in the United States in the 1960s. Named for its distinctive gold and amber colouring caused by unusual calyxes, it delivered a potent, clear-headed euphoria unlike the sedating hash varieties being brought over from the East. THC estimated at 15–23% for its era — remarkable. Its reputation sparked global demand for high-quality sativa genetics and remains a cultural icon of the psychedelic era.',
  },
  {
    id: 4,
    name: 'Colombian Gold',
    type: 'Sativa',
    era: 'The Ancestors',
    lore: 'A landrace sativa from the Santa Marta mountain region of Colombia, Colombian Gold was one of the most widely imported cannabis varieties during the 1960s and 70s. It is a foundational parent of Skunk #1, arguably the most influential hybrid ever created. Known for its giggly, social, and energetic effects — relatively clear-headed compared to many modern high-THC varieties. Aroma: sweet, lemony, golden. It helped define what Western growers expected from sativa: uplifting, functional, and distinctly different from hashish.',
  },
  {
    id: 5,
    name: 'Panama Red',
    type: 'Sativa',
    era: 'The Ancestors',
    lore: 'A pure 1960s sativa originating in Panama, famous for its deep reddish-orange pistils — an unusual and instantly recognisable characteristic. Panama Red delivered a psychedelic, mind-expanding, almost hallucinogenic energy that set it apart from other import strains of the era. It had a long flowering time (up to 11 weeks) and was not suited for indoor growing, which contributed to its decline as indoor cultivation became dominant in the 1980s. Today it is considered a rare and largely lost classic, sought by sativa connoisseurs.',
  },
  {
    id: 6,
    name: 'Durban Poison',
    type: 'Sativa',
    era: 'The Ancestors',
    lore: "South Africa's most celebrated cannabis landrace, originally cultivated near the port city of Durban. Durban Poison is one of the few pure sativas that also produces substantial resin, making it unusually versatile. The aroma is distinctive: sweet black licorice, anise, and pine. Effects are espresso-like — clean, focused, energetic, and uplifting without the anxiety common in high-THC sativas. It is a foundational parent of Girl Scout Cookies. THC 15–20%. Still widely grown and respected as one of the finest pure sativas available.",
  },
  {
    id: 7,
    name: "Lamb's Bread",
    type: 'Sativa',
    era: 'The Ancestors',
    lore: "A bright, uplifting Jamaican sativa with deep spiritual and cultural associations — famously reported to have been Bob Marley's favourite strain. 'Lamb's Bread' (also written Lamb's Breath) is known for delivering a cerebral, introspective, and deeply positive high that Rastafarian tradition associates with clarity of thought and creative inspiration. Aroma: sweet, cheese-like, grassy. THC 16–21%. Its effects are social, talkative, and energising. One of the most historically and culturally significant cannabis varieties from the Caribbean.",
  },
  {
    id: 8,
    name: 'Kilimanjaro',
    type: 'Sativa',
    era: 'The Ancestors',
    lore: 'A pure African sativa landrace cultivated on the slopes of Mount Kilimanjaro in Tanzania, where it grows at altitude under intense equatorial sun. Historically used by indigenous hunters and warriors for its extraordinary focusing and energising effects — it was consumed before long hunts. Aroma: tropical fruit, mango, spice. Effects are hyper-focused, energetic, and functional. It has been used as a breeding parent to add African sativa genetics into modern lines seeking that elusive combination of high THC and clear-headed focus.',
  },
  {
    id: 9,
    name: 'Malawi Gold',
    type: 'Sativa',
    era: 'The Ancestors',
    lore: "A legendary African sativa from Malawi, once known as 'Chamba' by the local Chewa people who have cultivated it for centuries. Malawi Gold is notable for its extraordinarily long flowering time — up to 120 days — which has made it difficult to commercialise but beloved by those patient enough to grow it. The high is intense, mind-racing, creative, and euphoric, with a distinctive fruity and sweet aroma. It remains one of the most potent pure sativas ever measured, with some specimens reportedly exceeding 25% THC. A grail strain for sativa hunters.",
  },
  {
    id: 10,
    name: 'Thai Stick',
    type: 'Sativa',
    era: 'The Ancestors',
    lore: "A Southeast Asian sativa from Thailand, famous not just for its genetics but for its traditional preparation method: buds were tied around bamboo sticks with hemp string and sometimes soaked in opium — producing the 'Thai Stick' that became legendary in the 1970s American drug market. The strain itself is citrusy, piney, and intensely cerebral. It contributed essential sativa genetics to many modern strains including Haze. Its long flowering time (12–14 weeks) and equatorial adaptation make it challenging to grow outside tropical climates.",
  },
  {
    id: 11,
    name: 'Skunk #1',
    type: 'Hybrid',
    era: 'The Foundation',
    lore: "Created in the United States in the early 1970s by Sacred Seeds — a collective later associated with Sam 'The Skunkman' — Skunk #1 is arguably the single most important hybrid in cannabis breeding history. It crossed Colombian Gold, Acapulco Gold, and Afghan Kush, combining sativa cerebralism with indica resilience and resin production. First stabilised and distributed in the Netherlands, it became the blueprint for modern commercial cannabis and the genetic foundation of thousands of subsequent strains. Its pungent, powerful aroma gave 'skunk' its cultural meaning.",
  },
  {
    id: 12,
    name: 'Northern Lights',
    type: 'Indica',
    era: 'The Foundation',
    lore: 'Developed in the Pacific Northwest United States in the 1970s and later perfected by Sensi Seeds in the Netherlands, Northern Lights became the dominant indoor indica of the 1980s. A near-pure Afghan indica cross, it was prized for its extraordinary resin production, fast flowering (7–8 weeks), compact structure, and resilience — perfectly adapted to indoor growing. Effects are deeply physical: relaxing, pain-relieving, sleep-inducing. It won multiple Cannabis Cup awards and remains a reference point that all modern indicas are measured against. THC 16–21%.',
  },
  {
    id: 13,
    name: 'Haze',
    type: 'Sativa',
    era: 'The Foundation',
    lore: "Created by the Haze Brothers in Santa Cruz, California in the late 1960s and early 70s, Haze is one of the most complex and influential strains ever bred. It combines Colombian, Mexican, Thai, and South Indian sativa landraces into a single variety with an extraordinarily long flowering time (12–16 weeks) and an unmatched soaring, cerebral, almost psychedelic high. Despite its difficulty to grow, it became the backbone of the Dutch coffee shop scene and a parent of Super Silver Haze, Amnesia Haze, and countless others. Its influence on modern cannabis genetics is immeasurable.",
  },
  {
    id: 14,
    name: 'G13',
    type: 'Indica',
    era: 'The Foundation',
    lore: "The subject of one of cannabis culture's most enduring myths: that G13 was engineered by the US government at a University of Mississippi research facility and that a cutting was stolen by an employee and distributed. While the story is almost certainly apocryphal, G13 does exist as a highly potent indica variety, likely an Afghan Kush selection. The legend gave it a mystique that no amount of debunking has diminished — it appears in the 1999 film American Beauty and has been referenced in popular culture repeatedly. THC 20–24%. Effects: heavy, sedating, euphoric.",
  },
  {
    id: 15,
    name: 'White Widow',
    type: 'Hybrid',
    era: 'The Foundation',
    lore: "Created by the Dutch breeder Shantibaba (later of Mr Nice Seeds) and brought to fame by Green House Seeds in the early 1990s, White Widow became the definitive Dutch coffee shop strain. A cross between a Brazilian sativa and a South Indian indica, it is named for its extraordinary trichome coverage — the buds appear almost white under the resin. It delivered a potent, balanced hybrid effect unlike anything available at the time. It won the High Times Cannabis Cup in 1995 and defined an era. THC 18–25%. Still one of the most recognised cannabis strains in the world.",
  },
  {
    id: 16,
    name: 'Chemdawg',
    type: 'Hybrid',
    era: 'The Foundation',
    lore: "One of the most important accidental discoveries in cannabis history — Chemdawg originated from a bag of mystery seeds purchased at a Grateful Dead concert in Taos, New Mexico in 1991. Traded between growers including Chemdog (who named it) and P-Bud, it quickly became notorious for its diesel fuel aroma, extraordinary potency, and unique hybrid effects. It is a direct parent of OG Kush and Sour Diesel, making it the genetic cornerstone of two of the most dominant families in modern cannabis. Its exact heritage is unknown. THC 15–20%. Pungent, cerebral, and unmistakably itself.",
  },
  {
    id: 17,
    name: 'OG Kush',
    type: 'Hybrid',
    era: 'The Foundation',
    lore: "The most influential strain of the modern American cannabis market. OG Kush emerged in Florida in the early 1990s — believed to be a cross of Chemdawg with a Hindu Kush or Lemon Thai male — and defined West Coast cannabis culture after moving to California. Its signature is unmistakable: fuel, pine, lemon, and earth, with a complex euphoric-yet-relaxing effect. 'OG' is widely disputed — possibly 'Original Gangster', possibly 'Ocean Grown'. It became the parent of Bubba Kush, SFV OG, Kosher Kush, and dozens more. THC 19–26%. The single most referenced strain in the history of cannabis.",
  },
  {
    id: 18,
    name: 'Jack Herer',
    type: 'Sativa',
    era: 'The Foundation',
    lore: "Named after the American cannabis activist and author of 'The Emperor Wears No Clothes' — the foundational text of the modern cannabis legalisation movement — Jack Herer was developed by Sensi Seeds in the Netherlands in the mid-1990s. A complex cross of Haze with Northern Lights #5 and Shiva Skunk, it delivers a spicy, piney aroma (heavy in terpinolene, pinene, and myrcene) and a clear, energising, creative high. It has won multiple Cannabis Cup awards and is registered as a medicinal strain in the Netherlands. THC 18–24%. A near-perfect sativa.",
  },
  {
    id: 19,
    name: 'AK-47',
    type: 'Hybrid',
    era: 'The Foundation',
    lore: "Developed by Serious Seeds in 1992, AK-47 is a complex multi-way cross — Colombian, Mexican, Thai, and Afghan genetics combined into a single, remarkably consistent hybrid. Despite the aggressive name, AK-47 delivers a mellow, long-lasting cerebral buzz with subtle body relaxation. It won the High Times Cannabis Cup multiple times in the 1990s and 2000s. The heavy terpene production (earthy, sour, floral) made it famous for its distinctive aroma even while growing. THC 16–20%. One of the most award-winning strains in history and a staple of European cannabis culture for three decades.",
  },
  {
    id: 20,
    name: 'Super Silver Haze',
    type: 'Sativa',
    era: 'The Foundation',
    lore: 'A pinnacle achievement of Dutch breeding — Super Silver Haze was created by Shantibaba and Neville Schoenmakers at Green House Seeds using Northern Lights #5, Haze, and Skunk #1. It won the High Times Cannabis Cup three consecutive years (1997, 1998, 1999), an unprecedented achievement that has never been matched. The effect is a long-lasting, energetic, soaring sativa high that beginners often find overwhelming. Aroma: spicy, herbal, sweet. THC 18–23%. It represented the gold standard of Dutch sativa breeding at the height of the Amsterdam coffee shop era.',
  },
  {
    id: 21,
    name: 'Blue Dream',
    type: 'Hybrid',
    era: 'The Modern Era',
    lore: "A California classic — Blue Dream is a cross of Blueberry indica and Super Silver Haze that became the bestselling strain in virtually every legal US market for years running. It delivers a gentle, balanced high that eases into relaxation without heavy sedation, making it highly accessible. Aroma: sweet blueberry, vanilla, earthy. The combination of Blueberry's body comfort and Haze's cerebral energy made it uniquely versatile — functional enough for daytime, relaxing enough for evening. THC 17–24%. Its widespread success helped establish the modern notion of 'approachable hybrid' as a commercial category.",
  },
  {
    id: 22,
    name: 'Girl Scout Cookies',
    type: 'Hybrid',
    era: 'The Modern Era',
    lore: "Emerging from the Bay Area of California around 2012 — originally through the collective Berner and Cookie Fam — GSC (Girl Scout Cookies) was a cross of OG Kush with a Durban Poison x F1 hybrid. It rapidly took over the legal cannabis market with its sweet, earthy, minty aroma and powerful full-body euphoria. THC regularly exceeding 25%. It spawned an entire lineage: Thin Mint Cookies, Platinum GSC, and was itself a parent of Gelato, Sunset Sherbet, and hundreds of 'Cookies family' strains that now dominate dispensary shelves. Possibly the most influential strain of the 2010s.",
  },
  {
    id: 23,
    name: 'Gelato',
    type: 'Hybrid',
    era: 'The Modern Era',
    lore: "Created by Cookie Fam Genetics (Sherbinskis) in the San Francisco Bay Area, Gelato is a cross of Sunset Sherbet and Thin Mint Girl Scout Cookies. It became the cornerstone of the dessert strain era — a wave of sweet, creamy, high-potency hybrids that dominated dispensaries through the late 2010s and into the 2020s. Aroma: sweet cream, citrus, lavender. Effects: euphoric, relaxing, potent — THC 20–25%+. Visually striking with dense, colourful buds. Gelato #33 (Larry Bird) and #41 (Bacio Gelato) became particularly famous. It remains one of the most cloned and referenced genetics in the industry.",
  },
  {
    id: 24,
    name: 'Runtz',
    type: 'Hybrid',
    era: 'The Modern Era',
    lore: "Runtz was created by Cookies and Zeta (Runtz brand) as a cross of Zkittlez and Gelato — combining two of the most aromatic and visually distinct strains of the 2010s. It was named Leafly's Strain of the Year for 2020 and became a cultural phenomenon almost overnight, largely driven by social media and celebrity endorsements. Aroma: sweet candy, tropical fruit, cream — some describe it as smelling like actual Runts sweets. THC typically 19–29%. Dense, multi-coloured buds with extraordinary bag appeal. It triggered a global wave of 'candy' and 'dessert' genetics and remains one of the most counterfeited strain names in the world.",
  },
]

export default legendaryStrains
