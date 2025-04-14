const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'your_secret_key'; 

mongoose.connect('mongodb://localhost:27017/jwtAuth', {
}).then(() => console.log('MongoDB қосылды'))
  .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

app.post('/register', async(req, res) => {
  const {username, password, role} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({username, password: hashedPassword, role});
  await newUser.save();

  res.status(201).json({ message: 'Пайдаланушы тіркелді' });
})

app.post('/login', async(req, res) => {
  const {username, password} = req.body;
  const user = await User.findOne({username});
  if(!user) return res.status(400).json({ message: 'Bad Name' });

  const isMatch = await bcrypt.compare(password, user.password);
  if(!isMatch) return res.status(400).json({ message: 'Bad password' });


  const token = jwt.sign(
    {userId: user._id, role: user.role},
    SECRET_KEY,
    {expiresIn: '1h'}
  )

  res.json({token});

})





app.listen(3000, () => console.log('Сервер 3000 портта'));
