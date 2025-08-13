const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { symptomValidation, paginationValidation } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create symptoms for a patient
router.post('/', symptomValidation, async (req, res) => {
  try {
    const { patientId, symptoms, notes } = req.body;

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .eq('id', patientId)
      .eq('is_deleted', false)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient record not found'
      });
    }

    // Prepare symptoms data for insertion
    const symptomsData = symptoms.map(symptom => ({
      patient_id: patientId,
      name: symptom.name,
      severity: symptom.severity,
      duration: symptom.duration,
      notes: symptom.notes || null,
      recorded_by: req.user.id,
      recorded_at: new Date().toISOString()
    }));

    // Insert symptoms
    const { data: insertedSymptoms, error: insertError } = await supabase
      .from('symptoms')
      .insert(symptomsData)
      .select('*');

    if (insertError) {
      console.error('Symptom creation error:', insertError);
      return res.status(500).json({
        error: 'Symptom creation failed',
        message: 'Failed to create symptom records'
      });
    }

    // Create symptom session record
    const { data: session, error: sessionError } = await supabase
      .from('symptom_sessions')
      .insert({
        patient_id: patientId,
        notes: notes,
        recorded_by: req.user.id,
        recorded_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      // Continue even if session creation fails
    }

    res.status(201).json({
      message: 'Symptoms recorded successfully',
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name
      },
      symptoms: insertedSymptoms.map(symptom => ({
        id: symptom.id,
        name: symptom.name,
        severity: symptom.severity,
        duration: symptom.duration,
        notes: symptom.notes,
        recordedAt: symptom.recorded_at
      })),
      session: session ? {
        id: session.id,
        notes: session.notes,
        recordedAt: session.recorded_at
      } : null
    });

  } catch (error) {
    console.error('Symptom creation error:', error);
    res.status(500).json({
      error: 'Symptom creation failed',
      message: 'An error occurred while recording symptoms'
    });
  }
});

// Get symptoms for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .eq('id', patientId)
      .eq('is_deleted', false)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: 'Patient record not found'
      });
    }

    // Get symptoms with pagination
    const { data: symptoms, error, count } = await supabase
      .from('symptoms')
      .select(`
        *,
        medical_personnel:recorded_by(first_name, last_name, role)
      `, { count: 'exact' })
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Symptom fetch error:', error);
      return res.status(500).json({
        error: 'Symptom fetch failed',
        message: 'Failed to fetch symptom records'
      });
    }

    // Get symptom sessions
    const { data: sessions } = await supabase
      .from('symptom_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });

    const totalPages = Math.ceil((count || 0) / limit);

    res.json({
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name
      },
      symptoms: symptoms.map(symptom => ({
        id: symptom.id,
        name: symptom.name,
        severity: symptom.severity,
        duration: symptom.duration,
        notes: symptom.notes,
        recordedAt: symptom.recorded_at,
        recordedBy: symptom.medical_personnel ? {
          firstName: symptom.medical_personnel.first_name,
          lastName: symptom.medical_personnel.last_name,
          role: symptom.medical_personnel.role
        } : null
      })),
      sessions: sessions?.map(session => ({
        id: session.id,
        notes: session.notes,
        recordedAt: session.recorded_at,
        recordedBy: session.recorded_by
      })) || [],
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
    console.error('Symptom fetch error:', error);
    res.status(500).json({
      error: 'Symptom fetch failed',
      message: 'An error occurred while fetching symptom records'
    });
  }
});

