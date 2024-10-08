const mongoose = require('mongoose');
const slug = require('slugify');
const uniqueValidator = require('mongoose-unique-validator');

const category_schema = mongoose.Schema({
    slug: { 
        type: String, 
        lowercase: true, 
        unique: true 
    },
    id_cat: {
        type: String,
        required: true
    },
    category_name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
});

category_schema.plugin(uniqueValidator, { msg: "already taken" });

category_schema.pre('validate', function (next) {
    if (!this.slug) {
        this.slugify();
    }
    next();
});

category_schema.methods.slugify = function () {
    this.slug = slug(this.category_name) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

category_schema.methods.toCategoryResponse = function(){
    return {
        slug: this.slug,
        id_cat: this.id_cat,
        category_name: this.category_name,
        image: this.image,
        products: this.products,
    };
};

category_schema.methods.toCategoryCarouselResponse = function(){
    return {
        slug: this.slug,
        image: this.image,
        category_name: this.category_name
    };
};

category_schema.methods.addProduct = function (product_id) {
    if(this.products.indexOf(product_id) === -1){
        this.products.push(product_id);
    }
    return this.save();
};

category_schema.methods.removeProduct = function (product_id) {
    if(this.products.indexOf(product_id) !== -1){
        this.products.remove(product_id);
    }
    return this.save();
};

module.exports = mongoose.model('Category', category_schema);