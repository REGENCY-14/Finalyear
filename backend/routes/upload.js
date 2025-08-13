const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { supabase, XRAY_BUCKET } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// Upload X-ray image
router.post('/xray', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload an X-ray image'
      });
    }

    const { patientId, imageType, notes, bodyPart } = req.body;

    if (!patientId) {
      return res.status(400).json({
        error: 'Patient ID required',
        message: 'Please provide a patient ID'
      });
    }

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

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `xray_${patientId}_${uuidv4()}${fileExtension}`;
    const filePath = `${patientId}/${fileName}`;

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(XRAY_BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          uploadedBy: req.user.id,
          patientId: patientId,
          imageType: imageType || 'xray',
          bodyPart: bodyPart || 'unknown'
        }
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return res.status(500).json({
        error: 'File upload failed',
        message: 'Failed to upload X-ray image to storage'
      });
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(XRAY_BUCKET)
      .getPublicUrl(filePath);

    // Create record in database
    const { data: imageRecord, error: dbError } = await supabase
      .from('xray_images')
      .insert({
        patient_id: patientId,
        file_name: fileName,
        file_path: filePath,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        image_type: imageType || 'xray',
        body_part: bodyPart || 'unknown',
        notes: notes || null,
        uploaded_by: req.user.id,
        uploaded_at: new Date().toISOString(),
        public_url: publicUrl
      })
      .select('*')
      .single();

    if (dbError) {
      console.error('Database record creation error:', dbError);
      // Try to delete the uploaded file if database record creation fails
      await supabase.storage.from(XRAY_BUCKET).remove([filePath]);
      
      return res.status(500).json({
        error: 'Record creation failed',
        message: 'Failed to create image record in database'
      });
    }

    res.status(201).json({
      message: 'X-ray image uploaded successfully',
      image: {
        id: imageRecord.id,
        fileName: imageRecord.file_name,
        filePath: imageRecord.file_path,
        fileSize: imageRecord.file_size,
        mimeType: imageRecord.mime_type,
        imageType: imageRecord.image_type,
        bodyPart: imageRecord.body_part,
        notes: imageRecord.notes,
        publicUrl: imageRecord.public_url,
        uploadedAt: imageRecord.uploaded_at,
        uploadedBy: imageRecord.uploaded_by
      },
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name
      }
    });

  } catch (error) {
    console.error('X-ray upload error:', error);
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Upload failed',
      message: 'An error occurred while uploading X-ray image'
    });
  }
});

