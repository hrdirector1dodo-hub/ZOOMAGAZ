// update_images.js
const fs = require('fs');
const path = require('path');
const productsPath = path.join(__dirname, '../src/data/products.json');
let products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
const placeholder = 'https://via.placeholder.com/600x400?text=Image+not+available';
products = products.map(product => {
  if (Array.isArray(product.images)) {
    const hasUnsplash = product.images.some(url => url.includes('images.unsplash.com'));
    if (hasUnsplash) {
      product.images = [placeholder];
    }
  }
  return product;
});
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf-8');
console.log('Updated product images to placeholder where Unsplash URLs were found.');
