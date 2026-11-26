import Product from '../models/Product.js';
import mongoose from 'mongoose';
import Brand from '../models/Brand.js';
import { Blog } from '../models/BlogsPage.js';
import Category from '../models/Category.js';
import Suggestion from '../models/Suggestion.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processMainImage, processGalleryImage } from '../config/sharp.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deleteStoredUpload = (fileUrl) => {
  if (typeof fileUrl !== 'string' || /^https?:\/\//i.test(fileUrl)) return;

  const uploadRoot = path.resolve(__dirname, '../uploads');
  const relativePath = fileUrl.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^uploads\//, '');
  const filePath = path.resolve(uploadRoot, relativePath);
  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) return;

  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (error) { console.warn('unlink failed:', filePath, error.message); }
  }
};

// Helper: Delete product images + uploaded document from disk
const deleteProductImages = async (product) => {
  const images = [product.mainImage, ...(product.gallery || [])];

  images.forEach((img) => {
    if (img && fs.existsSync(img)) {
      try { fs.unlinkSync(img); } catch (e) { console.warn('unlink failed:', img, e.message); }
    }
  });

  if (product.fileUpload?.fileUrl) {
    const filePath = product.fileUpload.fileUrl.replace(/^\/+/, '');
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn('unlink failed:', filePath, e.message); }
    }
  }

  for (const variant of product.variants || []) {
    deleteStoredUpload(variant.mainImage);
    (variant.gallery || []).forEach(deleteStoredUpload);
    deleteStoredUpload(variant.fileUpload?.fileUrl);
  }
};

const deleteRemovedVariantAssets = (previousVariants, updatedProduct) => {
  const currentAssets = new Set([
    updatedProduct.mainImage,
    ...(updatedProduct.gallery || []),
    updatedProduct.fileUpload?.fileUrl,
    ...(updatedProduct.variants || []).flatMap(variant => [
      variant.mainImage,
      ...(variant.gallery || []),
      variant.fileUpload?.fileUrl
    ])
  ].filter(Boolean));

  for (const variant of previousVariants || []) {
    for (const asset of [variant.mainImage, ...(variant.gallery || []), variant.fileUpload?.fileUrl]) {
      if (asset && !currentAssets.has(asset)) deleteStoredUpload(asset);
    }
  }
};

// Helper: Parse JSON fields
const parseJSONFields = (body) => {
  ['specifications', 'features', 'applications', 'faqs', 'highlights', 'certifications', 'metaKeywords'].forEach(field => {
    if (body[field]) try { body[field] = JSON.parse(body[field]); } catch(e) {}
  });
  return body;
};

