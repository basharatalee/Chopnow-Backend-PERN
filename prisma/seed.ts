// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();

// async function main() {
//   const password = await bcrypt.hash("test123", 10);

//   await prisma.user.createMany({
//     data: [
//       { firstName: "Ali", lastName: "Khan", email: "ali@user.com", password, phone: "03001234567", role: "USER" },
//       { firstName: "Ahmed", lastName: "Rider", email: "ahmed@rider.com", password, phone: "03001234568", role: "RIDER" },
//       { firstName: "Food", lastName: "Point", email: "food@restaurant.com", password, phone: "03001234569", role: "RESTAURANT" },
//     ],
//     skipDuplicates: true,
//   });
// }

// main()
//   .then(() => {
//     console.log("✅ Database seeded");
//   })
//   .catch((e) => {
//     console.error(e);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
























// import { PrismaClient, Role, OrderStatus } from "@prisma/client";
// import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();

// async function main() {
//   console.log("🌱 Seeding database...");

//   // --- USERS ---
//   const user1 = await prisma.user.upsert({
//     where: { email: "user1@example.com" },
//     update: {},
//     create: {
//       firstName: "User",
//       lastName: "One",
//       email: "user1@example.com",
//       password: await bcrypt.hash("user123", 10),
//       phone: "1234567890",
//       role: Role.USER,
//     },
//   });

//   const rider1 = await prisma.user.upsert({
//     where: { email: "rider1@example.com" },
//     update: {},
//     create: {
//       firstName: "Rider",
//       lastName: "One",
//       email: "rider1@example.com",
//       password: await bcrypt.hash("rider123", 10),
//       phone: "1234567891",
//       role: Role.RIDER,
//     },
//   });

//   const restaurantOwner = await prisma.user.upsert({
//     where: { email: "owner1@example.com" },
//     update: {},
//     create: {
//       firstName: "Owner",
//       lastName: "One",
//       email: "owner1@example.com",
//       password: await bcrypt.hash("owner123", 10),
//       phone: "1234567892",
//       role: Role.RESTAURANT,
//     },
//   });

//   // --- RESTAURANT ---
//   const restaurant1 = await prisma.restaurant.upsert({
//     where: { id: 1 },
//     update: {},
//     create: {
//       name: "Pizza Palace",
//       phone: "111-222-3333",
//       address: "123 Main St",
//       ownerUserId: restaurantOwner.id,
//     },
//   });

//   // --- ORDER ---
//   const order1 = await prisma.order.upsert({
//     where: { code: "ORDER-001" },
//     update: {},
//     create: {
//       code: "ORDER-001",
//       customerId: user1.id,
//       restaurantId: restaurant1.id,
//       riderId: rider1.id,
//       status: OrderStatus.PENDING,
//       subTotal: 200.0,
//       deliveryFee: 50.0,
//       tip: 20.0,
//       riderPayout: 40.0,
//       amount: 270.0,
//       distanceKm: 5.0,
//       assignedAt: new Date(),
//     },
//   });

//   // --- ORDER ITEM ---
//   await prisma.orderItem.upsert({
//     where: { id: 1 },
//     update: {},
//     create: {
//       orderId: order1.id,
//       title: "Large Pizza",
//       qty: 1,
//       unitPrice: 200.0,
//       total: 200.0,
//     },
//   });

//   // --- RATING ---
//   await prisma.rating.upsert({
//     where: { orderId: order1.id },
//     update: {},
//     create: {
//       orderId: order1.id,
//       riderId: rider1.id,
//       score: 5,
//       comment: "Great delivery!",
//     },
//   });

//   // --- EARNING ---
//   await prisma.earning.upsert({
//     where: { id: 1 },
//     update: {},
//     create: {
//       riderId: rider1.id,
//       orderId: order1.id,
//       amount: 40.0,
//     },
//   });

//   // --- RIDER ONLINE SESSION ---
//   await prisma.riderOnlineSession.upsert({
//     where: { id: 1 },
//     update: { endedAt: null },
//     create: {
//       riderId: rider1.id,
//       startedAt: new Date(),
//     },
//   });

//   console.log("✅ Database seeding completed successfully!");
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seeding error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });







// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();

// async function main() {
//   // --- USERS ---
//   const userPass = await bcrypt.hash("user123", 10);
//   const riderPass = await bcrypt.hash("rider123", 10);

