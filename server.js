require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const shopsRoute = require('./routes/shops');
const barbersRoute = require('./routes/barbers');
const queuesRoute = require('./routes/queues');
const userRoute = require('./routes/UserRoute');
const statusRoute = require('./routes/customerstatusRouter');

const app = express();
connectDB();

// CORS setup
app.use(cors({
  origin: '*', // allow all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
}));

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/shops', shopsRoute);
app.use('/api/barbers', barbersRoute);
app.use('/api', queuesRoute); 
app.use("/api/auth", userRoute);
app.use("/api/", statusRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
