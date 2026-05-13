import express from 'express';
import cors, { CorsOptions } from 'cors';
import 'dotenv/config';
import routes from './routes/index.js';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
app.use(cookieParser());
app.use(morgan('dev'));


const allowedOrigins: (string | undefined)[] = [
  process.env.ORIGIN,
  'https://whaazz.invity.site',
  'http://localhost:3000',
  'vscode-webview://'
];

const corsOptions: CorsOptions = {
origin: 'https://whaazz.invity.site', 
  credentials: true,                  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
const io = new Server(httpServer, {
  cors: corsOptions,
});
// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Healthcheck
app.get('/ping', (req, res) => res.send('pong 🚀'));

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connecté au socket:', socket.id);
  socket.on('join_instance', (instanceName) => {
    socket.join(instanceName);
  });
});
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ CRM Backend running on http://localhost:${PORT}`);
});