//   const user1 = await prisma.user.upsert({
//     where: { email: "user1@example.com" },
//     update: {},
//     create: {
//       firstName: "Ali",
//       lastName: "Khan",
//       email: "user1@example.com",
//       password: userPass,
//       phone: "1111111111",
//       role: "USER",
//     },
//   });

//   const rider1 = await prisma.user.upsert({
//     where: { email: "rider1@example.com" },
//     update: {},
//     create: {
//       firstName: "Rider",
//       lastName: "One",
//       email: "rider1@example.com",
//       password: riderPass,
//       phone: "2222222222",
//       role: "RIDER",
//     },
//   });

//   // --- RESTAURANT ---
//   const rest1 = await prisma.restaurant.upsert({
//     where: { id: 1 },
//     update: {},
//     create: {
//       name: "Pizza Hub",
//       phone: "3333333333",
//       address: "Main Street 123",
//       ownerUserId: user1.id,
//     },
//   });

//   // --- ORDERS ---
//   const order1 = await prisma.order.create({
//     data: {
//       code: "ORD001",
//       customerId: user1.id,
//       restaurantId: rest1.id,
//       riderId: rider1.id,
//       status: "ASSIGNED",
//       subTotal: 800,
//       deliveryFee: 100,
//       tip: 50,
//       riderPayout: 120,
//       amount: 950,
//       items: {
//         create: [
//           { title: "Pizza Large", qty: 1, unitPrice: 800, total: 800 },
//         ],
//       },
//     },
//   });

//   const order2 = await prisma.order.create({
//     data: {
//       code: "ORD002",
//       customerId: user1.id,
//       restaurantId: rest1.id,
//       riderId: rider1.id,
//       status: "ASSIGNED",
//       subTotal: 500,
//       deliveryFee: 80,
//       tip: 20,
//       riderPayout: 90,
//       amount: 600,
//       items: {
//         create: [
//           { title: "Burger", qty: 2, unitPrice: 250, total: 500 },
//         ],
//       },
//     },
//   });

//   const order3 = await prisma.order.create({
//     data: {
//       code: "ORD003",
//       customerId: user1.id,
//       restaurantId: rest1.id,
//       riderId: rider1.id,
//       status: "DELIVERED",
//       subTotal: 600,
//       deliveryFee: 100,
//       tip: 30,
//       riderPayout: 110,
//       amount: 730,
//       deliveredAt: new Date(),
//       items: {
//         create: [
//           { title: "Shawarma", qty: 3, unitPrice: 200, total: 600 },
//         ],
//       },
//     },
//   });

//   const order4 = await prisma.order.create({
//     data: {
//       code: "ORD004",
//       customerId: user1.id,
//       restaurantId: rest1.id,
//       riderId: rider1.id,
//       status: "DELIVERED",
//       subTotal: 1200,
//       deliveryFee: 150,
//       tip: 40,
//       riderPayout: 160,
//       amount: 1390,
//       deliveredAt: new Date(),
//       items: {
//         create: [
//           { title: "Family Deal", qty: 1, unitPrice: 1200, total: 1200 },
//         ],
//       },
//     },
//   });

//   // --- RIDER ONLINE SESSIONS ---
//   await prisma.riderOnlineSession.createMany({
//     data: [
//       {
//         riderId: rider1.id,
//         startedAt: new Date(new Date().setHours(9, 0, 0)),
//         endedAt: new Date(new Date().setHours(11, 0, 0)),
//       },
//       {
//         riderId: rider1.id,
//         startedAt: new Date(new Date().setHours(14, 0, 0)),
//         endedAt: new Date(new Date().setHours(16, 0, 0)),
//       },
//       {
//         riderId: rider1.id,
//         startedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
//         endedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
//       },
//     ],
//   });

//   console.log("✅ Database seeded successfully");
// }

// main()
//   .then(() => prisma.$disconnect())
//   .catch((err) => {
//     console.error("❌ Seeding error:", err);
//     prisma.$disconnect();
//     process.exit(1);
//   });










