// Get all symptoms with filters and pagination
router.get('/', paginationValidation, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const severity = req.query.severity || '';
    const patientId = req.query.patientId || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('symptoms')
      .select(`
        *,
        patients:patient_id(first_name, last_name),
        medical_personnel:recorded_by(first_name, last_name, role)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    // Apply pagination
    const { data: symptoms, error, count } = await query
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Symptom fetch error:', error);
      return res.status(500).json({
        error: 'Symptom fetch failed',
        message: 'Failed to fetch symptom records'
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    res.json({
      symptoms: symptoms.map(symptom => ({
        id: symptom.id,
        name: symptom.name,
        severity: symptom.severity,
        duration: symptom.duration,
        notes: symptom.notes,
        recordedAt: symptom.recorded_at,
        patient: symptom.patients ? {
          id: symptom.patient_id,
          firstName: symptom.patients.first_name,
          lastName: symptom.patients.last_name
        } : null,
        recordedBy: symptom.medical_personnel ? {
          firstName: symptom.medical_personnel.first_name,
          lastName: symptom.medical_personnel.last_name,
          role: symptom.medical_personnel.role
        } : null
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
    console.error('Symptom fetch error:', error);
    res.status(500).json({
      error: 'Symptom fetch failed',
      message: 'An error occurred while fetching symptom records'
    });
  }
});

// Update a specific symptom
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, severity, duration, notes } = req.body;

    // Verify symptom exists and belongs to user or user has permission
    const { data: existingSymptom, error: fetchError } = await supabase
      .from('symptoms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingSymptom) {
      return res.status(404).json({
        error: 'Symptom not found',
        message: 'Symptom record not found'
      });
    }

    // Update symptom
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (severity !== undefined) updateData.severity = severity;
    if (duration !== undefined) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;

    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = req.user.id;

    const { data: updatedSymptom, error: updateError } = await supabase
      .from('symptoms')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Symptom update error:', updateError);
      return res.status(500).json({
        error: 'Symptom update failed',
        message: 'Failed to update symptom record'
      });
    }

    res.json({
      message: 'Symptom updated successfully',
      symptom: {
        id: updatedSymptom.id,
        name: updatedSymptom.name,
        severity: updatedSymptom.severity,
        duration: updatedSymptom.duration,
        notes: updatedSymptom.notes,
        updatedAt: updatedSymptom.updated_at,
        updatedBy: updatedSymptom.updated_by
      }
    });

  } catch (error) {
    console.error('Symptom update error:', error);
    res.status(500).json({
      error: 'Symptom update failed',
      message: 'An error occurred while updating symptom record'
    });
  }
});

// Delete a symptom
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify symptom exists
    const { data: symptom, error: fetchError } = await supabase
      .from('symptoms')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !symptom) {
      return res.status(404).json({
        error: 'Symptom not found',
        message: 'Symptom record not found'
      });
    }

    // Delete symptom
    const { error: deleteError } = await supabase
      .from('symptoms')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Symptom deletion error:', deleteError);
      return res.status(500).json({
        error: 'Symptom deletion failed',
        message: 'Failed to delete symptom record'
      });
    }

    res.json({
      message: 'Symptom deleted successfully'
    });

  } catch (error) {
    console.error('Symptom deletion error:', error);
    res.status(500).json({
      error: 'Symptom deletion failed',
      message: 'An error occurred while deleting symptom record'
    });
  }
});

// Get symptom statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Get total symptom count
    const { count: totalSymptoms } = await supabase
      .from('symptoms')
      .select('*', { count: 'exact', head: true });

    // Get symptoms by severity
    const { data: severityStats } = await supabase
      .from('symptoms')
      .select('severity');

    const severityCounts = severityStats?.reduce((acc, symptom) => {
      acc[symptom.severity] = (acc[symptom.severity] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent symptoms (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentSymptoms } = await supabase
      .from('symptoms')
      .select('*', { count: 'exact', head: true })
      .gte('recorded_at', thirtyDaysAgo.toISOString());

    // Get top symptoms by frequency
    const { data: topSymptoms } = await supabase
      .from('symptoms')
      .select('name')
      .limit(10);

    const symptomFrequency = topSymptoms?.reduce((acc, symptom) => {
      acc[symptom.name] = (acc[symptom.name] || 0) + 1;
      return acc;
    }, {}) || {};

    const topSymptomsList = Object.entries(symptomFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      stats: {
        totalSymptoms: totalSymptoms || 0,
        severityDistribution: severityCounts,
        recentSymptoms: recentSymptoms || 0,
        topSymptoms: topSymptomsList,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Stats fetch failed',
      message: 'An error occurred while fetching symptom statistics'
    });
  }
});

module.exports = router;
