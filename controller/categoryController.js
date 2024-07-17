 const categoryModel = require('../model/categoryModel')

// Category Details
const loadCategory = async (req, res) => {
    try {
        const itemsPerPage = 10; 
        const currentPage = parseInt(req.query.page) || 1; 

        const categoryList = await categoryModel.find({})
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalCategories = await categoryModel.countDocuments({});
        const totalPages = Math.ceil(totalCategories / itemsPerPage);

        res.render('category', { category: categoryList || [], currentPage, totalPages });
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/category');
    }
};


const insertCategory = async (req, res) => {
    try {
        const itemsPerPage = 10; 
        const currentPage = parseInt(req.query.page) || 1; 
        const totalCategories = await categoryModel.countDocuments({});
        const totalPages = Math.ceil(totalCategories / itemsPerPage);

        const categoryName = req.body.name
        const categoryC = await categoryModel.find({})
        const alreadyExist = await categoryModel.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } })
        if (alreadyExist) {
            return res.status(404).render('category',{category:categoryC || categoryList,message:'Category already Exist', currentPage, totalPages})
        } else {
            const categoryData = new categoryModel({
                name: req.body.name,
                description: req.body.description
                
            });
            
            await categoryData.save();
            res.redirect('/admin/category');
    
        }
       
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/category');
    }
};

const loadEditCategory = async(req,res)=>{

    const id = req.query.id
    const categoryData = await categoryModel.findById(id)
    res.render('edit-cate',{category:categoryData})
}

const editCategory = async(req, res)=>{
    try {
        const id = req.query.id
        const categoryName = req.body.name
        const category =  await categoryModel.findById(id)
        const alreadyExist = await categoryModel.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } })
        if (alreadyExist) {
            return res.status(404).render('edit-cate',{category ,message:'Category already Exist'})
        } else {
        const updateData = await categoryModel.findByIdAndUpdate({_id:id},{$set:{name:req.body.name,description:req.body.description}})
        res.redirect('/admin/category')
        };
        
    } catch (error) {
        console.log(error.message);
    }
}

const deleteCategory = async(req, res)=>{
    try {
        const id = req.query.id
        const deleteFile = await categoryModel.findById(id)
        if (deleteFile.is_Active === true) {
            await categoryModel.findByIdAndUpdate({_id:id},{$set:{is_Active:false}});
        } else {
            await categoryModel.findByIdAndUpdate({_id:id},{$set:{is_Active:true}});
        }
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = {
    loadCategory,
    insertCategory,
    loadEditCategory,
    editCategory,
    deleteCategory
}