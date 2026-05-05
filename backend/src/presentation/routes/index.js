const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');
const clientController = require('../controllers/clientController');
const roomController = require('../controllers/roomController');
const reservationController = require('../controllers/reservationController');
const invoiceController = require('../controllers/invoiceController');
const equipmentController = require('../controllers/equipmentController');

// Middleware
const { authMiddleware, adminOnly, receptionistOrAdmin } = require('../middleware/authMiddleware');

// Public routes (no authentication)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Client routes (authenticated, receptionist+)
router.post('/clients', authMiddleware, receptionistOrAdmin, clientController.createClient);
router.get('/clients', authMiddleware, receptionistOrAdmin, clientController.getAllClients);
router.get('/clients/:id', authMiddleware, receptionistOrAdmin, clientController.getClientById);
router.put('/clients/:id', authMiddleware, receptionistOrAdmin, clientController.updateClient);
router.delete('/clients/:id', authMiddleware, adminOnly, clientController.deactivateClient);

// Room routes (admin only for create/update, authenticated for view)
router.post('/rooms', authMiddleware, adminOnly, roomController.createRoom);
router.get('/rooms', authMiddleware, roomController.getAllRooms);
router.get('/rooms/available', authMiddleware, roomController.getAvailableRooms);
router.put('/rooms/:id', authMiddleware, adminOnly, roomController.updateRoom);

// Reservation routes
router.get('/reservations', authMiddleware, receptionistOrAdmin, reservationController.getAllReservations);
router.post('/reservations', authMiddleware, receptionistOrAdmin, reservationController.createReservation);
router.put('/reservations/:id', authMiddleware, receptionistOrAdmin, reservationController.updateReservation);
router.put('/reservations/:id/confirm', authMiddleware, receptionistOrAdmin, reservationController.confirmReservation);
router.put('/reservations/:id/checkin', authMiddleware, receptionistOrAdmin, reservationController.checkIn);
router.put('/reservations/:id/checkout', authMiddleware, receptionistOrAdmin, reservationController.checkOut);
router.delete('/reservations/:id', authMiddleware, receptionistOrAdmin, reservationController.cancelReservation);
router.get('/clients/:clientId/reservations', authMiddleware, receptionistOrAdmin, reservationController.getReservationsByClient);


// Invoice routes
router.post('/reservations/:reservationId/invoice', authMiddleware, receptionistOrAdmin, invoiceController.generateInvoice);
router.get('/reservations/:reservationId/invoice', authMiddleware, invoiceController.getInvoiceByReservation);
router.get('/clients/:clientId/invoices', authMiddleware, receptionistOrAdmin, invoiceController.getClientInvoices);


// Equipment management (admin only)
router.get('/equipment', authMiddleware, adminOnly, equipmentController.getAll);
router.post('/equipment', authMiddleware, adminOnly, equipmentController.create);
router.delete('/equipment/:id', authMiddleware, adminOnly, equipmentController.delete);

// Room-equipment association (admin only)
router.post('/rooms/:roomId/equipment/:equipmentId', authMiddleware, adminOnly, equipmentController.addToRoom);
router.delete('/rooms/:roomId/equipment/:equipmentId', authMiddleware, adminOnly, equipmentController.removeFromRoom);
router.get('/rooms/:roomId/equipment', authMiddleware, adminOnly, equipmentController.getRoomEquipment);



module.exports = router;