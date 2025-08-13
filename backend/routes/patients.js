const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { patientValidation, patientUpdateValidation, paginationValidation } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create a new patient
router.post('/', patientValidation, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      email,
      address,
      medicalHistory
    } = req.body;

    // Check if patient already exists (basic duplicate check)
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('first_name', firstName)
      .eq('last_name', lastName)
      .eq('date_of_birth', dateOfBirth)
      .single();

    if (existingPatient) {
      return res.status(409).json({
        error: 'Patient already exists',
        message: 'A patient with these details already exists in the system'
      });
    }

    // Create new patient
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        gender,
        phone_number: phoneNumber,
        email,
        address,
        medical_history: medicalHistory,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Patient creation error:', createError);
      return res.status(500).json({
        error: 'Patient creation failed',
        message: 'Failed to create patient record'
      });
    }

    res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        id: newPatient.id,
        firstName: newPatient.first_name,
        lastName: newPatient.last_name,
        dateOfBirth: newPatient.date_of_birth,
        gender: newPatient.gender,
        phoneNumber: newPatient.phone_number,
        email: newPatient.email,
        address: newPatient.address,
        medicalHistory: newPatient.medical_history,
        createdAt: newPatient.created_at,
        createdBy: newPatient.created_by
      }
    });

  } catch (error) {
    console.error('Patient creation error:', error);
    res.status(500).json({
      error: 'Patient creation failed',
      message: 'An error occurred while creating patient record'
    });
  }
});

// Get all patients with pagination and search
router.get('/', paginationValidation, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' });

    // Apply search filter if provided
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    const { data: patients, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Patient fetch error:', error);
      return res.status(500).json({
        error: 'Patient fetch failed',
        message: 'Failed to fetch patient records'
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    res.json({
      patients: patients.map(patient => ({
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        phoneNumber: patient.phone_number,
        email: patient.email,
        address: patient.address,
        medicalHistory: patient.medical_history,
        createdAt: patient.created_at,
        createdBy: patient.created_by
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Patient fetch error:', error);
    res.status(500).json({
      error: 'Patient fetch failed',
      message: 'An error occurred while fetching patient records'
    });
  }
});

// Get a specific patient by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        *,
        medical_personnel:created_by(first_name, last_name, role)
      `)
      .eq('id', id)
      .single();

    if (error || !patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient record not found'
      });
    }

    res.json({
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        phoneNumber: patient.phone_number,
        email: patient.email,
        address: patient.address,
        medicalHistory: patient.medical_history,
        createdAt: patient.created_at,
        createdBy: patient.created_by,
        createdByUser: patient.medical_personnel ? {
          firstName: patient.medical_personnel.first_name,
          lastName: patient.medical_personnel.last_name,
          role: patient.medical_personnel.role
        } : null
      }
    });

  } catch (error) {
    console.error('Patient fetch error:', error);
    res.status(500).json({
      error: 'Patient fetch failed',
      message: 'An error occurred while fetching patient record'
    });
  }
});

// Update a patient
router.put('/:id', patientUpdateValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Only include fields that are provided
    if (req.body.firstName !== undefined) updateData.first_name = req.body.firstName;
    if (req.body.lastName !== undefined) updateData.last_name = req.body.lastName;
    if (req.body.dateOfBirth !== undefined) updateData.date_of_birth = req.body.dateOfBirth;
    if (req.body.gender !== undefined) updateData.gender = req.body.gender;
    if (req.body.phoneNumber !== undefined) updateData.phone_number = req.body.phoneNumber;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.medicalHistory !== undefined) updateData.medical_history = req.body.medicalHistory;

    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = req.user.id;

    const { data: updatedPatient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updatedPatient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient record not found or update failed'
      });
    }

    res.json({
      message: 'Patient updated successfully',
      patient: {
        id: updatedPatient.id,
        firstName: updatedPatient.first_name,
        lastName: updatedPatient.last_name,
        dateOfBirth: updatedPatient.date_of_birth,
        gender: updatedPatient.gender,
        phoneNumber: updatedPatient.phone_number,
        email: updatedPatient.email,
        address: updatedPatient.address,
        medicalHistory: updatedPatient.medical_history,
        updatedAt: updatedPatient.updated_at,
        updatedBy: updatedPatient.updated_by
      }
    });

  } catch (error) {
    console.error('Patient update error:', error);
    res.status(500).json({
      error: 'Patient update failed',
      message: 'An error occurred while updating patient record'
    });
  }
});

// Delete a patient (soft delete - only admins)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_deleted flag
    const { error } = await supabase
      .from('patients')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: req.user.id
      })
      .eq('id', id);

    if (error) {
      console.error('Patient deletion error:', error);
      return res.status(500).json({
        error: 'Patient deletion failed',
        message: 'Failed to delete patient record'
      });
    }

    res.json({
      message: 'Patient deleted successfully',
      note: 'Patient record has been soft deleted'
    });

  } catch (error) {
    console.error('Patient deletion error:', error);
    res.status(500).json({
      error: 'Patient deletion failed',
      message: 'An error occurred while deleting patient record'
    });
  }
});

// Get patient statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Get total patient count
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Get patients by gender
    const { data: genderStats } = await supabase
      .from('patients')
      .select('gender')
      .eq('is_deleted', false);

    const genderCounts = genderStats?.reduce((acc, patient) => {
      acc[patient.gender] = (acc[patient.gender] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent patients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .gte('created_at', thirtyDaysAgo.toISOString());

    res.json({
      stats: {
        totalPatients: totalPatients || 0,
        genderDistribution: genderCounts,
        recentPatients: recentPatients || 0,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Stats fetch failed',
      message: 'An error occurred while fetching patient statistics'
    });
  }
});

module.exports = router;
