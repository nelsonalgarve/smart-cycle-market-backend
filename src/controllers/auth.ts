import crypto from 'crypto';
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import AuthVerificationTokenModel from 'models/authVerificationToken';
import UserModel from 'models/user';
import nodemailer from 'nodemailer';
import { sendErrorRes } from 'src/utils/helper';

export const createNewUser: RequestHandler = async (req, res) => {
	// 1. Read incomming data like: name, email, password
	const { name, email, password } = req.body;

	// 2. Validate if the data is ok or not
	// 3. Send Error if not
	// if (!name) return sendErrorRes(res, 'Name is missing fff', 422);
	// if (!email) return sendErrorRes(res, 'Email is missing', 422);
	// if (!password) return sendErrorRes(res, 'Password is missing', 422);

	// 4. Check if we already have an account with the same user
	const user1 = await UserModel.findOne({ email });
	if (user1) return sendErrorRes(res, 'User already exists', 401);

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

export const verifyEmail: RequestHandler = async (req, res) => {
	/*
    1. Read incomming data like: id and token
    2. Find the token inside DB
    3. Send Error if token not found
    4. Check if the token is valid or not
    6. Remove token from database
    7. Send success message
    5. If not valid send error, otherwise update user is verified
    */
	const { id, token } = req.body;
	if (!id) return sendErrorRes(res, 'Id is missing', 422);
	if (!token) return sendErrorRes(res, 'Token is missing', 422);

	const authToken = await AuthVerificationTokenModel.findOne({ owner: id });
	if (!authToken) return sendErrorRes(res, 'Unauthorized request ', 403);

	const isMatched = await authToken.compareToken(token);
	if (!isMatched) return sendErrorRes(res, 'Unauthorized request, invalid Token!', 403);

	await UserModel.findByIdAndUpdate(id, { verified: true });

	await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

	res.json({ message: 'Thanks for joining us, your email is verified.' });
};

export const signIn: RequestHandler = async (req, res) => {
	// 1. Read incomming data like: email, password
	const { email, password } = req.body;

	// 2. Validate if the data is ok or not
	if (!email) return sendErrorRes(res, 'Email is missing', 422);
	if (!password) return sendErrorRes(res, 'Password is missing', 422);

	// 3. Check if we already have an account with the same user
	const user = await UserModel.findOne({ email });
	if (!user) return sendErrorRes(res, 'Email/password misatch!', 403);

	// 4. Check if the password is correct
	const isMatched = await user.comparePassword(password);
	if (!isMatched) return sendErrorRes(res, 'Email/password misatch!', 403);

	// 5. Generate and store verification token

	const payload = { id: user._id };
	const accessToken = jwt.sign(payload, 'secret', {
		expiresIn: '15m',
	});
	const refreshToken = jwt.sign(payload, 'secret');

	if (!user.tokens) user.tokens = [refreshToken];
	else user.tokens.push(refreshToken);

	await user.save();

	res.json({
		profile: {
			id: user._id,
			email: user.email,
			name: user.name,
			verified: user.verified,
		},
		tokens: {
			refresh: refreshToken,
			access: accessToken,
		},
	});
};
