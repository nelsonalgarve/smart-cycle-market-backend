import { connect } from 'mongoose';

const uri = 'mongodb://localhost:27017/smart-cycle-market';

connect(uri)
	.then(() => {
		console.log('Connected to DB');
	})
	.catch((err) => {
		console.log('db connection error:', err);
	});
