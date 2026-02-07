const jwt = require('jsonwebtoken');

const barberAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'barber') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // CRITICAL FIX: Sync barberId → id
    // Your JWT has 'barberId' but controllers expect 'id'
    if (decoded.barberId) {
      decoded.id = decoded.barberId; // Copy barberId to id
    }
    
    req.barber = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = barberAuth;