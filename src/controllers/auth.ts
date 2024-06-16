import crypto from 'crypto';
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import AuthVerificationTokenModel from 'models/authVerificationToken';
import UserModel from 'models/user';
import PasswordResetTokenModel from 'src/models/passwordResetToken';
import { sendErrorRes } from 'src/utils/helper';
import mail from 'src/utils/mail';

const { VERIFICATION_LINK } = process.env;
const { PASSWORD_RESET_LINK } = process.env;
const JWT_SECRET = process.env.JWT_SECRET!;

export const createNewUser: RequestHandler = async (req, res) => {
	const { name, email, password } = req.body;

	const user1 = await UserModel.findOne({ email });
	if (user1) return sendErrorRes(res, 'User already exists', 401);

	// 5. Create a new account and save user in DB

	const user = await UserModel.create({ name, email, password });

	// 6. Generate and store verification token

	const token = crypto.randomBytes(36).toString('hex');
	await AuthVerificationTokenModel.create({
		owner: user._id,
		token,
	});

	// 7. Send verification mail with token to registered email
	const link = `${VERIFICATION_LINK}?id=${user._id}&token=${token}`;

	// Send message back to check email

	await mail.sendVerification(user.email, link);

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
	/**
  1. Read incoming data like: email and password
  2. Find user with the provided email.
  3. Send error if user not found.
  4. Check if the password is valid or not (because pass is in encrypted form).
  5. If not valid send error otherwise generate access & refresh token.
  6. Store refresh token inside DB.
  7. Send both tokens to user.
	  **/

	const { email, password } = req.body;

	const user = await UserModel.findOne({ email });
	if (!user) return sendErrorRes(res, 'Email/Password mismatch!', 403);

	const isMatched = await user.comparePassword(password);
	if (!isMatched) return sendErrorRes(res, 'Email/Password mismatch!', 403);

	const payload = { id: user._id };

	const accessToken = jwt.sign(payload, JWT_SECRET, {
		expiresIn: '15m',
	});
	const refreshToken = jwt.sign(payload, JWT_SECRET);

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
		tokens: { refresh: refreshToken, access: accessToken },
	});
};

export const sendProfile: RequestHandler = (req, res) => {
	res.json({ profile: { ...req.user } });
};

export const generateVerificationLink: RequestHandler = async (req, res) => {
	const { id, email } = req.user;

	const token = crypto.randomBytes(36).toString('hex');
	const link = `${VERIFICATION_LINK}?id=${id}&token=${token}`;

	await AuthVerificationTokenModel.findOneAndDelete({ owner: id });
	await AuthVerificationTokenModel.create({ owner: id, token });

	await mail.sendVerification(email, link);

	res.json({ message: 'Please check your email.' });
};

export const grantAccessToken: RequestHandler = async (req, res) => {
	/**
  1. Read and verify refresh token
  2. Find user with payload.id and refresh token
  3. If the refresh token is valid and no user found, token is compromised.
  4. Remove all the previous tokens and send error response.
  5. If the the token is valid and user found create new refresh and access token.
  6. Remove previous token, update user and send new tokens.  
	**/

	const { refreshToken } = req.body;

	if (!refreshToken) return sendErrorRes(res, 'Unauthorized request!', 403);

	const payload = jwt.verify(refreshToken, 'JWT_SECRET') as { id: string };

	if (!payload.id) return sendErrorRes(res, 'Unauthorized request!', 401);

	const user = await UserModel.findOne({
		_id: payload.id,
		tokens: refreshToken,
	});

	if (!user) {
		// user is compromised, remove all the previous tokens
		await UserModel.findByIdAndUpdate(payload.id, { tokens: [] });
		return sendErrorRes(res, 'Unauthorized request!', 401);
	}

	const newAccessToken = jwt.sign({ id: user._id }, 'JWT_SECRET', {
		expiresIn: '15m',
	});
	const newRefreshToken = jwt.sign({ id: user._id }, 'JWT_SECRET');

	const filteredTokens = user.tokens.filter((t) => t !== refreshToken);
	user.tokens = filteredTokens;
	user.tokens.push(newRefreshToken);
	await user.save();

	res.json({
		tokens: { refresh: newRefreshToken, access: newAccessToken },
	});
};

export const signOut: RequestHandler = async (req, res) => {
	const { refreshToken } = req.body;
	const user = await UserModel.findOne({ _id: req.user.id, tokens: refreshToken });
	if (!user) return sendErrorRes(res, 'Unauthorized request, user not found! from signout', 403);

	const newTokens = user.tokens.filter((t) => t !== refreshToken);
	user.tokens = newTokens;
	await user.save();

	res.send();
};

export const generateForgetPassLink: RequestHandler = async (req, res) => {
	/*
	1. Ask for user email *
	2. Find user with the given email in dB *
	3. Send error if no user *
	4. Else generate password reset token (first remove if there is any)
	5. Generate reset link (like we did for verification)
	6. Send link inside user's email
	7. Send response back
	*/
	const { email } = req.body;

	const user = await UserModel.findOne({ email });
	if (!user) return sendErrorRes(res, 'Account not found', 404);

	// Remove token
	await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

	// Create new token
	const token = crypto.randomBytes(36).toString('hex');
	await PasswordResetTokenModel.create({ owner: user._id, token });

	// Send the link to email
	const passResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;
	await mail.sendPasswordResetLink(user.email, passResetLink);

	// Send response

	res.json({ message: 'Please check your email!', user });
};

export const grantValid: RequestHandler = (req, res) => {
	res.json({ valid: true });
};

export const updatePassword: RequestHandler = async (req, res) => {
	const { id, password } = req.body;
	const user = await UserModel.findById(id);
	if (!user) return sendErrorRes(res, 'Unauthorized access', 403);

	const matched = await user.comparePassword(password);
	if (matched) return sendErrorRes(res, 'The new password must be different!', 422);

	user.password = password;
	await user.save();

	await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

	mail.sendPasswordUpdateMessage(user.email);

	res.json({ message: 'Password resets successfully.' });
};

export const updateProfile: RequestHandler = async (req, res) => {
	const { name } = req.body;

	if (typeof name !== 'string' || name.trim().length < 3) {
		return sendErrorRes(res, 'Unauthorized access!', 403);
	}

	const user = await UserModel.findByIdAndUpdate(req.user.id, { name }, { new: true });
	if (!user) return sendErrorRes(res, 'Unauthorized access!', 403);

	res.json({
		profile: {
			id: user.id,
			name: user.name,
			email: user.email,
			verified: user.verified,
		},
		test: {
			...req.user,
			name,
		},
	});
};

export const updateAvatar: RequestHandler = async (req, res) => {
	const { avatar } = req.files;

	if (Array.isArray(avatar)) {
		return sendErrorRes(res, 'Multiple files are not allowed', 422);
	}

	if (!avatar.mimetype?.startsWith('image')) {
		return sendErrorRes(res, 'Invalid image file!', 422);
	}
};
