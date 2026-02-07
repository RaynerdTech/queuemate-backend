const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({ token, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "This email isn't registered. Please create an account to log in." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, userId: user._id, shopId: user.shop });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Logout (frontend can just remove token, but you can implement server-side if needed)
exports.logout = (req, res) => {
  res.json({ message: "Logged out" });
};
