const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'your_secret_key';

// MongoDB Atlas-қа қосылу
mongoose.connect('mongodb+srv://baymukach:admin1234@cluster0.cvs8ciq.mongodb.net/jwtAuth?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB Atlas қосылды'))
  .catch(err => console.log(err));

// ----------------- Сіздің API маршруттары -----------------

// Mongoose User схемасы
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

// ТІРКЕЛУ
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ username, password: hashedPassword, role });
  await newUser.save();

  res.status(201).json({ message: 'Пайдаланушы тіркелді' });
});

// КІРУ
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Bad Name' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Bad password' });

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

// Барлық қолданушыларды алу
app.get('/users', async (req, res) => {
  const users = await User.find({}, '-password'); // парольді көрсетпей
  res.json(users);
});

// Бір қолданушыны алу
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id, '-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Жаңа қолданушы қосу
app.post('/users', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: "Жаңа қолданушы қосылды" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Қате пайда болды" });
  }
});

// Қолданушыны жаңарту
app.put('/users/:id', async (req, res) => {
  const { username, password, role } = req.body;

  let updateData = { username, role };
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateData.password = hashedPassword;
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, select: '-password' });
  if (!updatedUser) return res.status(404).json({ message: 'User not found' });

  res.json(updatedUser);
});

// Қолданушыны өшіру
app.delete('/users/:id', async (req, res) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id);
  if (!deletedUser) return res.status(404).json({ message: 'User not found' });

  res.json({ message: 'User deleted' });
});

// ------------------------------------------------------------

// ----------------- ЕҢ СОҢЫНДА Angular Build көрсету -----------------

// Angular-дың build файлын көрсету
app.use(express.static(path.join(__dirname, 'dist/jwt-auth-client/browser')));

// Барлық басқа сұраныстарды Angular-дың index.html файлына бағыттау
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist/jwt-auth-client/browser', 'index.html'));
});

// ------------------------------------------------------------

// Серверді іске қосу
app.listen(3000, () => console.log('Сервер 3000 портта'));
