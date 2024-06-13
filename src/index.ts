import express from 'express';

const app = express();

app.get('/', (req, res) => {
	res.status(405).json({ message: 'Method not allowed' });
});

app.post('/', (req, res) => {
	req.on('data', (chunk) => {
		console.log(JSON.parse(chunk));
		res.status(405).json({ message: 'This message is coming from post request' });
	});
});

app.listen(8000, () => {
	console.log('Example app listening on port 8000!');
});
