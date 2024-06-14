import { createNewUser, sendProfile, signIn, verifyEmail } from 'controllers/auth';
import { Router } from 'express';
import { isAuth } from 'src/middleware/auth';
import validate from 'src/middleware/validator';
import { newUserSchema, verifyTokenSchema } from 'src/utils/validationSchema';

const authRouter = Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', validate(verifyTokenSchema), verifyEmail);
authRouter.post('/sign-in', signIn);
authRouter.get('/profile', isAuth, sendProfile);
authRouter.post('/refresh-token');

export default authRouter;
