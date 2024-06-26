import { compare, genSalt, hash } from 'bcrypt';
import { Document, ObjectId, Schema, model } from 'mongoose';

export interface UserDocument extends Document {
	_id: ObjectId;
	name: string;
	email: string;
	password: string;
	verified: boolean;
	tokens: string[];
	avatar?: { id: string; url: string };
}

interface Methods {
	comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument, {}, Methods>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			// match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		verified: {
			type: Boolean,
			required: true,
			default: false,
		},
		tokens: [String],
		avatar: {
			type: Object,
			id: String,
			url: String,
		},
	},
	{
		timestamps: true,
	}
);

userSchema.pre('save', async function (next) {
	if (this.isModified('password') || this.isNew) {
		const salt = await genSalt(10);
		this.password = await hash(this.password, salt);
	}
	next();
});

userSchema.methods.comparePassword = async function (password) {
	return await compare(password, this.password);
};

const UserModel = model('User', userSchema);

export default UserModel;