// Helper: Generate slug
const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const parseVariantsField = (value) => {
  let variants = value;
  if (typeof variants === 'string') {
    try {
      variants = JSON.parse(variants);
    } catch {
      const error = new Error('variants must contain valid JSON');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!Array.isArray(variants)) {
    const error = new Error('variants must be an array');
    error.statusCode = 400;
    throw error;
  }

  if (variants.some(variant => !variant || typeof variant !== 'object' || Array.isArray(variant))) {
    const error = new Error('Each variant must be an object');
    error.statusCode = 400;
    throw error;
  }

  return variants;
};

const prepareProductVariants = async (variants, uploadedFiles, defaults, existingVariants = []) => {
  const uploadedIndexes = Object.keys(uploadedFiles || {});
  if (uploadedIndexes.some(index => Number(index) >= variants.length)) {
    const error = new Error('Variant image field index does not match the variants array');
    error.statusCode = 400;
    throw error;
  }

  const preparedVariants = await Promise.all(variants.map(async (input, index) => {
    const existing = input._id
      ? existingVariants.find(variant => variant._id.toString() === input._id.toString())
      : null;

    if (input._id && !existing) {
      const error = new Error(`Variant ${input._id} was not found on this product`);
      error.statusCode = 400;
      throw error;
    }

    const variant = { ...(existing?.toObject() || {}), ...input };
    if (typeof variant.name !== 'string' || !variant.name.trim()) {
      const error = new Error(`Variant ${index + 1} name is required`);
      error.statusCode = 400;
      throw error;
    }
    variant.name = variant.name.trim();

    const files = uploadedFiles?.[index] || {};

    if (files.mainImage?.[0]) {
      variant.mainImage = await processMainImage(files.mainImage[0].path);
      if (!variant.mainImage) throw new Error(`Could not process image for variant ${index + 1}`);
    }

    if (files.gallery?.length) {
      const gallery = await Promise.all(files.gallery.map(file => processGalleryImage(file.path)));
      if (gallery.some(image => !image)) throw new Error(`Could not process gallery image for variant ${index + 1}`);
      variant.gallery = [...(variant.gallery || []), ...gallery];
    }

    const uploadedFile = files.fileUpload?.[0];
    if (uploadedFile) {
      variant.fileUpload = {
        fileName: String(variant.fileName || '').trim() || uploadedFile.originalname,
        fileUrl: `/uploads/products/files/${uploadedFile.filename}`
      };
    } else if (variant.fileName !== undefined && variant.fileUpload?.fileUrl) {
      variant.fileUpload = {
        ...variant.fileUpload,
        fileName: String(variant.fileName).trim()
      };
    }
    delete variant.fileName;

    const brandId = variant.brand?._id || variant.brand || defaults.brand;
    const categoryId = variant.category?._id || variant.category || defaults.category;
    if (!mongoose.isValidObjectId(brandId)) {
      const error = new Error(`Variant ${index + 1} has an invalid brand`);
      error.statusCode = 400;
      throw error;
    }
    if (!mongoose.isValidObjectId(categoryId)) {
      const error = new Error(`Variant ${index + 1} has an invalid category`);
      error.statusCode = 400;
      throw error;
    }

    const [brand, category] = await Promise.all([
      Brand.findById(brandId),
      Category.findById(categoryId)
    ]);
    if (!brand) {
      const error = new Error(`Brand not found for variant ${index + 1}`);
      error.statusCode = 400;
      throw error;
    }
    if (!category) {
      const error = new Error(`Category not found for variant ${index + 1}`);
      error.statusCode = 400;
      throw error;
    }

    variant.brand = brand._id;
    variant.brandName = brand.name;
    variant.category = category._id;
    variant.categoryName = category.name;

    return variant;
  }));

  const usedNames = new Set();
  const usedSlugs = new Set();
  for (const variant of preparedVariants) {
    const normalizedName = variant.name.toLowerCase();
    if (usedNames.has(normalizedName)) {
      const error = new Error(`Variant with this name already exists: "${variant.name}"`);
      error.statusCode = 400;
      throw error;
    }
    usedNames.add(normalizedName);

    variant.slug = generateSlug(variant.name);
    if (usedSlugs.has(variant.slug)) {
      const error = new Error(`Variant slug already exists for this product: "${variant.slug}"`);
      error.statusCode = 400;
      throw error;
    }
    usedSlugs.add(variant.slug);
  }

  return preparedVariants;
};

const addFullUrls = (product, baseUrl) => {
  const productObj = product.toObject();

  if (productObj.mainImage && !productObj.mainImage.startsWith('http'))
    productObj.mainImage = `${baseUrl}${productObj.mainImage}`;

  if (productObj.gallery?.length) {
    productObj.gallery = productObj.gallery.map(img =>
      img && !img.startsWith('http') ? `${baseUrl}${img}` : img
    );
  }

  if (productObj.brand?.logo && !productObj.brand.logo.startsWith('http'))
    productObj.brand.logo = `${baseUrl}${productObj.brand.logo}`;

  // NEW: fileUpload full URL
  if (productObj.fileUpload?.fileUrl && !productObj.fileUpload.fileUrl.startsWith('http')) {
    productObj.fileUpload.fileUrl = `${baseUrl}${productObj.fileUpload.fileUrl}`;
  }

  productObj.variants = (productObj.variants || []).map(variant => {
    if (variant.mainImage && !variant.mainImage.startsWith('http')) {
      variant.mainImage = `${baseUrl}${variant.mainImage}`;
    }
    if (variant.gallery?.length) {
      variant.gallery = variant.gallery.map(image =>
        image && !image.startsWith('http') ? `${baseUrl}${image}` : image
      );
    }
    if (variant.fileUpload?.fileUrl && !variant.fileUpload.fileUrl.startsWith('http')) {
      variant.fileUpload.fileUrl = `${baseUrl}${variant.fileUpload.fileUrl}`;
    }
    if (variant.brand?.logo && !variant.brand.logo.startsWith('http')) {
      variant.brand.logo = `${baseUrl}${variant.brand.logo}`;
    }
    return variant;
  });

  if (!productObj.slug && productObj.name) productObj.slug = generateSlug(productObj.name);
  delete productObj.mainImageUrl;
  delete productObj.galleryUrls;

  return productObj;
};

const populateProduct = (query) => query
  .populate('brand category')
  .populate('variants.brand')
  .populate('variants.category');

// Helper: Process images from request
const processProductImages = async (files) => {
  const result = {};
  if (files?.mainImage?.[0]) 
    result.mainImage = await processMainImage(files.mainImage[0].path);
  if (files?.gallery?.length) {
    result.gallery = await Promise.all(
      files.gallery.map(file => processGalleryImage(file.path))
    );
  }
  return result;
};

// Helper: Build product query from filters
const buildProductQuery = (req) => {
  const { search, brand, category, minPrice, maxPrice, inStock, isFeatured, minRating, q } = req.query;
  const query = { isActive: true };
  
  if (search || q) {
    const term = (search || q).trim();
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { shortDesc: { $regex: term, $options: 'i' } },
      { fullDesc: { $regex: term, $options: 'i' } },
      { categoryName: { $regex: term, $options: 'i' } },
      { brandName: { $regex: term, $options: 'i' } }
    ];
  }
  
  if (brand) query.brand = brand.match(/^[0-9a-fA-F]{24}$/) ? brand : { brandName: { $regex: brand, $options: 'i' } };
  if (category) query.category = category.match(/^[0-9a-fA-F]{24}$/) ? category : { categoryName: { $regex: category, $options: 'i' } };
  if (inStock === 'true') query.inStock = true;
  if (isFeatured === 'true') query.isFeatured = true;
  if (minRating) query.rating = { $gte: parseFloat(minRating) };
  if (minPrice || maxPrice) query.price = { ...(minPrice && { $gte: parseFloat(minPrice) }), ...(maxPrice && { $lte: parseFloat(maxPrice) }) };
  
  return query;
};

