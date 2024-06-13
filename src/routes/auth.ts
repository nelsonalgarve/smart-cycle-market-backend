import { createNewUser } from 'controllers/auth';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/sign-up', createNewUser);
authRouter.post('/sign-in');
authRouter.post('/verify');
authRouter.post('/refresh-token');

export default authRouter;
