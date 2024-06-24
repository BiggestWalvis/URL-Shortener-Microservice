require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

//require Mongoose database and require the dns lookup function required by freeCodeCamp
const { MongoClient } = require('mongodb');
const dns = require('dns')
const urlparser = require('url')


const client = new MongoClient(process.env.MONGO_URL)
const db = client.db("urlshortner")
const urls = db.collection("urls")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
//extra middleware required
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  //we post the given URL to the mongoose database
  const url = req.body.url
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, 
async (err, address) => {
  //if the url is not a real url
  if (!address){
    res.json({error: "Invalid URL"})
  }else {
    //add the real url to the database and record the short_url associated with it
    const urlCount = await urls.countDocuments({})
    const urlDoc = {
      url,
      short_url: urlCount
    }
    
    //return the url and short url
    const result = await urls.insertOne(urlDoc)
    console.log(result);
    res.json({ original_url: url, short_url : urlCount})

  }
})
});

//if only the short url is provided to api/short_url, then we get the associated original url and redirect the user to the original
app.get("/api/shorturl/:short_url", async (req,res) => {
  const shorturl = req.params.short_url
  const urlDoc = await urls.findOne({ short_url: +shorturl })
  res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
