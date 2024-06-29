import { UploadApiResponse } from 'cloudinary';
import { RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';
import cloudUploader, { cloudApi } from 'src/cloud';
import ProductModel from 'src/models/products';
import { UserDocument } from 'src/models/user';
import categories from 'src/utils/categories';
import { sendErrorRes } from 'src/utils/helper';

const uploadImage = (filePath: string): Promise<UploadApiResponse> => {
	return cloudUploader.upload(filePath, {
		width: 1280,
		height: 720,
		crop: 'fill',
	});
};

export const listNewProduct: RequestHandler = async (req, res) => {
	/*
  User must be authenticated.
  User can upload images as well.
  Validate incoming data.
  Create Product.
  Validate and Upload File (or Files) - note (restrict image qty).
  And send the response back.
	  */
	const { name, price, category, description, purchasingDate } = req.body;
	const newProduct = new ProductModel({
		owner: req.user.id,
		name,
		price,
		category,
		description,
		purchasingDate,
	});

	const { images } = req.files;

	const isMultipleImages = Array.isArray(images);

	if (isMultipleImages && images.length > 5) {
		return sendErrorRes(res, 'Image files can not be more than 5!', 422);
	}

	let invalidFileType = false;

	// if this is the case we have multiple images
	if (isMultipleImages) {
		for (let img of images) {
			if (!img.mimetype?.startsWith('image')) {
				invalidFileType = true;
				break;
			}
		}
	} else {
		if (images) {
			if (!images.mimetype?.startsWith('image')) {
				invalidFileType = true;
			}
		}
	}

	if (invalidFileType) return sendErrorRes(res, 'Invalid file type, files must be image type!', 422);

	// FILE UPLOAD

	if (isMultipleImages) {
		const uploadPromise = images.map((file) => uploadImage(file.filepath));
		// Wait for all file uploads to complete
		const uploadResults = await Promise.all(uploadPromise);
		// Add the image URLs and public IDs to the product's images field
		newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
			return { url: secure_url, id: public_id };
		});

		newProduct.thumbnail = newProduct.images[0].url;
	} else {
		if (images) {
			const { secure_url, public_id } = await uploadImage(images.filepath);
			newProduct.images = [{ url: secure_url, id: public_id }];
			newProduct.thumbnail = secure_url;
		}
	}

	await newProduct.save();

	res.status(201).json({ message: 'Added new product!' });
};

export const updateProduct: RequestHandler = async (req, res) => {
	/*
  User must be authenticated.
  User can upload images as well.
  Validate incoming data.
  Update normal properties (if the product is made by the same user).
  Upload and update images (restrict image qty).
  And send the response back.
	  */

	const { name, price, category, description, purchasingDate, thumbnail } = req.body;
	const productId = req.params.id;
	if (!isValidObjectId(productId)) return sendErrorRes(res, 'Invalid product id!', 422);

	const product = await ProductModel.findOneAndUpdate(
		{ _id: productId, owner: req.user.id },
		{
			name,
			price,
			category,
			description,
			purchasingDate,
		},
		{
			new: true,
		}
	);
	if (!product) return sendErrorRes(res, 'Product not found!', 404);

	if (typeof thumbnail === 'string') product.thumbnail = thumbnail;

	const { images } = req.files;
	const isMultipleImages = Array.isArray(images);

	if (isMultipleImages) {
		const oldImages = product.images?.length || 0;
		console.log('oldImages', oldImages);

		if (oldImages + images.length > 5) return sendErrorRes(res, 'Image files can not be more than 5!', 422);
	}
	if (images) {
		if (!product.images) product.images = [];
		if (product.images.length + 1 > 5) return sendErrorRes(res, 'Image files can not be more than 5!', 422);
	}

	let invalidFileType = false;

	// if this is the case we have multiple images
	if (isMultipleImages) {
		for (let img of images) {
			if (!img.mimetype?.startsWith('image')) {
				invalidFileType = true;
				break;
			}
		}
	} else {
		if (images) {
			if (!images.mimetype?.startsWith('image')) {
				invalidFileType = true;
			}
		}
	}

	if (invalidFileType) return sendErrorRes(res, 'Invalid file type, files must be image type!', 422);

	// FILE UPLOAD

	if (isMultipleImages) {
		const uploadPromise = images.map((file) => uploadImage(file.filepath));
		// Wait for all file uploads to complete
		const uploadResults = await Promise.all(uploadPromise);
		// Add the image URLs and public IDs to the product's images field
		const newImages = uploadResults.map(({ secure_url, public_id }) => {
			return { url: secure_url, id: public_id };
		});

		if (product.images) product.images.push(...newImages);
		else product.images = newImages;
	} else {
		if (images) {
			const { secure_url, public_id } = await uploadImage(images.filepath);
			if (product.images) product.images.push({ url: secure_url, id: public_id });
			else product.images = [{ url: secure_url, id: public_id }];
		}
	}

	await product.save();

	res.status(201).json({ message: 'Product updated successfully.' });
};

