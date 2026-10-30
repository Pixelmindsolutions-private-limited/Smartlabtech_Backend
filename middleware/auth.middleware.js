// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import Staff from '../models/staff.js';

// export const protect = async (req, res, next) => {
//   try {
//     let token;
    
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1];
//     }
    
//     if (!token) {
//       return res.status(401).json({ success: false, message: 'Not authorized, no token' });
//     }
    
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Check if user still exists in database
//     const user = await User.findById(decoded.id).select('-password');
//     if (!user) {
//       return res.status(401).json({ success: false, message: 'User not found' });
//     }
    
//     const staff = await Staff.findById(decoded.id).select('-password');
//     if (!staff) {
//       return res.status(401).json({ success: false, message: 'Staff not found' });
//     }

//     // Check if user is active
//     if (!user.isActive) {
//       return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact admin.' });
//     }
    
//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
//   }
// };

// export const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role || req.staff.staffRole)) {
//       return res.status(403).json({ 
//         success: false, 
//         message: `Not authorized for this action. Required role: ${roles.join(' or ')}` 
//       });
//     }
//     next();
//   };
// };


import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Staff from '../models/staff.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    
    // ✅ Try to verify with both secrets in case they differ (Admin vs Staff)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // If JWT_SECRET fails, try ADMIN_SECRET_KEY (used in staffLogin)
      decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);
    }

    // ==========================================
    // ✅ ADDED: Handle Staff Token
    // ==========================================
    if (decoded.role === 'staff' && decoded.staffId) {
      const staff = await Staff.findById(decoded.staffId).select('-password');
      
      if (!staff) {
        return res.status(401).json({ success: false, message: 'Staff not found' });
      }

      if (staff.status !== 'active') {
        return res.status(401).json({ success: false, message: 'Staff account is deactivated.' });
      }
      
      req.user = decoded;
      req.staff = staff;
      req.userId = decoded.staffId; // Fixes controller bug for req.userId
      return next(); 
    }

    // ==========================================
    // EXISTING: Handle User Token
    // ==========================================
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact admin.' });
    }
    
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    // Kept your original logic, just safely handling req.user existence
    const userRole = req.user?.role || req.staff?.roleType;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Not authorized for this action. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};