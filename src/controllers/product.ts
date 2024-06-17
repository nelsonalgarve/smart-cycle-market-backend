import { UploadApiResponse } from 'cloudinary';
import { RequestHandler } from 'express';
import cloudUploader from 'src/cloud';
import ProductModel from 'src/models/products';
import { sendErrorRes } from 'src/utils/helper';

const uploadImage = (filePath: string): Promise<UploadApiResponse> => {
	return cloudUploader.upload(filePath, {
		width: 1280,
		height: 720,
		crop: 'fill',
	});
};

export const listNewProduct: RequestHandler = async (req, res) => {
	const { name, description, category, price, purchasingDate } = req.body;
	const newProduct = await ProductModel.create({ name, description, category, price, purchasingDate });
	const { images } = req.files;

	const isMultipleImages = Array.isArray(images);
	let invalidFileType = false;

	if (isMultipleImages) {
		for (let img of images) {
			if (!img.mimetype?.startsWith('image')) {
				invalidFileType = true;
				break;
			}
		}
	} else {
		if (!images.mimetype?.startsWith('image')) {
			invalidFileType = true;
		}
	}

	if (invalidFileType) {
		return sendErrorRes(res, 'Invalid file type!', 422);
	}

	if (isMultipleImages) {
		const uploadPromise = images.map((file) => {
			uploadImage(file.filepath);
		});
		const uploadResults = await Promise.all(uploadPromise);
		newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
			return {
				url: secure_url,
				id: public_id,
			};
		});
		newProduct.thumbnail = newProduct.images[0].url;
	}
};