export const deleteProduct: RequestHandler = async (req, res) => {
	const productId = req.params.id;
	if (!isValidObjectId(productId)) return sendErrorRes(res, 'Invalid product id!', 422);
	const product = await ProductModel.findOneAndDelete({ _id: productId, owner: req.user.id });

	if (!product) return sendErrorRes(res, 'Product not found!', 404);

	const images = product.images;
	if (!images) return sendErrorRes(res, 'Product has no images!', 404);

	if (images.length) {
		const ids = images.map(({ id }) => id);
		await cloudApi.delete_resources(ids);
	}

	res.status(200).json({ message: 'Product removed successfully.' });
};

export const deleteProductImage: RequestHandler = async (req, res) => {
	const { productId, imageId } = req.params;
	if (!isValidObjectId(productId)) return sendErrorRes(res, 'Invalid product id!', 422);
	const product = await ProductModel.findOneAndUpdate(
		{ _id: productId, owner: req.user.id },
		{ $pull: { images: { id: imageId } } },
		{ new: true }
	);
	if (!product) return sendErrorRes(res, 'Product not found!', 404);

	if (!product.thumbnail || !product.images) return sendErrorRes(res, 'Product has no images!', 404);
	if (product.thumbnail.includes(imageId)) {
		product.thumbnail = product.images[0].url;
		await product.save();
	}

	await cloudUploader.destroy(imageId);

	res.json({ message: 'Image removed successfully', product });
};

export const getProductDetail: RequestHandler = async (req, res) => {
	const productId = req.params.id;
	if (!isValidObjectId(productId)) return sendErrorRes(res, 'Invalid product id!---', 422);
	const product = await ProductModel.findById(productId).populate<{ owner: UserDocument }>('owner');
	if (!product) return sendErrorRes(res, 'Product not found!', 404);

	res.json({
		product: {
			id: product._id,
			name: product.name,
			desciption: product.description,
			thumbnail: product.thumbnail,
			category: product.category,
			date: product.purchasingDate,
			price: product.price,
			images: product.images?.map(({ url }) => url),
			seller: { id: product.owner._id, name: product.owner.name, avatar: product.owner.avatar?.url },
		},
	});
};

export const getProductsByCategory: RequestHandler = async (req, res) => {
	const { category } = req.params;
	const { pageNo = '1', limit = '10' } = req.query as { pageNo: string; limit: string };
	if (!categories.includes(category)) return sendErrorRes(res, 'Invalid category!', 422);

	const products = await ProductModel.find({ category })
		.sort({ createdAt: -1 })
		.skip((+pageNo - 1) * +limit)
		.limit(+limit);

	const listing = products.map((p) => {
		return {
			id: p._id,
			name: p.name,
			desciption: p.description,
			thumbnail: p.thumbnail,
			category: p.category,
			date: p.purchasingDate,
			price: p.price,
		};
	});

	res.json({ listing });
};

export const getLatestProducts: RequestHandler = async (req, res) => {
	console.log('Hello');

	const products = await ProductModel.find().sort({ createdAt: -1 }).limit(10);

	const listings = products.map((p) => {
		return {
			id: p._id,
			name: p.name,
			thumbnail: p.thumbnail,
			category: p.category,
			price: p.price,
		};
	});

	res.json({ products: listings });
};

export const getListings: RequestHandler = async (req, res) => {
	const { pageNo = '1', limit = '10' } = req.query as { pageNo: string; limit: string };
	const { id } = req.user;
	if (!isValidObjectId(id)) return sendErrorRes(res, 'Invalid user!', 422);
	const products = await ProductModel.find({ owner: id })
		.populate<{ owner: UserDocument }>('owner')
		.sort({ createdAt: -1 })
		.skip((+pageNo - 1) * +limit)
		.limit(+limit);

	const listings = products.map((p) => {
		return {
			id: p._id,
			name: p.name,
			thumbnail: p.thumbnail,
			category: p.category,
			price: p.price,
			images: p.images?.map(({ url }) => url),
			date: p.purchasingDate,
			description: p.description,
			seller: { id: p.owner._id, name: p.owner.name, avatar: p.owner.avatar?.url },
		};
	});

	res.json({ products: listings });
};
