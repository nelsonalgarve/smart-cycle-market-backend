import { createNewUser, signIn, verifyEmail } from 'controllers/auth';
import { Router } from 'express';
import validate from 'src/middleware/validator';
import { newUserSchema, verifyTokenSchema } from 'src/utils/validationSchema';

const authRouter = Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', validate(verifyTokenSchema), verifyEmail);
authRouter.post('/sign-in', signIn);
authRouter.post('/refresh-token');

export default authRouter;
