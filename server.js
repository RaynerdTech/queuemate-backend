// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const shopsRoute = require('./routes/shops');
const barbersRoute = require('./routes/barbers');
const queuesRoute = require('./routes/queues');
const userRoute = require('./routes/UserRoute');

const app = express();
connectDB();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/shops', shopsRoute);
app.use('/api/shops', barbersRoute); // barbers nested under shops
app.use('/api/shops', queuesRoute); // queues nested under shops
app.use("/api/auth", userRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
