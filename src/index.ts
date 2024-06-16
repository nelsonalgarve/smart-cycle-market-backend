import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import formidable from 'formidable';
import path from 'path';
import authRouter from 'routes/auth';
import 'src/db';

const app = express();

app.use(express.static('src/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API ROUTES
app.use('/auth', authRouter);

app.post('/upload-file', async (req, res) => {
	const form = formidable({
		uploadDir: path.join(__dirname, 'public'),
		filename(name, ext, part, form) {
			console.log('name', name);
			console.log('ext', ext);
			console.log('part', part);
			// console.log('form', form);
			return Date.now() + '-' + part.originalFilename;
		},
	});

	await form.parse(req);

	res.send('ok');
});

app.use(function (err, req, res, next) {
	res.status(500).json({ message: err.message });
} as express.ErrorRequestHandler);

app.listen(8000, () => {
	console.log('Example app listening on port 8000!');
});
