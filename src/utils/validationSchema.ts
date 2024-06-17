import { isValidObjectId } from 'mongoose';
import * as yup from 'yup';
import categories from './categories';

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const passwordRegex = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
yup.addMethod(yup.string, 'email', function validateEmail(message) {
	return this.matches(emailRegex, {
		message,
		name: 'email',
		excludeEmptyString: true,
	});
});

const password = {
	password: yup
		.string()
		.min(8, 'Password must be at least 8 characters')
		.required('Password is missing!')
		.matches(passwordRegex, 'Password must contain at least one uppercase letter'),
};

export const newUserSchema = yup.object({
	name: yup.string().required('Name is missing!'),
	email: yup.string().email('Invalid email!').required('Email is missing!'),
	...password,
});

const tokenAndId = {
	id: yup.string().test({
		name: 'valid-id',
		message: 'Invalid user Id!',
		test: (value) => {
			return isValidObjectId(value);
		},
	}),

	token: yup.string().required('Token is missing!'),
};

export const verifyTokenSchema = yup.object({
	...tokenAndId,
});

export const resetPassSchema = yup.object({
	...tokenAndId,
	...password,
});

export const newProductSchema = yup.object({
	name: yup.string().required('Name is missing!'),
	description: yup.string().required('Description is missing!'),
	category: yup.string().oneOf(categories, 'Invalid category!').required('Category is missing!'),
	price: yup
		.number()
		.transform((value) => {
			if (isNaN(+value)) return '';
			return +value;
		})
		.required('Price is missing!'),
	purchasingDate: yup.date().required('Purchasing date is missing!'),
});
