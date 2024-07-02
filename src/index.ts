import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import formidable from 'formidable';
import path from 'path';
import authRouter from 'routes/auth';
import 'src/db';
import productRouter from './routes/product';

const app = express();

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.use(express.static('src/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API ROUTES
app.use('/auth', authRouter);
app.use('/product', productRouter);

app.use(function (err, req, res, next) {
	res.status(500).json({ message: err.message });
} as express.ErrorRequestHandler);

app.listen(8000, () => {
	console.log('Example app listening on port 8000!');
});
