import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clean existing tables
  await prisma.refreshToken.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const superAdminPassword = await bcrypt.hash('Superadmin@123', 12);
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const customerPassword = await bcrypt.hash('Customer@123', 12);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@megamart.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+919999999999',
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@megamart.com',
      password: adminPassword,
      firstName: 'Kavita',
      lastName: 'Sharma',
      phone: '+919876543210',
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@megamart.com',
      password: customerPassword,
      firstName: 'Rohan',
      lastName: 'Malhotra',
      phone: '+919876543211',
      role: Role.CUSTOMER,
      isEmailVerified: true,
    },
  });

  console.log(`Created users: Super Admin (${superAdmin.email}), Admin (${admin.email}), Customer (${customer.email})`);

  // Create default address for customer
  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      type: 'SHIPPING',
      firstName: 'Rohan',
      lastName: 'Malhotra',
      line1: 'Apt 4B, 128 Broadway St',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India',
      isDefault: true,
    },
  });
  console.log(`Created default address for customer: ${address.id}`);

  // 3. Create Categories
  const catGroceries = await prisma.category.create({
    data: {
      name: 'Groceries',
      slug: 'groceries',
      description: 'Fresh organic groceries, vegetables, and daily staples.',
    },
  });

  const catSnacks = await prisma.category.create({
    data: {
      name: 'Snacks',
      slug: 'snacks',
      description: 'Crispy snacks, fresh baked cookies, and dry fruit treats.',
    },
  });

  const catDrinks = await prisma.category.create({
    data: {
      name: 'Drinks',
      slug: 'drinks',
      description: 'Fruit juices, fresh milk, sodas, and carbonated beverages.',
    },
  });

  const catLaundry = await prisma.category.create({
    data: {
      name: 'Laundry Essentials',
      slug: 'laundry',
      description: 'Environment friendly laundry detergents, liquids, and cleaning products.',
    },
  });

  console.log('Created categories: groceries, snacks, drinks, laundry');

  // 4. Create Products
  // Product 1: Bananas
  await prisma.product.create({
    data: {
      name: 'Organic Bananas (Bunch)',
      slug: 'organic-bananas-bunch',
      description: 'Hand-picked organic bananas grown in sun-drenched tropical valleys. Naturally sweetened, rich in potassium, and harvested at perfect maturity to guarantee a delicious texture and flavor.',
      categoryId: catGroceries.id,
      isActive: true,
      isFeatured: true,
      variants: {
        create: [
          { sku: 'BAN-STD', size: 'Standard bunch', price: 1.99, stock: 45 },
          { sku: 'BAN-DBL', size: 'Double Bundle', price: 3.49, stock: 20 },
        ],
      },
      images: {
        create: [
          { url: 'images/prod_bananas.png', altText: 'Organic Bananas Bunch', isPrimary: true, position: 1 },
        ],
      },
    },
  });

  // Product 2: Cookies
  await prisma.product.create({
    data: {
      name: 'Chocolate Chip Cookies (200g)',
      slug: 'chocolate-chip-cookies-200g',
      description: 'Delectably crispy chocolate chip cookies baked fresh daily using premium Belgian chocolate chips and organic wheat flour. Melt-in-the-mouth goodness with a generous distribution of chocolate drops.',
      categoryId: catSnacks.id,
      isActive: true,
      isFeatured: true,
      variants: {
        create: [
          { sku: 'COK-STD', size: 'Standard Pack (200g)', price: 3.49, stock: 6 },
          { sku: 'COK-FAM', size: 'Family Size (400g)', price: 6.29, stock: 12 },
        ],
      },
      images: {
        create: [
          { url: 'images/prod_cookies.png', altText: 'Chocolate Chip Cookies Pack', isPrimary: true, position: 1 },
        ],
      },
    },
  });

  // Product 3: Milk
  await prisma.product.create({
    data: {
      name: 'Organic Whole Milk (1L)',
      slug: 'organic-whole-milk-1l',
      description: '100% pasteurized organic fresh whole cow\'s milk sourced from certified free-range local dairy farms. Creamy, nutrient-rich, and packaged in eco-friendly glass bottles to ensure maximum purity.',
      categoryId: catDrinks.id,
      isActive: true,
      isFeatured: true,
      variants: {
        create: [
          { sku: 'MLK-1L', size: 'Standard Bottle (1L)', price: 2.29, stock: 30 },
          { sku: 'MLK-2L', size: 'Value Size (2L)', price: 4.09, stock: 15 },
        ],
      },
      images: {
        create: [
          { url: 'images/prod_milk.png', altText: 'Organic Whole Milk Bottle', isPrimary: true, position: 1 },
        ],
      },
    },
  });

  // Product 4: Detergent
  await prisma.product.create({
    data: {
      name: 'Liquid Laundry Detergent (1.5L)',
      slug: 'liquid-laundry-detergent-1.5l',
      description: 'Ultra-concentrated eco-friendly liquid laundry detergent formulated with plant-based active enzymes. Powerful stain removal action that preserves fabric colors, softens fibers, and leaves a fresh natural lavender scent.',
      categoryId: catLaundry.id,
      isActive: true,
      isFeatured: false,
      variants: {
        create: [
          { sku: 'DET-1.5L', size: 'Standard (1.5L)', price: 8.99, stock: 25 },
          { sku: 'DET-3L', size: 'Jumbo Pack (3L)', price: 15.99, stock: 10 },
        ],
      },
      images: {
        create: [
          { url: 'images/prod_detergent.png', altText: 'Liquid Laundry Detergent Bottle', isPrimary: true, position: 1 },
        ],
      },
    },
  });

  // Product 5: Red Apples
  await prisma.product.create({
    data: {
      name: 'Fresh Red Apples (1kg)',
      slug: 'fresh-red-apples-1kg',
      description: 'Crisp, juicy red Royal Gala apples handpicked from local high-altitude organic orchards. Naturally sweet, firm-textured, and packed immediately to lock in freshness and crunch.',
      categoryId: catGroceries.id,
      isActive: true,
      isFeatured: true,
      variants: {
        create: [
          { sku: 'APP-RED-1K', size: 'Standard Pack (1kg)', price: 2.99, stock: 50 },
          { sku: 'APP-RED-2K', size: 'Bulk Pack (2kg)', price: 5.49, stock: 25 },
        ],
      },
      images: {
        create: [
          { url: 'images/prod_apples.png', altText: 'Fresh Red Apples Pack', isPrimary: true, position: 1 },
        ],
      },
    },
  });

  // Product 6: Orange Juice
  await prisma.product.create({
    data: {
      name: 'Fresh Orange Juice (1L)',
      slug: 'fresh-orange-juice-1l',
      description: '100% cold-pressed orange juice with pulp, squeezed from sun-ripened organic Valencia oranges. Never from concentrate, with zero added sugar, preservatives, or water. Pure liquid sunshine in a bottle.',
      categoryId: catDrinks.id,
      isActive: true,
      isFeatured: true,
      variants: {
        create: [
          { sku: 'JUC-ORG-1L', size: 'Standard Bottle (1L)', price: 3.99, stock: 4 },
          { sku: 'JUC-ORG-PK', size: 'Single-serve Pack', price: 4.79, stock: 8 },
        ],
      },
      images: {
        create: [
          { url: 'images/prod_juice.png', altText: 'Fresh Orange Juice Bottle', isPrimary: true, position: 1 },
        ],
      },
    },
  });

  // 5. Create default Coupons
  await prisma.coupon.create({
    data: {
      code: 'FRESH10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 20,
      maxUsageCount: 1000,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'WELCOME5',
      type: 'FIXED',
      value: 5.00,
      minOrderAmount: 15,
      maxUsageCount: 500,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      isActive: true,
    },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
