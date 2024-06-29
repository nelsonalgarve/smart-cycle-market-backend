import { Document, Schema, model } from 'mongoose';
import categories from 'src/utils/categories';

type productImage = {
	url: string;
	id: string;
};

export interface ProductDocument extends Document {
	owner: Schema.Types.ObjectId;
	name: string;
	price: number;
	purchasingDate: Date;
	category: string;
	images?: productImage[];
	thumbnail?: string;
	description: string;
}

const schema = new Schema<ProductDocument>(
	{
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		price: {
			type: Number,
			required: true,
		},
		purchasingDate: {
			type: Date,
			required: true,
		},
		category: {
			type: String,
			enum: [...categories],
			required: true,
		},
		images: [
			{
				type: Object,
				url: String,
				id: String,
			},
		],
		thumbnail: String,
	},
	{
		timestamps: true,
	}
);

const ProductModel = model<ProductDocument>('Product', schema);

export default ProductModel;
