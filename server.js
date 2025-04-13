const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'your_secret_key'; // Құпия кілт

mongoose.connect('mongodb://localhost:27017/jwtAuth', {
}).then(() => console.log('MongoDB қосылды'))
  .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

app.get('/admin-data', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Токен жоқ' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Токен жарамсыз' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Тек админге рұқсат' });

    res.json({ message: 'Тек админге арналған мәліметтер' });
  });
});



app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ username, password: hashedPassword, role });
  await user.save();

  res.status(201).json({ message: 'Пайдаланушы тіркелді' });
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Қате логин немесе құпия сөз' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Қате логин немесе құпия сөз' });

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

app.listen(3000, () => console.log('Сервер 3000 портта'));
