import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import redisMock from '../config/redisMock';
import { AppError } from '../middleware/errorHandler';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, minPrice, maxPrice, search, sort, page = 1, limit = 20 } = req.query;

    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    const skip = (p - 1) * l;

    // Build Redis Cache Key
    const cacheKey = `products:cat:${category || 'all'}:min:${minPrice || '0'}:max:${maxPrice || 'inf'}:search:${search || ''}:sort:${sort || 'none'}:p:${p}:l:${l}`;
    const cachedData = await redisMock.get(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      res.status(200).json({
        success: true,
        data: parsed.data,
        meta: parsed.meta,
        message: 'Products retrieved successfully (cached)',
      });
      return;
    }

    // Build database filters
    const where: any = { isActive: true };

    if (category) {
      where.category = {
        slug: String(category),
      };
    }

    if (minPrice || maxPrice) {
      where.variants = {
        some: {
          price: {
            gte: minPrice ? Number(minPrice) : undefined,
            lte: maxPrice ? Number(maxPrice) : undefined,
          },
        },
      };
    }

    if (search) {
      const searchStr = String(search);
      where.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { description: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    // Sorting logic
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { variants: { _count: 'desc' } }; // Simplified or fallback sorted in code
    } else if (sort === 'price_desc') {
      orderBy = { variants: { _count: 'desc' } };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    // Get count & products
    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: 'asc' } },
          variants: true,
        },
        orderBy,
        skip,
        take: l,
      }),
    ]);

    // Format products structure
    const formattedProducts = products.map((prod) => {
      // Find primary image
      const primaryImage = prod.images.find((img) => img.isPrimary) || prod.images[0];
      // Find base price (minimum price among variants)
      const basePrice = prod.variants.reduce(
        (min, v) => (v.price.toNumber() < min ? v.price.toNumber() : min),
        prod.variants[0]?.price.toNumber() || 0
      );

      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        category: prod.category,
        imageUrl: primaryImage ? primaryImage.url : '',
        price: basePrice,
        variants: prod.variants,
      };
    });

    const totalPages = Math.ceil(total / l);
    const meta = {
      page: p,
      limit: l,
      total,
      totalPages,
      hasNext: p < totalPages,
      hasPrev: p > 1,
    };

    const responsePayload = { data: formattedProducts, meta };

    // Save to Cache for 5 minutes
    await redisMock.set(cacheKey, JSON.stringify(responsePayload), 'EX', 300);

    res.status(200).json({
      success: true,
      data: formattedProducts,
      meta,
      message: 'Products retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const cacheKey = `product:slug:${slug}`;
    const cachedData = await redisMock.get(cacheKey);

    if (cachedData) {
      res.status(200).json({
        success: true,
        data: JSON.parse(cachedData),
        message: 'Product retrieved successfully (cached)',
      });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: 'asc' } },
        variants: true,
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      next(new AppError(404, 'Product not found', 'PROD_001'));
      return;
    }

    // Cache product detail for 15 minutes
    await redisMock.set(cacheKey, JSON.stringify(product), 'EX', 900);

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, categoryId, variants, images } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { slug } });
    if (existingProduct) {
      return next(new AppError(400, 'Product with this URL slug already exists', 'PROD_003'));
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        variants: {
          create: variants,
        },
        images: {
          create: images,
        },
      },
    });

    // Invalidate main products list caches
    await clearProductsCache();

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, description, categoryId, isActive, isFeatured } = req.body;

    const prod = await prisma.product.findUnique({ where: { id } });
    if (!prod) {
      return next(new AppError(404, 'Product not found', 'PROD_001'));
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        categoryId,
        isActive,
        isFeatured,
      },
    });

    // Invalidate caches
    await redisMock.del(`product:slug:${prod.slug}`);
    if (slug && slug !== prod.slug) {
      await redisMock.del(`product:slug:${slug}`);
    }
    await clearProductsCache();

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Product updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const prod = await prisma.product.findUnique({ where: { id } });
    if (!prod) {
      return next(new AppError(404, 'Product not found', 'PROD_001'));
    }

    // Soft delete product
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate caches
    await redisMock.del(`product:slug:${prod.slug}`);
    await clearProductsCache();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully (soft delete)',
    });
  } catch (error) {
    next(error);
  }
};

// Helper to clear products lists from cache
const clearProductsCache = async () => {
  // In a real Redis app, we would scan for "products:*" keys and delete them.
  // In our mock, since it is a Map, we can clear keys starting with "products:"
  const store = (redisMock as any).store;
  if (store instanceof Map) {
    for (const key of store.keys()) {
      if (key.startsWith('products:')) {
        store.delete(key);
      }
    }
  }
};
