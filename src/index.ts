import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from './routes/index.js';
import morgan from 'morgan';
const app = express();
app.use(morgan('dev'));
// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Healthcheck
app.get('/ping', (req, res) => res.send('pong 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CRM Backend running on http://localhost:${PORT}`);
});