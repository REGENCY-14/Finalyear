const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { signupValidation, signinValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Signup route for medical personnel
router.post('/signup', signupValidation, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, licenseNumber } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('medical_personnel')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in Supabase
    const { data: newUser, error: createError } = await supabase
      .from('medical_personnel')
      .insert({
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role,
        license_number: licenseNumber,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name, role, license_number, created_at')
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      return res.status(500).json({
        error: 'User creation failed',
        message: 'Failed to create user account'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        licenseNumber: newUser.license_number,
        createdAt: newUser.created_at
      },
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Signup failed',
      message: 'An error occurred during account creation'
    });
  }
});

// Signin route for medical personnel
router.post('/signin', signinValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('medical_personnel')
      .select('id, email, password_hash, first_name, last_name, role, license_number, is_active')
      .eq('email', email)
      .single();

    if (findError || !user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await supabase
      .from('medical_personnel')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        licenseNumber: user.license_number
      },
      token
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      error: 'Signin failed',
      message: 'An error occurred during login'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('medical_personnel')
      .select('id, email, first_name, last_name, role, license_number, created_at, last_login')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        licenseNumber: user.license_number,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching profile'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
});

// Logout route (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Logout successful',
    note: 'Please remove the token from your client storage'
  });
});

module.exports = router;