import { PrismaClient, Role, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // --- Passwords ---
  const userPass = await bcrypt.hash("user123", 10);
  const riderPass = await bcrypt.hash("rider123", 10);
  const ownerPass = await bcrypt.hash("owner123", 10);

  // --- USERS ---
  const user1 = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      firstName: "Ali",
      lastName: "Khan",
      email: "user1@example.com",
      password: userPass,
      phone: "1111111111",
      role: Role.USER,
    },
  });

  const rider1 = await prisma.user.upsert({
    where: { email: "rider1@example.com" },
    update: {},
    create: {
      firstName: "Rider",
      lastName: "One",
      email: "rider1@example.com",
      password: riderPass,
      phone: "2222222222",
      role: Role.RIDER,
    },
  });

  const owner1 = await prisma.user.upsert({
    where: { email: "owner1@example.com" },
    update: {},
    create: {
      firstName: "Restaurant",
      lastName: "Owner",
      email: "owner1@example.com",
      password: ownerPass,
      phone: "3333333333",
      role: Role.RESTAURANT,
    },
  });

  // --- RESTAURANT ---
  const restaurant1 = await prisma.restaurant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Pizza Hub",
      phone: "4444444444",
      address: "Main Street 123",
      ownerUserId: owner1.id,
    },
  });

  // --- ORDERS (2 Active + 2 Completed today) ---
  const order1 = await prisma.order.upsert({
    where: { code: "ORD001" },
    update: {},
    create: {
      code: "ORD001",
      customerId: user1.id,
      restaurantId: restaurant1.id,
      riderId: rider1.id,
      status: OrderStatus.ASSIGNED,
      subTotal: 800,
      deliveryFee: 100,
      tip: 50,
      riderPayout: 120,
      amount: 950,
      distanceKm: 5,
      assignedAt: new Date(),
      items: {
        create: [{ title: "Pizza Large", qty: 1, unitPrice: 800, total: 800 }],
      },
    },
  });

  const order2 = await prisma.order.upsert({
    where: { code: "ORD002" },
    update: {},
    create: {
      code: "ORD002",
      customerId: user1.id,
      restaurantId: restaurant1.id,
      riderId: rider1.id,
      status: OrderStatus.ASSIGNED,
      subTotal: 500,
      deliveryFee: 80,
      tip: 20,
      riderPayout: 90,
      amount: 600,
      distanceKm: 3,
      assignedAt: new Date(),
      items: {
        create: [{ title: "Burger", qty: 2, unitPrice: 250, total: 500 }],
      },
    },
  });

  const order3 = await prisma.order.upsert({
    where: { code: "ORD003" },
    update: {},
    create: {
      code: "ORD003",
      customerId: user1.id,
      restaurantId: restaurant1.id,
      riderId: rider1.id,
      status: OrderStatus.DELIVERED,
      subTotal: 600,
      deliveryFee: 100,
      tip: 30,
      riderPayout: 110,
      amount: 730,
      distanceKm: 4,
      assignedAt: new Date(),
      deliveredAt: new Date(),
      items: {
        create: [{ title: "Shawarma", qty: 3, unitPrice: 200, total: 600 }],
      },
    },
  });

  const order4 = await prisma.order.upsert({
    where: { code: "ORD004" },
    update: {},
    create: {
      code: "ORD004",
      customerId: user1.id,
      restaurantId: restaurant1.id,
      riderId: rider1.id,
      status: OrderStatus.DELIVERED,
      subTotal: 1200,
      deliveryFee: 150,
      tip: 40,
      riderPayout: 160,
      amount: 1390,
      distanceKm: 8,
      assignedAt: new Date(),
      deliveredAt: new Date(),
      items: {
        create: [{ title: "Family Deal", qty: 1, unitPrice: 1200, total: 1200 }],
      },
    },
  });

  // --- RATINGS ---
  await prisma.rating.upsert({
    where: { orderId: order3.id },
    update: {},
    create: {
      orderId: order3.id,
      riderId: rider1.id,
      score: 5,
      comment: "Fast delivery!",
    },
  });

  await prisma.rating.upsert({
    where: { orderId: order4.id },
    update: {},
    create: {
      orderId: order4.id,
      riderId: rider1.id,
      score: 4,
      comment: "Good service.",
    },
  });

  // --- EARNINGS ---
  await prisma.earning.createMany({
    data: [
      { riderId: rider1.id, orderId: order3.id, amount: 110 },
      { riderId: rider1.id, orderId: order4.id, amount: 160 },
    ],
    skipDuplicates: true,
  });

  // --- RIDER SESSIONS (Today + Past Day) ---
  await prisma.riderOnlineSession.createMany({
    data: [
      {
        riderId: rider1.id,
        startedAt: new Date(new Date().setHours(9, 0, 0, 0)),
        endedAt: new Date(new Date().setHours(11, 0, 0, 0)),
      },
      {
        riderId: rider1.id,
        startedAt: new Date(new Date().setHours(14, 0, 0, 0)),
        endedAt: new Date(new Date().setHours(16, 0, 0, 0)),
      },
      {
        riderId: rider1.id,
        startedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
        endedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
