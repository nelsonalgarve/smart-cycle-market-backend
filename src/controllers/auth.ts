import crypto from 'crypto';
import { RequestHandler } from 'express';
import AuthVerificationTokenModel from 'models/authVerificationToken';
import UserModel from 'models/user';
import nodemailer from 'nodemailer';
import { sendErrorRes } from 'src/utils/helper';

export const createNewUser: RequestHandler = async (req, res) => {
	// 2. Validate if the data is ok or not
	// 3. Send Error if not
	// 4. Check if e already have an account with the same user
	// 5. Send error if yes, otherwise create a new account and save user in DB
	// 8. Send message back to check email
	// 1. Read incomming data like: name, email, password
	const { name, email, password } = req.body;

	// 2. Validate if the data is ok or not
	// 3. Send Error if not
	if (!name) return sendErrorRes(res, 'Name is missing', 422);
	if (!email) return res.status(422).send('Email is missing');
	if (!password) return res.status(422).send('Password is missing');

	// 4. Check if we already have an account with the same user
	const user1 = await UserModel.findOne({ email });
	if (user1) return res.status(401).json({ message: 'User already exists' });

	// 5. Create a new account and save user in DB

	const user = await UserModel.create({ name, email, password });

	// 6. Generate and store verification token

	const token = crypto.randomBytes(36).toString('hex');
	const authVerificationToken = await AuthVerificationTokenModel.create({
		owner: user._id,
		token,
	});

	// 7. Send verification mail with token to registered email
	const link = `http://localhost:8000/auth/?verify=${user._id}&token=${token}`;

	// Send message back to check email

	const transport = nodemailer.createTransport({
		host: 'sandbox.smtp.mailtrap.io',
		port: 2525,
		auth: {
			user: '073f2cfa3092ec',
			pass: 'b85cd9517262d0',
		},
	});

	await transport.sendMail({
		from: 'verification@myapp.com',
		to: user.email,
		html: `<h1>Please click on <a href="${link}">this link </a>to verify your account.</h1>`,
	});

	res.json({ message: 'Please check your inbox!', link });
};