// Get all X-ray images for a patient
router.get('/xray/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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

    // Get X-ray images with pagination
    const { data: images, error, count } = await supabase
      .from('xray_images')
      .select(`
        *,
        medical_personnel:uploaded_by(first_name, last_name, role)
      `, { count: 'exact' })
      .eq('patient_id', patientId)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Image fetch error:', error);
      return res.status(500).json({
        error: 'Image fetch failed',
        message: 'Failed to fetch X-ray images'
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    res.json({
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name
      },
      images: images.map(image => ({
        id: image.id,
        fileName: image.file_name,
        filePath: image.file_path,
        fileSize: image.file_size,
        mimeType: image.mime_type,
        imageType: image.image_type,
        bodyPart: image.body_part,
        notes: image.notes,
        publicUrl: image.public_url,
        uploadedAt: image.uploaded_at,
        uploadedBy: image.uploaded_by,
        uploadedByUser: image.medical_personnel ? {
          firstName: image.medical_personnel.first_name,
          lastName: image.medical_personnel.last_name,
          role: image.medical_personnel.role
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
    console.error('Image fetch error:', error);
    res.status(500).json({
      error: 'Image fetch failed',
      message: 'An error occurred while fetching X-ray images'
    });
  }
});

// Get all X-ray images with filters
router.get('/xray', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const imageType = req.query.imageType || '';
    const bodyPart = req.query.bodyPart || '';
    const patientId = req.query.patientId || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('xray_images')
      .select(`
        *,
        patients:patient_id(first_name, last_name),
        medical_personnel:uploaded_by(first_name, last_name, role)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`notes.ilike.%${search}%,body_part.ilike.%${search}%`);
    }

    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    if (bodyPart) {
      query = query.eq('body_part', bodyPart);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    // Apply pagination
    const { data: images, error, count } = await query
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Image fetch error:', error);
      return res.status(500).json({
        error: 'Image fetch failed',
        message: 'Failed to fetch X-ray images'
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    res.json({
      images: images.map(image => ({
        id: image.id,
        fileName: image.file_name,
        filePath: image.file_path,
        fileSize: image.file_size,
        mimeType: image.mime_type,
        imageType: image.image_type,
        bodyPart: image.body_part,
        notes: image.notes,
        publicUrl: image.public_url,
        uploadedAt: image.uploaded_at,
        uploadedBy: image.uploaded_by,
        patient: image.patients ? {
          id: image.patient_id,
          firstName: image.patients.first_name,
          lastName: image.patients.last_name
        } : null,
        uploadedByUser: image.medical_personnel ? {
          firstName: image.medical_personnel.first_name,
          lastName: image.medical_personnel.last_name,
          role: image.medical_personnel.role
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
    console.error('Image fetch error:', error);
    res.status(500).json({
      error: 'Image fetch failed',
      message: 'An error occurred while fetching X-ray images'
    });
  }
});

// Get a specific X-ray image
router.get('/xray/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: image, error } = await supabase
      .from('xray_images')
      .select(`
        *,
        patients:patient_id(first_name, last_name),
        medical_personnel:uploaded_by(first_name, last_name, role)
      `)
      .eq('id', id)
      .single();

    if (error || !image) {
      return res.status(404).json({
        error: 'Image not found',
        message: 'X-ray image not found'
      });
    }

    res.json({
      image: {
        id: image.id,
        fileName: image.file_name,
        filePath: image.file_path,
        fileSize: image.file_size,
        mimeType: image.mime_type,
        imageType: image.image_type,
        bodyPart: image.body_part,
        notes: image.notes,
        publicUrl: image.public_url,
        uploadedAt: image.uploaded_at,
        uploadedBy: image.uploaded_by,
        patient: image.patients ? {
          id: image.patient_id,
          firstName: image.patients.first_name,
          lastName: image.patients.last_name
        } : null,
        uploadedByUser: image.medical_personnel ? {
          firstName: image.medical_personnel.first_name,
          lastName: image.medical_personnel.last_name,
          role: image.medical_personnel.role
        } : null
      }
    });

  } catch (error) {
    console.error('Image fetch error:', error);
    res.status(500).json({
      error: 'Image fetch failed',
      message: 'An error occurred while fetching X-ray image'
    });
  }
});

// Update X-ray image metadata
router.put('/xray/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, imageType, bodyPart } = req.body;

    // Verify image exists
    const { data: existingImage, error: fetchError } = await supabase
      .from('xray_images')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingImage) {
      return res.status(404).json({
        error: 'Image not found',
        message: 'X-ray image not found'
      });
    }

    // Update image metadata
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (imageType !== undefined) updateData.image_type = imageType;
    if (bodyPart !== undefined) updateData.body_part = bodyPart;

    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = req.user.id;

    const { data: updatedImage, error: updateError } = await supabase
      .from('xray_images')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Image update error:', updateError);
      return res.status(500).json({
        error: 'Image update failed',
        message: 'Failed to update image metadata'
      });
    }

    res.json({
      message: 'Image metadata updated successfully',
      image: {
        id: updatedImage.id,
        fileName: updatedImage.file_name,
        notes: updatedImage.notes,
        imageType: updatedImage.image_type,
        bodyPart: updatedImage.body_part,
        updatedAt: updatedImage.updated_at,
        updatedBy: updatedImage.updated_by
      }
    });

  } catch (error) {
    console.error('Image update error:', error);
    res.status(500).json({
      error: 'Image update failed',
      message: 'An error occurred while updating image metadata'
    });
  }
});

// Delete X-ray image
router.delete('/xray/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify image exists
    const { data: image, error: fetchError } = await supabase
      .from('xray_images')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !image) {
      return res.status(404).json({
        error: 'Image not found',
        message: 'X-ray image not found'
      });
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from(XRAY_BUCKET)
      .remove([image.file_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('xray_images')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return res.status(500).json({
        error: 'Image deletion failed',
        message: 'Failed to delete image record from database'
      });
    }

    res.json({
      message: 'X-ray image deleted successfully'
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      error: 'Image deletion failed',
      message: 'An error occurred while deleting X-ray image'
    });
  }
});

// Get upload statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Get total image count
    const { count: totalImages } = await supabase
      .from('xray_images')
      .select('*', { count: 'exact', head: true });

    // Get images by type
    const { data: typeStats } = await supabase
      .from('xray_images')
      .select('image_type');

    const typeCounts = typeStats?.reduce((acc, image) => {
      acc[image.image_type] = (acc[image.image_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent uploads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentUploads } = await supabase
      .from('xray_images')
      .select('*', { count: 'exact', head: true })
      .gte('uploaded_at', thirtyDaysAgo.toISOString());

    // Get total storage used
    const { data: storageStats } = await supabase
      .from('xray_images')
      .select('file_size');

    const totalStorage = storageStats?.reduce((acc, image) => acc + (image.file_size || 0), 0) || 0;

    res.json({
      stats: {
        totalImages: totalImages || 0,
        typeDistribution: typeCounts,
        recentUploads: recentUploads || 0,
        totalStorageBytes: totalStorage,
        totalStorageMB: Math.round((totalStorage / (1024 * 1024)) * 100) / 100,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Stats fetch failed',
      message: 'An error occurred while fetching upload statistics'
    });
  }
});

module.exports = router;
