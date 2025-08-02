  const express = require('express');
  const cors = require('cors');
  const dns = require('dns');
  const urlParser = require('url');
  const bodyParser = require('body-parser');

  const app = express();
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use('/public', express.static(`${process.cwd()}/public`));

  // In-memory url store
  const urlDatabase = [];
  let urlCount = 1;

  app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

  // POST new URL to shorten
  app.post('/api/shorturl', (req, res) => {
    const original_url = req.body.url;

    // Validate URL format with regex (must start with http or https)
    const urlRegex = /^(https?:\/\/)/i;
    if (!urlRegex.test(original_url)) {
      return res.json({ error: 'invalid url' });
    }

    // Parse hostname for DNS lookup
    const hostname = urlParser.parse(original_url).hostname;

    dns.lookup(hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Check if url already shortened
      const found = urlDatabase.find(item => item.original_url === original_url);
      if (found) {
        return res.json({ original_url: found.original_url, short_url: found.short_url });
      }

      // Save new url and assign short_url
      const short_url = urlCount++;
      urlDatabase.push({ original_url, short_url });

      res.json({ original_url, short_url });
    });
  });

  // GET redirect to original URL by short_url
  app.get('/api/shorturl/:short_url', (req, res) => {
    const short_url = Number(req.params.short_url);
    const found = urlDatabase.find(item => item.short_url === short_url);

    if (found) {
      return res.redirect(found.original_url);
    } else {
      return res.json({ error: 'No short URL found for the given input' });
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
