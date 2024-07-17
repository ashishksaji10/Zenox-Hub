const productModel = require('../model/productModel')
const categoryModel = require('../model/categoryModel')


// Product Details
const loadProduct = async (req, res) => {
    try {
        // Find all active categories
        const activeCategories = await categoryModel.find({ is_Active: true });

        // Extract the IDs of active categories
        const activeCategoryIds = activeCategories.map(category => category._id);

        // Find products belonging to active categories
        const products = await productModel.find({ category: { $in: activeCategoryIds } });

        res.render('addProduct', { category: activeCategories, product: products });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loadProductlist = async (req, res) => {
    try {
        const itemsPerPage = 6; 
        const currentPage = parseInt(req.query.page) || 1; 

        const activeCategories = await categoryModel.find({ is_Active: true });

        const activeCategoryIds = activeCategories.map(category => category._id);

        const totalProducts = await productModel.countDocuments({ category: { $in: activeCategoryIds } });

        const totalPages = Math.ceil(totalProducts / itemsPerPage);
        
        const products = await productModel.find({ category: { $in: activeCategoryIds } })
            .populate('category')
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        res.render('listproduct', {
            category: activeCategories,
            product: products,
            currentPage,
            totalPages
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const insertProduct = async (req, res) => {

    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // Extracting file names from req.files
    const images = req.files.map(file => file.filename);

    // Extracting product data from req.body
    const { name, description, price, discountPrice, stock, category } = req.body;
    console.log(req.body);

    try {
        // Creating a new product instance
        const product = new productModel({
            name: name,
            description: description,
            price: price,
            discountPrice: discountPrice,
            countInStock: stock,
            images: images,
            category: category
        });

        // Saving the product to the database
        const productData = await product.save();
        
        // Redirecting to the admin product page on success
        res.redirect('/admin/product');
    } catch (error) {
        console.error('Error saving product:', error.message);

        // Sending a server error response
        res.status(500).send('Server Error');
    }
};




const loadEditProduct = async(req,res)=>{
    try {
        
        const id = req.query.id
        const productData = await productModel.findById(id)
        const activeCategories = await categoryModel.find({ is_Active: true });

        res.render('editproduct', { proData: productData, catData: activeCategories || [] });
    } catch (error) {
        console.log(error.message)
    }
}

const editProduct = async (req, res) => {
    try {
        
        const id = req.query.id;
        const product = await productModel.findById(id)

        const updateFields = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
            countInStock: req.body.stock,
            category: req.body.category
        };

        
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file =>  file.filename);
            updateFields.images = [...product.images,...newImages].slice(0,3)
        }


        const updatedProduct = await productModel.findByIdAndUpdate(id, updateFields, { new: true });
        
        if (!updatedProduct) {
            return res.status(404).send("Product not found");
        }

        res.redirect("/admin/productlist");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const activeProduct = async(req, res)=>{
    try {
        const id = req.query.id
        const activeFile = await productModel.findById(id)
        if (activeFile.is_deleted === true) {
            await productModel.findByIdAndUpdate({_id:id},{$set:{is_deleted:false}});
        } else {
            await productModel.findByIdAndUpdate({_id:id},{$set:{is_deleted:true}});
        }
        res.redirect('/admin/productlist')
    } catch (error) {
        console.log(error.message)
    }
}

const deleteImage = async(req, res)=>{
    try {
        const id = req.query.productId
        const imageName = req.query.image
        const deleteImage = await productModel.findByIdAndUpdate(id,{$pull: {images:imageName}},{new:true})
        res.status(200).send("Success");
    } catch (error) {
        console.log(error.message)
    }
}

module.exports ={
    loadProduct,
    loadProductlist,
    insertProduct,
    loadEditProduct,
    editProduct,
    activeProduct,
    deleteImage
} 