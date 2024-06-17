import { Router } from 'express';
import { listNewProduct } from 'src/controllers/product';
import { isAuth } from 'src/middleware/auth';
import fileParser from 'src/middleware/fileParser';
import validate from 'src/middleware/validator';
import { newProductSchema } from 'src/utils/validationSchema';

const productRouter = Router();

productRouter.get('/list', isAuth, fileParser, validate(newProductSchema), listNewProduct);

export default productRouter;
