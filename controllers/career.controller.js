import CareerPage from '../models/CareerPage.js';
import OpenRole from '../models/OpenRole.js';
import JobApplication from '../models/JobApplication.js';

// ==================== CAREER PAGE HERO ====================
export const getCareerPage = async (req, res) => {
  try {
    const page = await CareerPage.findOne({ isActive: true });
    if (!page) return res.json({ success: true, data: null });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Convert to plain object to modify it
    const pageObj = page.toObject();
    
    if (pageObj.hero?.image && !pageObj.hero.image.startsWith('http')) {
      pageObj.hero.image = `${baseUrl}${pageObj.hero.image}`;
    }

    res.json({ success: true, data: pageObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CAREER PAGE HERO ====================
export const createCareerPage = async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    // Handle uploaded image (if using multer)
    // Adjust 'heroImage' to whatever field name you used in multer
    const uploadedImage = req.files?.heroImage?.[0] || req.file; 
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }
    if (!uploadedImage) {
      return res.status(400).json({ success: false, message: 'Hero image is required' });
    }

    const existingPage = await CareerPage.findOne();
    if (existingPage) {
      return res.status(400).json({ success: false, message: 'Career page already exists. Please use the update endpoint.' });
    }

    // Build the image URL path
    const imageUrl = `/uploads/careers/hero/${uploadedImage.filename}`; 

    const page = await CareerPage.create({
      hero: { 
        title, 
        description, 
        tag: tag, 
        image: imageUrl 
      }
    });

    res.status(201).json({ success: true, message: 'Career page created', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCareerPage = async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    let page = await CareerPage.findOne();
    
    // Handle new image upload if provided
    const uploadedImage = req.files?.heroImage?.[0] || req.file;
    let newImageUrl = undefined;

    if (uploadedImage) {
      newImageUrl = `/uploads/careers/hero/${uploadedImage.filename}`;
      // Optional: Delete the old image from disk here using fs.unlinkSync(page.hero.image)
    }
    
    if (page) {
      page.hero.title = title || page.hero.title;
      page.hero.description = description || page.hero.description;
      page.hero.tag = tag || page.hero.tag;
      
      if (newImageUrl) {
        page.hero.image = newImageUrl;
      }
      
      await page.save();
    } else {
      page = await CareerPage.create({ 
        hero: { title, description, tag, image: newImageUrl } 
      });
    }
    
    res.json({ success: true, message: 'Career page updated', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== OPEN ROLES ====================
export const createOpenRole = async (req, res) => {
  try {
    const role = await OpenRole.create(req.body);
    res.status(201).json({ success: true, message: 'Role created', data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOpenRoles = async (req, res) => {
  try {
    // Supports filters: ?category=SERVICE&location=Hyderabad
    const query = { isActive: true };
    if (req.query.category) query.category = req.query.category;
    if (req.query.location) query.locations = { $in: [req.query.location] };

    const roles = await OpenRole.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOpenRoleById = async (req, res) => {
  try {
    const role = await OpenRole.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOpenRole = async (req, res) => {
  try {
    const role = await OpenRole.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, message: 'Role updated', data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOpenRole = async (req, res) => {
  try {
    const role = await OpenRole.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== JOB APPLICATIONS ====================
export const submitApplication = async (req, res) => {
  try {
    const { roleId, fullName, email, mobileNumber, currentCity, coverNote } = req.body;

    // Check if role exists
    const roleExists = await OpenRole.findById(roleId);
    if (!roleExists) {
      return res.status(404).json({ success: false, message: 'The job role you are applying for no longer exists.' });
    }

    const application = await JobApplication.create({
      roleId, fullName, email, mobileNumber, currentCity, coverNote
    });

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully', 
      data: application 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    // Populate roleName so admin can see which job they applied for
    const applications = await JobApplication.find()
      .populate('roleId', 'roleName category')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    // We populate roleId so the admin can see the job details along with the applicant's info
    const application = await JobApplication.findById(req.params.id)
      .populate('roleId', 'roleName category locations');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};