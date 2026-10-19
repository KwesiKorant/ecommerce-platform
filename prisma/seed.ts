import { PrismaClient, Role, OrderStatus, AuditAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting deterministic database seed for Arc-AA E-Commerce Platform...");

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Cleaned existing database records.");

  // 2. Seed Users (Admin, Demo Customer, Evaluator)
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", saltRounds);
  const customerPasswordHash = await bcrypt.hash("CustomerPass123!", saltRounds);
  const evaluatorPasswordHash = await bcrypt.hash("EvaluatorPass123!", saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: "admin@ecommerce.com",
      passwordHash: adminPasswordHash,
      fullName: "Ecommerce Admin",
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@ecommerce.com",
      passwordHash: customerPasswordHash,
      fullName: "Ama Serwaa",
      role: Role.CUSTOMER,
    },
  });

  const evaluator = await prisma.user.create({
    data: {
      email: "evaluator@ecommerce.com",
      passwordHash: evaluatorPasswordHash,
      fullName: "Auspify Evaluator",
      role: Role.CUSTOMER,
    },
  });

  console.log(`👤 Seeded 3 users: 1 ADMIN (${admin.email}), 2 CUSTOMERs (${customer.email}, ${evaluator.email})`);

  // 3. Seed Categories
  const categoriesData = [
    {
      name: "Electronics",
      slug: "electronics",
      description: "Precision engineered computer hardware and high-performance peripherals.",
    },
    {
      name: "Ergonomics",
      slug: "ergonomics",
      description: "Ergonomically certified physical interfaces and posture optimization gear.",
    },
    {
      name: "Audio",
      slug: "audio",
      description: "Audiophile reference equipment, planar transducers, and studio monitors.",
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Minimalist workspace organizers, charging stations, and desk accoutrements.",
    },
    {
      name: "Lifestyle",
      slug: "lifestyle",
      description: "Industrial-grade carry gear, precision stationery, and insulated containers.",
    },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created.id;
  }

  console.log(`📁 Seeded ${Object.keys(categories).length} product categories.`);

  // 4. Seed 10 Rich Catalog Products (Including low stock and out of stock edge cases)
  const productsData = [
    {
      title: "Arc Precision Mechanical Keyboard",
      slug: "arc-precision-mechanical-keyboard",
      description: "CNC milled aerospace aluminum chassis with hot-swappable lubricated switches, gasket mount acoustic dampening, and PBT dye-sub keycaps.",
      price: 189.99,
      stock: 16,
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
      categorySlug: "electronics",
    },
    {
      title: "Pro Ergo Wireless Mouse",
      slug: "pro-ergo-wireless-mouse",
      description: "57-degree natural vertical handshake angle, PAW3395 optical sensor with 26,000 DPI, and zero-latency 2.4GHz wireless telemetry.",
      price: 89.99,
      stock: 3, // Low stock edge case
      imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
      categorySlug: "ergonomics",
    },
    {
      title: "Acoustic Shield ANC Studio Headphones",
      slug: "acoustic-shield-anc-studio-headphones",
      description: "40mm beryllium dynamic drivers with 48dB hybrid active noise cancellation, lossless LDAC codec transmission, and memory foam ear cushions.",
      price: 249.99,
      stock: 8,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      categorySlug: "audio",
    },
    {
      title: "Ultra-Wide 4K Studio Display",
      slug: "ultra-wide-4k-studio-display",
      description: "34-inch curved IPS Black panel with 98% DCI-P3 color gamut, Thunderbolt 4 96W power delivery hub, and factory-calibrated Delta E < 1.5.",
      price: 799.99,
      stock: 0, // Out of stock edge case
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      categorySlug: "electronics",
    },
    {
      title: "Merino Wool & Vegan Leather Desk Mat",
      slug: "merino-wool-desk-mat",
      description: "Dual-sided premium surface with non-slip natural cork backing, water-resistant oleophobic treatment, and anti-fray stitched perimeter.",
      price: 49.99,
      stock: 24,
      imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
      categorySlug: "accessories",
    },
    {
      title: "MagSafe 3-in-1 Aluminum Charging Stand",
      slug: "magsafe-3-in-1-aluminum-charging-stand",
      description: "Solid anodized aluminum architecture with 15W Qi2 certified fast-charging for phone, smartwatch, and earbuds simultaneously.",
      price: 69.99,
      stock: 2, // Low stock edge case
      imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80",
      categorySlug: "accessories",
    },
    {
      title: "Kinematic Lumbar Ergonomic Mesh Chair",
      slug: "kinematic-lumbar-ergonomic-mesh-chair",
      description: "Self-adjusting dynamic lumbar resistance mechanism, 4D multi-directional armrests, and breathable high-tensile elastomeric mesh.",
      price: 449.99,
      stock: 6,
      imageUrl: "https://images.unsplash.com/photo-1589384267710-7a170981ca78?auto=format&fit=crop&w=800&q=80",
      categorySlug: "ergonomics",
    },
    {
      title: "Studio Hi-Fi Reference Desktop Monitors",
      slug: "studio-hi-fi-reference-desktop-monitors",
      description: "Bi-amplified 5-inch Kevlar woofers and silk dome tweeters with rear acoustic bass reflex port, delivering flat frequency response from 45Hz to 22kHz.",
      price: 329.99,
      stock: 1, // Critically low stock edge case (1 unit left)
      imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
      categorySlug: "audio",
    },
    {
      title: "Minimalist Matte Stainless Thermos",
      slug: "minimalist-matte-stainless-thermos",
      description: "Double-walled vacuum insulated 18/8 food-grade stainless steel flask keeping beverages 24 hours ice-cold or 12 hours steaming hot.",
      price: 34.99,
      stock: 35,
      imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
      categorySlug: "lifestyle",
    },
    {
      title: "Aerospace Titanium EDC Ballpoint Pen",
      slug: "aerospace-titanium-edc-ballpoint-pen",
      description: "Machined from Grade 5 Titanium bar stock with ceramic ball bearing bolt-action mechanism and pressurized Fisher Space Pen cartridge.",
      price: 59.99,
      stock: 18,
      imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
      categorySlug: "lifestyle",
    },
    {
      title: "Studio Desk Setup",
      slug: "studio-desk-setup",
      description: "Complete studio workspace system integrating solid American walnut surface, motorized dual-motor sit-stand chassis, CNC aluminum cable management rail, and built-in Qi2 fast wireless charging.",
      price: 899.99,
      stock: 5,
      imageUrl: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80",
      categorySlug: "ergonomics",
    },
  ];

  const products: Record<string, string> = {};
  for (const prod of productsData) {
    const { categorySlug, ...rest } = prod;
    const created = await prisma.product.create({
      data: {
        ...rest,
        categoryId: categories[categorySlug],
      },
    });
    products[prod.slug] = created.id;

    // Create AuditLog for each seeded product
    await prisma.auditLog.create({
      data: {
        entityType: "PRODUCT",
        entityId: created.id,
        action: AuditAction.CREATE,
        details: JSON.stringify({
          title: created.title,
          price: created.price.toString(),
          stock: created.stock,
          initialSeed: true,
        }),
        performedBy: admin.id,
      },
    });
  }

  console.log(`📦 Seeded ${Object.keys(products).length} products with initial audit records.`);

  // 5. Seed Historical Orders for Ama Serwaa (Customer)
  const shippingAddress = {
    fullName: "Ama Serwaa",
    addressLine1: "14 Independence Avenue",
    city: "Accra",
    postalCode: "GA-123-4567",
    country: "Ghana",
  };

  // Order 1: PROCESSING with Mechanical Keyboard and Mouse
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-92F1",
      userId: customer.id,
      totalAmount: 279.98,
      status: OrderStatus.PROCESSING,
      shippingAddress: JSON.stringify(shippingAddress),
      items: {
        create: [
          {
            productId: products["arc-precision-mechanical-keyboard"],
            quantity: 1,
            unitPrice: 189.99,
          },
          {
            productId: products["pro-ergo-wireless-mouse"],
            quantity: 1,
            unitPrice: 89.99,
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "ORDER",
      entityId: order1.id,
      action: AuditAction.CREATE,
      details: JSON.stringify({
        event: "Order placed by customer",
        orderNumber: order1.orderNumber,
        totalAmount: "279.98",
        itemCount: 2,
      }),
      performedBy: customer.id,
    },
  });

  // Order 2: DELIVERED with Merino Wool Desk Mat and Titanium Pen
  const order2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-10A4",
      userId: customer.id,
      totalAmount: 109.98,
      status: OrderStatus.DELIVERED,
      shippingAddress: JSON.stringify(shippingAddress),
      items: {
        create: [
          {
            productId: products["merino-wool-desk-mat"],
            quantity: 1,
            unitPrice: 49.99,
          },
          {
            productId: products["aerospace-titanium-edc-ballpoint-pen"],
            quantity: 1,
            unitPrice: 59.99,
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "ORDER",
      entityId: order2.id,
      action: AuditAction.CREATE,
      details: JSON.stringify({
        event: "Order placed by customer",
        orderNumber: order2.orderNumber,
        totalAmount: "109.98",
        itemCount: 2,
      }),
      performedBy: customer.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "ORDER",
      entityId: order2.id,
      action: AuditAction.STATUS_CHANGE,
      details: JSON.stringify({
        previousStatus: "SHIPPED",
        newStatus: "DELIVERED",
        carrier: "Express Delivery",
      }),
      performedBy: admin.id,
    },
  });

  console.log(`🧾 Seeded 2 customer orders (${order1.orderNumber}, ${order2.orderNumber}) with audit transitions.`);

  console.log("\n✅ Database seeding successfully completed!");
  console.log("--------------------------------------------------");
  console.log("Demo Credentials:");
  console.log("  Admin:    admin@ecommerce.com    / AdminPass123!");
  console.log("  Customer: customer@ecommerce.com / CustomerPass123!");
  console.log("  Evaluator: evaluator@ecommerce.com / EvaluatorPass123!");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
