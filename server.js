const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

const MONGO_URI = "mongodb+srv://d3stiny:%z6LFres&2^Fi46@roshorts.7hfty.mongodb.net/?retryWrites=true&w=majority&appName=RoShorts";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortId: { type: String, required: true, unique: true },
});

const Url = mongoose.model('Url', urlSchema);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/shorten', async (req, res) => {
  const { originalUrl, turnstileResponse } = req.body;

  if (!originalUrl || !turnstileResponse) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  try {
    const turnstileVerify = await axios.post(
      `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
      new URLSearchParams({
        secret: "0x4AAAAAAA3ztCOA0XhUN57O",
        response: turnstileResponse,
      })
    );

    if (!turnstileVerify.data.success) {
      return res.status(403).json({ error: 'Turnstile verification failed.' });
    }

    const shortId = shortid.generate();
    const newUrl = new Url({ originalUrl, shortId });
    await newUrl.save();

    res.json({ shortUrl: `https://url.roblox.us.kg/${shortId}` });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Try again later.' });
  }
});

app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;

  try {
    const urlEntry = await Url.findOne({ shortId });
    if (!urlEntry) {
      return res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
    }
    res.redirect(urlEntry.originalUrl);
  } catch (err) {
    res.status(500).send('Server error.');
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));