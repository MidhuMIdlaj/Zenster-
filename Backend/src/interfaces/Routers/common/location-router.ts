import express from 'express';
import LocationController from '../../controllers/common/location-controller';
import { checkRole, verifyToken } from '../../../middleware/auth-middleware';
import { asyncHandler } from '../../../middleware/async-handler';

const router = express.Router();
const locationController = new LocationController();

// All location routes require authentication
router.use(asyncHandler(verifyToken));

/**
 * Location Tracking Endpoints
 */

// Track employee location - POST /api/location/track
router.post('/track',checkRole([ 'mechanic', 'coordinator']),asyncHandler(locationController.trackLocation));

// Get current location - GET /api/location/current/:employeeId
router.get('/current/:employeeId',checkRole([ 'mechanic', 'coordinator', 'admin']),asyncHandler(locationController.getCurrentLocation));

// Get location history - GET /api/location/history/:employeeId
router.get('/history/:employeeId',checkRole(['mechanic', 'coordinator', 'admin']),asyncHandler(locationController.getLocationHistory));

// Get all current locations - GET /api/location/all-current
router.get('/all-current',checkRole(['admin', 'coordinator']),asyncHandler(locationController.getAllCurrentLocations));

// Get location statistics - GET /api/location/statistics/:employeeId
router.get('/statistics/:employeeId',checkRole([ 'mechanic', 'coordinator', 'admin']),asyncHandler(locationController.getLocationStatistics));

/**
 * Permission Endpoints
 */

// Grant tracking permission - POST /api/location/permission/grant
router.post('/permission/grant',checkRole([ 'mechanic', 'coordinator']),asyncHandler(locationController.grantPermission));

// Revoke tracking permission - POST /api/location/permission/revoke
router.post('/permission/revoke',checkRole([ 'mechanic', 'coordinator']),asyncHandler(locationController.revokePermission));

// Get permission status - GET /api/location/permission/status
router.get('/permission/status',checkRole([ 'mechanic', 'coordinator', 'admin']),asyncHandler(locationController.getPermissionStatus));

export default router;
