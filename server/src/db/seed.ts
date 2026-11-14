import bcrypt from 'bcryptjs';
import {db} from './connection';

/**
 * Seeds the database with demo content: categories, products (bilingual),
 * users, coupons and a few reviews. Prices are in minor units (halalas).
 */

interface SeedProduct {
  sku: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  category: string;
  brand: string;
  images: string[];
  specs: {ar: Record<string, string>; en: Record<string, string>};
  is_featured?: boolean;
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const CATEGORIES = [
  {slug: 'electronics', name_ar: 'إلكترونيات', name_en: 'Electronics', image_url: img('photo-1498049794561-7780e7231661')},
  {slug: 'fashion', name_ar: 'أزياء', name_en: 'Fashion', image_url: img('photo-1445205170230-053b83016050')},
  {slug: 'home-kitchen', name_ar: 'المنزل والمطبخ', name_en: 'Home & Kitchen', image_url: img('photo-1556911220-e15b29be8c8f')},
  {slug: 'beauty', name_ar: 'العناية والجمال', name_en: 'Beauty & Care', image_url: img('photo-1596462502278-27bfdc403348')},
  {slug: 'sports', name_ar: 'رياضة ولياقة', name_en: 'Sports & Fitness', image_url: img('photo-1517649763962-0c623066013b')},
  {slug: 'books', name_ar: 'كتب', name_en: 'Books', image_url: img('photo-1481627834876-b7833e8f5570')},
];

const PRODUCTS: SeedProduct[] = [
  // ── Electronics ─────────────────────────────────────────────
  {
    sku: 'ELC-001', slug: 'aurora-wireless-headphones', name_ar: 'سماعات أورورا اللاسلكية',
    name_en: 'Aurora Wireless Headphones',
    description_ar: 'سماعات لاسلكية بعزل ضوضاء نشط وبطارية تدوم 40 ساعة، وصوت نقي متوازن يناسب الموسيقى والعمل.',
    description_en: 'Wireless headphones with active noise cancellation, 40-hour battery life, and clean balanced sound for music and work.',
    price: 89900, compare_at_price: 109900, stock: 42, category: 'electronics', brand: 'Aurora',
    images: [img('photo-1505740420928-5e560c06d30e'), img('photo-1583394838336-acd977736f90')],
    specs: {ar: {'عمر البطارية': '40 ساعة', 'الاتصال': 'Bluetooth 5.3', 'الوزن': '250 غم'}, en: {'Battery': '40 hours', 'Connectivity': 'Bluetooth 5.3', 'Weight': '250 g'}},
    is_featured: true,
  },
  {
    sku: 'ELC-002', slug: 'nova-smartwatch-pro', name_ar: 'ساعة نوفا الذكية برو',
    name_en: 'Nova Smartwatch Pro',
    description_ar: 'ساعة ذكية بشاشة AMOLED، تتبع النوم ومعدل النبض والأكسجين، مقاومة للماء 5ATM.',
    description_en: 'Smartwatch with AMOLED display, sleep, heart-rate and SpO2 tracking, 5ATM water resistance.',
    price: 74900, stock: 30, category: 'electronics', brand: 'Nova',
    images: [img('photo-1523275335684-37898b6baf30')],
    specs: {ar: {'الشاشة': '1.43 بوصة AMOLED', 'البطارية': '14 يومًا'}, en: {'Display': '1.43" AMOLED', 'Battery': '14 days'}},
    is_featured: true,
  },
  {
    sku: 'ELC-003', slug: 'pulse-bluetooth-speaker', name_ar: 'مكبر صوت بلس المحمول',
    name_en: 'Pulse Portable Speaker',
    description_ar: 'مكبر صوت محمول بصوت محيطي 360 درجة ومقاوم للماء، مثالي للرحلات والمنزل.',
    description_en: 'Portable speaker with 360° sound and water resistance — great for trips and home.',
    price: 29900, compare_at_price: 34900, stock: 65, category: 'electronics', brand: 'Pulse',
    images: [img('photo-1608043152269-423dbba4e7e1')],
    specs: {ar: {'القدرة': '20 واط', 'المقاومة': 'IPX7'}, en: {'Power': '20 W', 'Rating': 'IPX7'}},
  },
  {
    sku: 'ELC-004', slug: 'vision-4k-action-camera', name_ar: 'كاميرا فيجن 4K للحركة',
    name_en: 'Vision 4K Action Camera',
    description_ar: 'كاميرا حركة بدقة 4K وتثبيت إلكتروني للصورة، مع ملحقات كاملة للرياضات والسفر.',
    description_en: '4K action camera with electronic image stabilization and a full accessory kit for sports and travel.',
    price: 129900, stock: 18, category: 'electronics', brand: 'Vision',
    images: [img('photo-1526170375885-4d8ecf77b99f')],
    specs: {ar: {'الدقة': '4K/60fps', 'المقاومة': '10 أمتار'}, en: {'Resolution': '4K/60fps', 'Waterproof': '10 m'}},
  },

  // ── Fashion ─────────────────────────────────────────────────
  {
    sku: 'FSH-001', slug: 'classic-leather-jacket', name_ar: 'جاكيت جلد كلاسيكي',
    name_en: 'Classic Leather Jacket',
    description_ar: 'جاكيت جلد طبيعي بقصة كلاسيكية وخياطة متينة، يناسب الخريف والشتاء.',
    description_en: 'Genuine leather jacket with a classic cut and sturdy stitching — perfect for autumn and winter.',
    price: 199900, compare_at_price: 249900, stock: 12, category: 'fashion', brand: 'Urban Line',
    images: [img('photo-1551028719-00167b16eac5')],
    specs: {ar: {'الخامة': 'جلد طبيعي', 'المقاسات': 'S – XXL'}, en: {'Material': 'Genuine leather', 'Sizes': 'S – XXL'}},
    is_featured: true,
  },
  {
    sku: 'FSH-002', slug: 'everyday-cotton-sneakers', name_ar: 'حذاء قطني يومي',
    name_en: 'Everyday Cotton Sneakers',
    description_ar: 'حذاء رياضي خفيف بنعل مريح وقماش قطني يتنفس، للاستخدام اليومي.',
    description_en: 'Lightweight sneakers with a comfortable sole and breathable cotton upper for daily wear.',
    price: 45900, stock: 54, category: 'fashion', brand: 'Step',
    images: [img('photo-1549298916-b41d501d3772')],
    specs: {ar: {'النعل': 'مطاط EVA', 'المقاسات': '38 – 45'}, en: {'Sole': 'EVA rubber', 'Sizes': '38 – 45'}},
  },
  {
    sku: 'FSH-003', slug: 'minimal-steel-watch', name_ar: 'ساعة فولاذية مينيمال',
    name_en: 'Minimal Steel Watch',
    description_ar: 'ساعة يد بتصميم بسيط وحركة كوارتز يابانية، بسوار فولاذي مقاوم للصدأ.',
    description_en: 'Minimalist watch with a Japanese quartz movement and rust-proof steel strap.',
    price: 89900, stock: 25, category: 'fashion', brand: 'Chrono',
    images: [img('photo-1524592094714-0f0654e20314')],
    specs: {ar: {'الحركة': 'كوارتز ياباني', 'مقاومة الماء': '3ATM'}, en: {'Movement': 'Japanese quartz', 'Water resistance': '3ATM'}},
  },
  {
    sku: 'FSH-004', slug: 'wool-winter-scarf', name_ar: 'وشاح صوفي شتوي',
    name_en: 'Wool Winter Scarf',
    description_ar: 'وشاح من صوف مرين الناعم بألوان ثابتة، دافئ وخفيف في نفس الوقت.',
    description_en: 'Soft merino wool scarf with colorfast dyes — warm yet light.',
    price: 18900, stock: 80, category: 'fashion', brand: 'Nord',
    images: [img('photo-1520903920243-00d872a2d1c9')],
    specs: {ar: {'الخامة': 'صوف مرين 100%'}, en: {'Material': '100% merino wool'}},
  },

  // ── Home & Kitchen ──────────────────────────────────────────
  {
    sku: 'HOM-001', slug: 'barista-espresso-machine', name_ar: 'آلة إسبريسو بارِستا',
    name_en: 'Barista Espresso Machine',
    description_ar: 'آلة إسبريسو بضغط 20 بار ومبخّر حليب احترافي، تصنع قهوة المقاهي في مطبخك.',
    description_en: '20-bar espresso machine with a professional milk steamer — café-quality coffee at home.',
    price: 249900, compare_at_price: 299900, stock: 15, category: 'home-kitchen', brand: 'Barista',
    images: [img('photo-1517668808822-9ebb02f2a0e6')],
    specs: {ar: {'الضغط': '20 بار', 'الخزان': '1.8 لتر'}, en: {'Pressure': '20 bar', 'Tank': '1.8 L'}},
    is_featured: true,
  },
  {
    sku: 'HOM-002', slug: 'chef-knife-set-8pc', name_ar: 'طقم سكاكين الشيف 8 قطع',
    name_en: 'Chef Knife Set — 8 Pieces',
    description_ar: 'طقم سكاكين من فولاذ الستانلس المصقول مع كتلة خشبية، حاد يدوم طويلًا.',
    description_en: 'Polished stainless steel knives with a wooden block — a long-lasting sharp edge.',
    price: 79900, stock: 28, category: 'home-kitchen', brand: 'ChefLine',
    images: [img('photo-1593618998160-e34014e67546')],
    specs: {ar: {'الفولاذ': 'ستانلس مضلب', 'القطع': '8'}, en: {'Steel': 'Forged stainless', 'Pieces': '8'}},
  },
  {
    sku: 'HOM-003', slug: 'aroma-diffuser-wood', name_ar: 'موزع عطر خشبي',
    name_en: 'Aroma Wood Diffuser',
    description_ar: 'موزع روائح بالموجات فوق الصوتية مع إضاءة هادئة، يرطب الجو وينشر العطر.',
    description_en: 'Ultrasonic aroma diffuser with soft lighting — humidifies and scents the room.',
    price: 19900, stock: 90, category: 'home-kitchen', brand: 'Zen',
    images: [img('photo-1602523961358-f9f03dd557db')],
    specs: {ar: {'السعة': '300 مل', 'التشغيل': 'حتى 10 ساعات'}, en: {'Capacity': '300 ml', 'Runtime': 'up to 10 h'}},
  },
  {
    sku: 'HOM-004', slug: 'linen-bed-sheet-set', name_ar: 'طقم ملاءات كتان',
    name_en: 'Linen Bed Sheet Set',
    description_ar: 'طقم ملاءات من الكتان الطبيعي الملين، يتنفس صيفًا ويدفئ شتاءً.',
    description_en: 'Natural breathable linen sheets — cool in summer, warm in winter.',
    price: 64900, stock: 40, category: 'home-kitchen', brand: 'LinenCo',
    images: [img('photo-1522771739844-6a9f6d5f14af')],
    specs: {ar: {'الخامة': 'كتان 100%', 'المقاسات': 'King / Queen'}, en: {'Material': '100% linen', 'Sizes': 'King / Queen'}},
  },

  // ── Beauty & Care ───────────────────────────────────────────
  {
    sku: 'BTY-001', slug: 'glow-vitamin-c-serum', name_ar: 'سيروم فيتامين C المشرق',
    name_en: 'Glow Vitamin C Serum',
    description_ar: 'سيروم مركّز بفيتامين C وحمض الهيالورونيك، يوحّد لون البشرة ويمنحها إشراقة.',
    description_en: 'Concentrated serum with vitamin C and hyaluronic acid — evens tone and boosts glow.',
    price: 24900, stock: 120, category: 'beauty', brand: 'GlowLab',
    images: [img('photo-1620916566398-39f1143ab7be')],
    specs: {ar: {'الحجم': '30 مل', 'المكونات': 'فيتامين C + هيالورونيك'}, en: {'Size': '30 ml', 'Actives': 'Vitamin C + HA'}},
    is_featured: true,
  },
  {
    sku: 'BTY-002', slug: 'silk-hair-dryer-pro', name_ar: 'مجفف شعر حريري برو',
    name_en: 'Silk Hair Dryer Pro',
    description_ar: 'مجفف بتقنية أيونية تقلل التجعد، بثلاث درجات حرارة وملحقات تشكيل.',
    description_en: 'Ionic hair dryer that reduces frizz, with three heat settings and styling attachments.',
    price: 54900, stock: 35, category: 'beauty', brand: 'SilkAir',
    images: [img('photo-1522338242992-e1a54906a8da')],
    specs: {ar: {'القدرة': '1800 واط', 'التقنية': 'أيونية'}, en: {'Power': '1800 W', 'Tech': 'Ionic'}},
  },
  {
    sku: 'BTY-003', slug: 'oud-royal-perfume', name_ar: 'عطر عود رويال',
    name_en: 'Oud Royal Perfume',
    description_ar: 'عطر شرقي بتركيز عالٍ من العود والعنبر والمسك، ثبات يدوم أكثر من 10 ساعات.',
    description_en: 'Oriental fragrance with a high concentration of oud, amber and musk — over 10 hours of longevity.',
    price: 159900, compare_at_price: 189900, stock: 22, category: 'beauty', brand: 'Maison Oud',
    images: [img('photo-1541643600914-78b084683601')],
    specs: {ar: {'الحجم': '100 مل', 'التركيز': 'Extrait de Parfum'}, en: {'Size': '100 ml', 'Concentration': 'Extrait de Parfum'}},
    is_featured: true,
  },
  {
    sku: 'BTY-004', slug: 'deep-clean-beard-kit', name_ar: 'طقم العناية باللحية',
    name_en: 'Deep Clean Beard Kit',
    description_ar: 'طقم كامل للعناية باللحية: زيت، بلسم، مشط خشبي ومقص احترافي.',
    description_en: 'Complete beard care kit: oil, balm, wooden comb and professional scissors.',
    price: 17900, stock: 75, category: 'beauty', brand: 'BeardCraft',
    images: [img('photo-1621607512214-68297480165e')],
    specs: {ar: {'المكونات': '4 قطع'}, en: {'Includes': '4 items'}},
  },

  // ── Sports & Fitness ────────────────────────────────────────
  {
    sku: 'SPT-001', slug: 'adjustable-dumbbell-24kg', name_ar: 'دمبل قابل للتعديل 24 كجم',
    name_en: 'Adjustable Dumbbell — 24 kg',
    description_ar: 'دمبل واحد يغني عن 15 دمبل، تعديل الوزن بلفة واحدة من 2 إلى 24 كجم.',
    description_en: 'One dumbbell replaces fifteen — adjust from 2 to 24 kg with a single turn.',
    price: 139900, stock: 20, category: 'sports', brand: 'IronFit',
    images: [img('photo-1638536532686-d610adfc8e5c')],
    specs: {ar: {'الوزن': '2 – 24 كجم', 'الضمان': 'سنتان'}, en: {'Weight': '2 – 24 kg', 'Warranty': '2 years'}},
    is_featured: true,
  },
  {
    sku: 'SPT-002', slug: 'pro-yoga-mat-6mm', name_ar: 'سجادة يوغا احترافية 6 ملم',
    name_en: 'Pro Yoga Mat — 6 mm',
    description_ar: 'سجادة يوغا سميكة بمقاومة انزلاق عالية وخطوط محاذاة، تأتي بحزام حمل.',
    description_en: 'Thick non-slip yoga mat with alignment lines and a carrying strap.',
    price: 22900, stock: 60, category: 'sports', brand: 'ZenFlow',
    images: [img('photo-1592432678016-e910b452f9a2')],
    specs: {ar: {'السماكة': '6 ملم', 'الخامة': 'TPE'}, en: {'Thickness': '6 mm', 'Material': 'TPE'}},
  },
  {
    sku: 'SPT-003', slug: 'hydrator-insulated-bottle-1l', name_ar: 'قنينة حافظة للحرارة 1 لتر',
    name_en: 'Insulated Hydrator Bottle — 1 L',
    description_ar: 'قنينة ستانلس مزدوجة الجدار، تحافظ على البرودة 24 ساعة والحرارة 12 ساعة.',
    description_en: 'Double-wall stainless bottle — cold for 24 h, hot for 12 h.',
    price: 12900, stock: 100, category: 'sports', brand: 'Hydra',
    images: [img('photo-1602143407151-7111542de6e8')],
    specs: {ar: {'السعة': '1 لتر', 'العزل': '24 ساعة بارد'}, en: {'Capacity': '1 L', 'Insulation': '24 h cold'}},
  },
  {
    sku: 'SPT-004', slug: 'trail-runner-backpack-10l', name_ar: 'حقيبة جري الجبلية 10 لتر',
    name_en: 'Trail Runner Backpack — 10 L',
    description_ar: 'حقيبة جري خفيفة بجيوب ماء وقفاط ضبط، مثالية للجري الطويل والرحلات.',
    description_en: 'Light running pack with water pockets and adjustable straps — built for long runs.',
    price: 34900, stock: 30, category: 'sports', brand: 'TrailX',
    images: [img('photo-1551632811-561732d1e306')],
    specs: {ar: {'السعة': '10 لتر', 'الوزن': '280 غم'}, en: {'Capacity': '10 L', 'Weight': '280 g'}},
  },

  // ── Books ───────────────────────────────────────────────────
  {
    sku: 'BOK-001', slug: 'art-of-clean-code', name_ar: 'فن الكود النظيف',
    name_en: 'The Art of Clean Code',
    description_ar: 'دليل عملي لكتابة برمجيات واضحة وقابلة للصيانة، بأمثلة من مشاريع حقيقية.',
    description_en: 'A practical guide to writing clear, maintainable software with real-project examples.',
    price: 15900, stock: 45, category: 'books', brand: 'TechPress',
    images: [img('photo-1532012197267-da84d127e765')],
    specs: {ar: {'الصفحات': '352', 'اللغة': 'الإنجليزية'}, en: {'Pages': '352', 'Language': 'English'}},
  },
  {
    sku: 'BOK-002', slug: 'sapiens-brief-history', name_ar: 'الحيوانات الذكية: تاريخ موجز للبشرية',
    name_en: 'Sapiens: A Brief History',
    description_ar: 'رحلة شيقة في تاريخ البشرية من العصر الحجري إلى الثورة الصناعية.',
    description_en: 'A fascinating journey through human history — from the Stone Age to the industrial revolution.',
    price: 12900, stock: 70, category: 'books', brand: 'Harbor',
    images: [img('photo-1544947950-fa07a98d237f')],
    specs: {ar: {'الصفحات': '464'}, en: {'Pages': '464'}},
  },
  {
    sku: 'BOK-003', slug: 'atlas-of-world-cuisines', name_ar: 'أطلس مطابخ العالم',
    name_en: 'Atlas of World Cuisines',
    description_ar: 'كتاب مصور كبير يستعرض 200 وصفة من 40 مطبخًا عالميًا بتقديم خطوة بخطوة.',
    description_en: 'A large illustrated book covering 200 recipes from 40 world cuisines, step by step.',
    price: 24900, compare_at_price: 29900, stock: 25, category: 'books', brand: 'Coastline',
    images: [img('photo-1512820790803-83ca734da794')],
    specs: {ar: {'الصفحات': '320', 'الغلاف': 'صلب'}, en: {'Pages': '320', 'Binding': 'Hardcover'}},
  },
  {
    sku: 'BOK-004', slug: 'mindful-productivity', name_ar: 'الإنتاجية الواعية',
    name_en: 'Mindful Productivity',
    description_ar: 'كيف تنجز أكثر بضغط أقل: أنظمة عملية توازن بين التركيز والراحة.',
    description_en: 'Get more done with less stress: practical systems that balance focus and rest.',
    price: 10900, stock: 55, category: 'books', brand: 'TechPress',
    images: [img('photo-1481627834876-b7833e8f5570')],
    specs: {ar: {'الصفحات': '240'}, en: {'Pages': '240'}},
  },
];

export function seed(): void {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get() as {n: number};
  if (count.n > 0) {
    console.log('Database already seeded — skipping.');
    return;
  }

  const tx = db.transaction(() => {
    // Users
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
    );
    insertUser.run('Admin', 'admin@souqna.com', bcrypt.hashSync('Admin@123', 10), 'admin', '+966500000000');
    const sara = insertUser.run('Sara Ahmed', 'sara@example.com', bcrypt.hashSync('User@123', 10), 'customer', '+966511111111');
    const omar = insertUser.run('Omar Khaled', 'omar@example.com', bcrypt.hashSync('User@123', 10), 'customer', '+966522222222');

    db.prepare(
      'INSERT INTO addresses (user_id, label, line1, city, country, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, 1)',
    ).run(sara.lastInsertRowid, 'Home', 'King Fahd Rd, Al Olaya', 'Riyadh', 'Saudi Arabia', '+966511111111');

    // Categories
    const insertCat = db.prepare(
      'INSERT INTO categories (slug, name_ar, name_en, image_url) VALUES (?, ?, ?, ?)',
    );
    const catIds = new Map<string, number>();
    for (const c of CATEGORIES) {
      const r = insertCat.run(c.slug, c.name_ar, c.name_en, c.image_url);
      catIds.set(c.slug, Number(r.lastInsertRowid));
    }

    // Products
    const insertProduct = db.prepare(`
      INSERT INTO products (sku, slug, name_ar, name_en, description_ar, description_en,
        price, compare_at_price, stock, category_id, brand, images, specs, is_featured)
      VALUES (@sku, @slug, @name_ar, @name_en, @description_ar, @description_en,
        @price, @compare_at_price, @stock, @category_id, @brand, @images, @specs, @is_featured)
    `);
    const productIds = new Map<string, number>();
    for (const p of PRODUCTS) {
      const r = insertProduct.run({
        ...p,
        compare_at_price: p.compare_at_price ?? null,
        category_id: catIds.get(p.category)!,
        images: JSON.stringify(p.images),
        specs: JSON.stringify(p.specs),
        is_featured: p.is_featured ? 1 : 0,
      });
      productIds.set(p.sku, Number(r.lastInsertRowid));
    }

    // Coupons
    const insertCoupon = db.prepare(`
      INSERT INTO coupons (code, type, value, min_subtotal, max_uses, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    insertCoupon.run('WELCOME10', 'percent', 10, 10000, 500, '2027-12-31');
    insertCoupon.run('SAVE50', 'fixed', 5000, 30000, 200, '2027-12-31');

    // Reviews (a sample across products)
    const insertReview = db.prepare(
      'INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES (?, ?, ?, ?, ?)',
    );
    const saraId = Number(sara.lastInsertRowid);
    const omarId = Number(omar.lastInsertRowid);
    insertReview.run(productIds.get('ELC-001')!, saraId, 5, 'Outstanding sound', 'Noise cancellation is superb for the price.');
    insertReview.run(productIds.get('ELC-001')!, omarId, 4, 'Great battery', 'Battery easily lasts the week of commuting.');
    insertReview.run(productIds.get('HOM-001')!, saraId, 5, 'Café quality', 'Morning espresso tastes amazing.');
    insertReview.run(productIds.get('BTY-003')!, omarId, 5, 'Long lasting', 'The oud stays with you all day.');
    insertReview.run(productIds.get('BOK-001')!, saraId, 4, 'Solid read', 'Clear examples, well organized.');

    // Recompute product ratings from reviews
    db.exec(`
      UPDATE products SET
        rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE product_id = products.id), 0),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = products.id)
    `);
  });

  tx();
  console.log('Seeded: categories, products, users, coupons, reviews.');
}
