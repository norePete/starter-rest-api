const express = require('express')
const app = express()
const fs = require('fs')
const db = require('@cyclic.sh/dynamodb')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

 
var options = {
	dotfiles: 'ignore',
	etag: false,
	extensions: ['htm', 'html','css','js','ico','jpg','jpeg','png','svg'],
	index: ['index.html'],
	maxAge: '1m',
	redirect: false
}

app.use(express.static('beam', options))

// #############################################################################
// This configures static hosting for files in /public that have the extensions
// listed in the array.
// #############################################################################

app.get('/', function(req, res) {
    res.send('root');
});
app.get('/rotate', function(req, res) {

    fs.readFile('beam/css/dynamic.css')
    .then(data => {
        const hexCharacters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        function getRandomCharacter() {
            const randomIndex = Math.floor(Math.random() * hexCharacters.length);
            return hexCharacters[randomIndex];
        }
        function generateRandomHexColor() {
            let hexColor = '#';
            for (let i = 0; i < 6; i++) {
                hexColor += getRandomCharacter();
            }
            return hexColor;
        }
        random_color = generateRandomHexColor()
        const hex = /#[A-Fa-f0-9]{6}\b/g;
        const modifiedData = data.replace(hex, random_color);
        return fs.writeFile('beam/css/dynamic.css', modifiedData);
    })
    .then(() => {
    })
    .catch(err => {
        console.error(err);
    });
    res.send('success');
});
// Create or Update an item
app.post('/:col/:key', async (req, res) => {
  console.log(req.body)

  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).set(key, req.body)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Delete an item
app.delete('/:col/:key', async (req, res) => {
  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).delete(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Get a single item
app.get('/:col/:key', async (req, res) => {
  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} get key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).get(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Get a full listing
app.get('/:col', async (req, res) => {
  const col = req.params.col
  console.log(`list collection: ${col} with params: ${JSON.stringify(req.params)}`)
  const items = await db.collection(col).list()
  console.log(JSON.stringify(items, null, 2))
  res.json(items).end()
})

// Catch all handler for all other request.
app.use('*', (req, res) => {
  res.json({ msg: 'no route handler found' }).end()
})



const port = process.env.PORT || 3000

//app.use(subdomain('api.cautious-garment-elk', routerMain));
// Start the server
app.listen(port, () => {
  console.log(`index.js listening on ${port}`)
})