// ==================== PRODUCT CRUD ====================

export const createProduct = async (req, res) => {
  try {
    req.body = parseJSONFields(req.body);
    const variantsInput = parseVariantsField(req.body.variants === undefined ? [] : req.body.variants);
    const { name, brand, category } = req.body;

    if (!name || !brand || !category) {
      const missing = !name ? 'name' : !brand ? 'brand' : 'category';
      return res.status(400).json({ success: false, message: `${missing} is required` });
    }

    const slug = generateSlug(name);
    if (await Product.findOne({ $or: [{ name }, { slug }] })) {
      return res.status(400).json({ success: false, message: 'Product with this name already exists' });
    }

    const [brandExists, categoryExists] = await Promise.all([
      Brand.findById(brand),
      Category.findById(category),
    ]);
    if (!brandExists) return res.status(400).json({ success: false, message: 'Brand not found' });
    if (!categoryExists) return res.status(400).json({ success: false, message: 'Category not found' });

    // -------- fileUpload (inline) --------
    let fileUpload = null;
    const uploadedFile = req.files?.fileUpload?.[0];
    const userFileName = (req.body.fileName || '').trim();   // user-typed

    if (uploadedFile) {
      fileUpload = {
        fileName: userFileName || uploadedFile.originalname,   // fallback if user left blank
        fileUrl: `/uploads/products/files/${uploadedFile.filename}`,
      };
    }
    // -------------------------------------

    delete req.body.fileName;


    const images = await processProductImages(req.files);
    const variants = await prepareProductVariants(variantsInput, req.variantFiles, {
      brand: brandExists._id,
      category: categoryExists._id
    });

    const product = await Product.create({
      ...req.body,
      slug,
      variants,
      ...images,
      ...(fileUpload && { fileUpload }),
      brandName: brandExists.name,
      categoryName: categoryExists.name,
    });

    await product.populate('brand category variants.brand variants.category');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: addFullUrls(product, baseUrl),
    });
  } catch (error) {
    const isVariantValidationError = error.name === 'ValidationError'
      && Object.keys(error.errors || {}).some(field => field.startsWith('variants.'));
    res.status(error.statusCode || (isVariantValidationError ? 400 : 500)).json({ success: false, message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = buildProductQuery(req);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      populateProduct(Product.find(query)).sort(sort).limit(parseInt(limit)).skip(skip),
      Product.countDocuments(query)
    ]);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      data: products.map(p => addFullUrls(p, baseUrl)),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllProductsAdmin = async (req, res) => {
  try {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', includeInactive = 'true' } = req.query;

    // Only paginate when page or limit is explicitly passed; otherwise return everything
    const shouldPaginate = page !== undefined || limit !== undefined;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // Build query - don't filter by isActive for admin
    const query = {};
    
    // Optional: Still apply search/filters but without isActive restriction
    const { search, brand, category, minPrice, maxPrice, inStock, isFeatured, minRating, q } = req.query;
    
    if (search || q) {
      const term = (search || q).trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { shortDesc: { $regex: term, $options: 'i' } },
        { fullDesc: { $regex: term, $options: 'i' } },
        { categoryName: { $regex: term, $options: 'i' } },
        { brandName: { $regex: term, $options: 'i' } }
      ];
    }
    
    if (brand) query.brand = brand.match(/^[0-9a-fA-F]{24}$/) ? brand : { brandName: { $regex: brand, $options: 'i' } };
    if (category) query.category = category.match(/^[0-9a-fA-F]{24}$/) ? category : { categoryName: { $regex: category, $options: 'i' } };
    if (inStock === 'true') query.inStock = true;
    if (isFeatured === 'true') query.isFeatured = true;
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (minPrice || maxPrice) query.price = { ...(minPrice && { $gte: parseFloat(minPrice) }), ...(maxPrice && { $lte: parseFloat(maxPrice) }) };
    
    // Optional: Filter by active status if specified
    if (includeInactive === 'false') {
      query.isActive = true;
    }
    
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    let productsQuery = populateProduct(Product.find(query)).sort(sort);
    if (shouldPaginate) {
      const skip = (pageNum - 1) * limitNum;
      productsQuery = productsQuery.skip(skip).limit(limitNum);
    }

    const [products, total, activeCount, inactiveCount] = await Promise.all([
      productsQuery,
      Product.countDocuments(query),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false })
    ]);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      data: products.map(p => addFullUrls(p, baseUrl)),
      pagination: shouldPaginate
        ? { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
        : { total, page: 1, limit: total, pages: 1 },
      summary: {
        totalProducts: total,
        activeProducts: activeCount,
        inactiveProducts: inactiveCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await populateProduct(Product.findById(req.params.id));
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(product, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const slug = req.params.slug || req.params.id;
    const product = await populateProduct(Product.findOne({ slug: { $regex: new RegExp(`^${slug}$`, 'i') } }));
    if (!product) return res.status(404).json({ success: false, message: `Product not found with slug: "${slug}"` });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: addFullUrls(product, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductVariantBySlug = async (req, res) => {
  try {
    const { slug, variantSlug } = req.params;
    const product = await populateProduct(Product.findOne({
      slug: { $regex: new RegExp(`^${slug}$`, 'i') }
    }));
    if (!product) {
      return res.status(404).json({ success: false, message: `Product not found with slug: "${slug}"` });
    }

    const variant = product.variants.find(item => item.slug?.toLowerCase() === variantSlug.toLowerCase());
    if (!variant) {
      return res.status(404).json({ success: false, message: `Variant not found with slug: "${variantSlug}"` });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const productData = addFullUrls(product, baseUrl);
    const variantData = productData.variants.find(item => item._id.toString() === variant._id.toString());
    productData.variants = [variantData];

    res.json({
      success: true,
      data: {
        product: productData,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductByName = async (req, res) => {
  try{
    const { name } = req.params;
    const { exact = 'false' } = req.query;
    const query = exact === 'true' ? { name } : { name: { $regex: name, $options: 'i' } };
    const products = await populateProduct(Product.find(query)).sort({ name: 1 });
    if (!products.length) return res.status(404).json({ success: false, message: `No products found with name containing "${name}"` });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, count: products.length, data: products.map(p => addFullUrls(p, baseUrl)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await populateProduct(Product.find({ isFeatured: true, isActive: true }))
      .populate('brand', 'name logo')
      .limit(parseInt(req.query.limit || 8))
      .sort({ rating: -1 });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: products.map(p => addFullUrls(p, baseUrl)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByBrand = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [products, total] = await Promise.all([
      populateProduct(Product.find({ brand: req.params.brandId, isActive: true }))
        .populate('brand', 'name logo')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Product.countDocuments({ brand: req.params.brandId, isActive: true })
    ]);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: products.map(p => addFullUrls(p, baseUrl)), pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [products, total] = await Promise.all([
      populateProduct(Product.find({ category: req.params.categoryId, isActive: true }))
        .populate('category', 'name')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Product.countDocuments({ category: req.params.categoryId, isActive: true })
    ]);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: products.map(p => addFullUrls(p, baseUrl)), pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// export const updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

//     req.body = parseJSONFields(req.body);

//     // 1. Slug regeneration on name change
//     if (req.body.name && req.body.name !== product.name) {
//       req.body.slug = generateSlug(req.body.name);
//       if (await Product.findOne({ slug: req.body.slug, _id: { $ne: req.params.id } })) {
//         return res.status(400).json({ success: false, message: 'Product with similar name already exists' });
//       }
//     }

//     // Keep track of the current gallery state
//     let currentGallery = product.gallery || [];

//     // 2. Handle uploaded files (Main Image, New Gallery Images, File Upload)
//     if (req.files) {
//       // A. Main Image (Replaces existing)
//       if (req.files.mainImage && req.files.mainImage[0]) {
//         const newMainImage = await processMainImage(req.files.mainImage[0].path);
//         req.body.mainImage = newMainImage;
        
//         if (product.mainImage && fs.existsSync(product.mainImage)) {
//           try { fs.unlinkSync(product.mainImage); } catch (e) {}
//         }
//       }

//       // B. Gallery Images (APPENDS to existing)
//       if (req.files.gallery && req.files.gallery.length > 0) {
//         const newGallery = await Promise.all(
//           req.files.gallery.map(file => processGalleryImage(file.path))
//         );
//         currentGallery = [...currentGallery, ...newGallery];
//       }

//       // C. File Upload / Brochure
//       const newDoc = req.files.fileUpload?.[0];
//       const userFileName = (req.body.fileName || '').trim();

//       if (newDoc) {
//         if (product.fileUpload?.fileUrl) {
//           const oldPath = product.fileUpload.fileUrl.replace(/^\/+/, '');
//           if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
//         }
//         req.body.fileUpload = {
//           fileName: userFileName || newDoc.originalname,
//           fileUrl: `/uploads/products/files/${newDoc.filename}`,
//         };
//       } else if (req.body.fileName !== undefined && product.fileUpload?.fileUrl) {
//         req.body.fileUpload = {
//           fileName: userFileName,
//           fileUrl: product.fileUpload.fileUrl,
//         };
//       }
//     }

//     // 3. Handle REMOVING specific gallery images (DB + Server)
//     if (req.body.removedGallery) {
//       let toRemove = [];
      
//       try {
//         // Parse the array (Postman/cURL sends it as a stringified JSON array)
//         toRemove = typeof req.body.removedGallery === 'string' 
//           ? JSON.parse(req.body.removedGallery) 
//           : req.body.removedGallery;
//       } catch (e) {
//         // Fallback if it's just a single string
//         toRemove = [req.body.removedGallery];
//       }

//       // Clean the array to ensure we only have pure URLs
//       if (Array.isArray(toRemove)) {
//         toRemove = toRemove.map(url => url.replace(/[\[\]"]/g, '').trim());
//       }

//       if (toRemove.length > 0) {
//         console.log("🗑️ Removing images from DB:", toRemove);
        
//         // A. Remove URLs from the database array
//         currentGallery = currentGallery.filter(img => !toRemove.includes(img));
        
//         // B. Delete physical files safely from the server
//         const galleryDir = path.join(process.cwd(), 'uploads', 'products', 'gallery');
        
//         toRemove.forEach(imgUrl => {
//           if (imgUrl) {
//             // 1. Get the filename without the extension
//             const baseName = path.parse(imgUrl).name; 
            
//             if (fs.existsSync(galleryDir)) {
//               const files = fs.readdirSync(galleryDir);
              
//               // 2. Find ANY file that starts with this baseName (catches .jpg, .webp, .png)
//               const matches = files.filter(f => f.startsWith(baseName));
              
//               if (matches.length > 0) {
//                 matches.forEach(match => {
//                   try {
//                     fs.unlinkSync(path.join(galleryDir, match));
//                     console.log(`✅ Deleted file from disk: ${match}`);
//                   } catch (err) {
//                     console.warn(`❌ Failed to delete file: ${err.message}`);
//                   }
//                 });
//               } else {
//                 console.warn(`⚠️ File with base name ${baseName} not found in ${galleryDir}`);
//               }
//             }
//           }
//         });
//       }
      
//       // Delete the helper field so it doesn't get saved to MongoDB
//       delete req.body.removedGallery;
//     }

//     // 4. Apply the final updated gallery array to the request body
//     req.body.gallery = currentGallery;

//     // 5. Cleanup
//     delete req.body.fileName;

//     // 6. Brand & Category Name Updates
//     if (req.body.brand && req.body.brand !== product.brand.toString()) {
//       const brand = await Brand.findById(req.body.brand);
//       if (brand) req.body.brandName = brand.name;
//     }
//     if (req.body.category && req.body.category !== product.category.toString()) {
//       const category = await Category.findById(req.body.category);
//       if (category) req.body.categoryName = category.name;
//     }

//     // 7. Save to Database
//     const updatedProduct = await Product.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     ).populate('brand category');

//     const baseUrl = `${req.protocol}://${req.get('host')}`;
    
//     res.json({
//       success: true,
//       message: 'Product updated successfully',
//       data: addFullUrls(updatedProduct, baseUrl),
//     });
    
//   } catch (error) {
//     console.error("Update Product Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// Helpers for gallery handling (place above updateProduct in the same file)

// Compare images by file name only, so it doesn't matter whether the DB holds
// a relative path, a Windows path, or a full URL with a different host/protocol
// (e.g. DB: "uploads\\products\\gallery\\a.jpg"  vs  client: "http://host/uploads/products/gallery/a.jpg")
const galleryKey = (u) =>
  path.basename(String(u || '').replace(/\\/g, '/').split('?')[0]).trim();

// Accepts an array, a JSON-stringified array, or a single string
const parseList = (raw) => {
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      list = [raw];
    }
  }
  return list
    .filter((x) => typeof x === 'string')
    .map((x) => x.replace(/[\[\]"]/g, '').trim())
    .filter(Boolean);
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    req.body = parseJSONFields(req.body);
    const hasVariants = req.body.variants !== undefined;
    const variantsInput = hasVariants ? parseVariantsField(req.body.variants) : undefined;
    delete req.body.variants;
    if (!hasVariants && Object.keys(req.variantFiles || {}).length) {
      return res.status(400).json({ success: false, message: 'Include the variants array when uploading variant files' });
    }

    // 1. Slug regeneration on name change
    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = generateSlug(req.body.name);
      if (await Product.findOne({ slug: req.body.slug, _id: { $ne: req.params.id } })) {
        return res.status(400).json({ success: false, message: 'Product with similar name already exists' });
      }
    }

    // Gallery state
    const storedGallery = product.gallery || [];
    let newGalleryImages = [];

    // 2. Handle uploaded files (Main Image, New Gallery Images, File Upload)
    if (req.files) {
      // A. Main Image (Replaces existing)
      if (req.files.mainImage && req.files.mainImage[0]) {
        const newMainImage = await processMainImage(req.files.mainImage[0].path);
        req.body.mainImage = newMainImage;

        if (product.mainImage && fs.existsSync(product.mainImage)) {
          try { fs.unlinkSync(product.mainImage); } catch (e) {}
        }
      }

      // B. Gallery Images (new uploads)
      if (req.files.gallery && req.files.gallery.length > 0) {
        newGalleryImages = await Promise.all(
          req.files.gallery.map(file => processGalleryImage(file.path))
        );
      }

      // C. File Upload / Brochure
      const newDoc = req.files.fileUpload?.[0];
      const userFileName = (req.body.fileName || '').trim();

      if (newDoc) {
        if (product.fileUpload?.fileUrl) {
          const oldPath = product.fileUpload.fileUrl.replace(/^\/+/, '');
          if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
        }
        req.body.fileUpload = {
          fileName: userFileName || newDoc.originalname,
          fileUrl: `/uploads/products/files/${newDoc.filename}`,
        };
      } else if (req.body.fileName !== undefined && product.fileUpload?.fileUrl) {
        req.body.fileUpload = {
          fileName: userFileName,
          fileUrl: product.fileUpload.fileUrl,
        };
      }
    }

    // 3. Handle REMOVING specific gallery images (DB + Server)
    const removedKeys = new Set();
    
    // ONLY process removedGallery
    if (req.body.removedGallery) {
      parseList(req.body.removedGallery).forEach((u) => removedKeys.add(galleryKey(u)));
      delete req.body.removedGallery;
    }

    // A. Remove from the database array
    const keptGallery = storedGallery.filter((img) => !removedKeys.has(galleryKey(img)));

    // B. Delete the physical files from the server
    if (removedKeys.size > 0) {
      console.log('🗑️ Removing gallery images from DB & Disk:', [...removedKeys]);

      // Bulletproof path resolver
      const possibleDirs = [
        path.join(process.cwd(), 'uploads', 'products', 'gallery'),
        path.join(__dirname, '..', 'uploads', 'products', 'gallery'), 
        path.join(__dirname, 'uploads', 'products', 'gallery') 
      ];

      let galleryDir = null;
      for (const dir of possibleDirs) {
        if (fs.existsSync(dir)) {
          galleryDir = dir;
          break;
        }
      }

      if (galleryDir) {
        console.log(`📁 Found gallery directory at: ${galleryDir}`);
        const files = fs.readdirSync(galleryDir);

        removedKeys.forEach((key) => {
          // key is e.g. "gallery-1794287799025-818681541.jpg" -> baseName "gallery-1794287799025-818681541"
          const baseName = path.parse(key).name; 

          // Look for the file regardless of extension (.jpg, .webp, etc.)
          const matchedFiles = files.filter((f) => f.startsWith(baseName));

          if (matchedFiles.length > 0) {
            matchedFiles.forEach((fileToDelete) => {
              const fullPath = path.join(galleryDir, fileToDelete);
              try {
                fs.unlinkSync(fullPath);
                console.log(`✅ Successfully deleted physical file: ${fullPath}`);
              } catch (err) {
                console.error(`❌ Failed to delete file: ${fullPath}`, err.message);
              }
            });
          } else {
            console.warn(`⚠️ Could not find physical file starting with: ${baseName}`);
          }
        });
      } else {
        console.error(`❌ CRITICAL: Could not find the gallery directory on the server!`);
      }
    }

    // 4. Final gallery = kept existing images + newly uploaded images
    req.body.gallery = [...keptGallery, ...newGalleryImages];

    // 5. Cleanup
    delete req.body.fileName;

    // 6. Brand & Category Name Updates
    if (req.body.brand && req.body.brand !== product.brand.toString()) {
      const brand = await Brand.findById(req.body.brand);
      if (brand) req.body.brandName = brand.name;
    }
    if (req.body.category && req.body.category !== product.category.toString()) {
      const category = await Category.findById(req.body.category);
      if (category) req.body.categoryName = category.name;
    }

    if (hasVariants) {
      req.body.variants = await prepareProductVariants(variantsInput, req.variantFiles, {
        brand: req.body.brand || product.brand,
        brandName: req.body.brandName || product.brandName,
        category: req.body.category || product.category,
        categoryName: req.body.categoryName || product.categoryName
      }, product.variants);
    }

    // 7. Save to Database
    const updatedProduct = await populateProduct(Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ));
    if (hasVariants && updatedProduct) {
      deleteRemovedVariantAssets(product.variants, updatedProduct);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: addFullUrls(updatedProduct, baseUrl),
    });

  } catch (error) {
    console.error("Update Product Error:", error);
    const isVariantValidationError = error.name === 'ValidationError'
      && Object.keys(error.errors || {}).some(field => field.startsWith('variants.'));
    res.status(error.statusCode || (isVariantValidationError ? 400 : 500)).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await deleteProductImages(product);
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = !product.isActive;
    await product.save();
    await product.populate('brand category variants.brand variants.category');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`, data: addFullUrls(product, baseUrl) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const startTime = Date.now();
    const { sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const query = buildProductQuery(req);
    const sort = sortBy === 'price' ? { discountedPrice: sortOrder === 'desc' ? -1 : 1 } : { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [products, total] = await Promise.all([
      populateProduct(Product.find(query)).sort(sort).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)),
      Product.countDocuments(query)
    ]);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      count: products.length,
      data: products.map(p => addFullUrls(p, baseUrl)),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      meta: { query: req.query.q || req.query.search || null, responseTime: `${Date.now() - startTime}ms`, totalResults: total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchAllContent = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }
    
    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Search both collections in parallel
    const [products, blogs] = await Promise.all([
      Product.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { shortDesc: searchRegex },
          { fullDesc: searchRegex },
          { categoryName: searchRegex },
          { brandName: searchRegex }
        ]
      }).limit(20),
      
      Blog.find({
        isActive: true,
        $or: [
          { title: searchRegex },
          { shortDescription: searchRegex },
          { longDescription: searchRegex },
          { category: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      }).limit(20)
    ]);
    
    // Format products
    const formattedProducts = products.map(p => ({
      type: 'product',
      id: p._id,
      title: p.name,
      description: p.shortDesc,
      image: p.mainImage ? `${baseUrl}${p.mainImage}` : null,
      slug: p.slug,
      price: p.discountedPrice || p.price,
      brand: p.brandName,
      category: p.categoryName
    }));
    
    // Format blogs
    const formattedBlogs = blogs.map(b => ({
      type: 'blog',
      id: b._id,
      title: b.title,
      description: b.shortDescription,
      image: b.mainImage ? `${baseUrl}${b.mainImage}` : null,
      slug: b.slug,
      category: b.category,
      date: b.date,
      author: b.author?.name
    }));
    
    // Combine all results
    const allResults = [...formattedProducts, ...formattedBlogs];
    
    res.json({
      success: true,
      query: searchTerm,
      count: allResults.length,
      data: allResults
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSearchFilters = async (req, res) => {
  try {
    const { q } = req.query;
    let baseQuery = { isActive: true };
    if (q?.trim()) baseQuery.$or = [
      { name: { $regex: q, $options: 'i' } },
      { categoryName: { $regex: q, $options: 'i' } },
      { brandName: { $regex: q, $options: 'i' } }
    ];
    
    const [categories, brands, priceStats] = await Promise.all([
      Product.distinct('categoryName', baseQuery),
      Product.aggregate([{ $match: baseQuery }, { $group: { _id: { id: '$brand', name: '$brandName' } } }, { $project: { _id: 0, id: '$_id.id', name: '$_id.name' } }]),
      Product.aggregate([{ $match: baseQuery }, { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } }])
    ]);
    
    res.json({
      success: true,
      data: {
        categories: categories.filter(c => c).sort(),
        brands: brands.filter(b => b?.name).sort((a, b) => a.name.localeCompare(b.name)),
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PRODUCT SUGGESTIONS ====================

export const getProductSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ isActive: true }).populate({ path: 'productId', populate: { path: 'brand', select: 'name logo' } }).limit(parseInt(req.query.limit || 20));
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      data: {
        products: suggestions.map(s => {
          const p = s.productId;
          if (!p) return null;
          return {
            type: 'product', id: p._id, name: p.name, slug: p.slug,
            brandName: p.brandName, categoryName: p.categoryName,
            image: p.mainImage ? `${baseUrl}${p.mainImage}` : null,
            price: p.discountedPrice || p.price,
            brand: p.brand ? { id: p.brand._id, name: p.brand.name, logo: p.brand.logo ? `${baseUrl}${p.brand.logo}` : null } : null
          };
        }).filter(Boolean),
        categories: [], brands: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addProductSuggestion = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (await Suggestion.findOne({ productId })) return res.status(400).json({ success: false, message: 'Product already in suggestions' });
    
    await Suggestion.create({ productId, isActive: true });
    const newSuggestion = await Suggestion.findOne({ productId }).populate({ path: 'productId', populate: { path: 'brand', select: 'name logo' } });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const p = newSuggestion.productId;
    
    res.status(201).json({
      success: true, message: 'Product added to suggestions successfully',
      data: { type: 'product', id: p._id, name: p.name, slug: p.slug, brandName: p.brandName, categoryName: p.categoryName, image: p.mainImage ? `${baseUrl}${p.mainImage}` : null, price: p.discountedPrice || p.price, isActive: newSuggestion.isActive, brand: p.brand ? { id: p.brand._id, name: p.brand.name, logo: p.brand.logo ? `${baseUrl}${p.brand.logo}` : null } : null }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeProductSuggestion = async (req, res) => {
  try {
    const suggestion = await Suggestion.findOneAndDelete({ productId: req.params.productId });
    if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found' });
    res.json({ success: true, message: 'Product removed from suggestions successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSuggestionStatus = async (req, res) => {
  try {
    const suggestion = await Suggestion.findOne({ productId: req.params.productId });
    if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found' });
    suggestion.isActive = !suggestion.isActive;
    await suggestion.save();
    res.json({ success: true, message: `Suggestion ${suggestion.isActive ? 'activated' : 'deactivated'} successfully`, data: { productId: req.params.productId, isActive: suggestion.isActive } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkAddProductSuggestions = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds?.length) return res.status(400).json({ success: false, message: 'Product IDs array is required' });
    
    const results = { added: [], skipped: [], notFound: [] };
    for (const productId of productIds) {
      if (await Suggestion.findOne({ productId })) results.skipped.push(productId);
      else if (await Product.findById(productId)) {
        await Suggestion.create({ productId, isActive: true });
        results.added.push(productId);
      } else results.notFound.push(productId);
    }
    res.json({ success: true, message: `${results.added.length} added, ${results.skipped.length} skipped, ${results.notFound.length} not found`, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};