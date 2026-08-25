const express = require('express');
const router = express.Router();
const {
  getClassrooms, getVacantClassrooms, createClassroom,
  updateClassroom, deleteClassroom, addManualBlock, removeManualBlock,
} = require('../controllers/classroomController');

router.get('/vacant', getVacantClassrooms);   // add this BEFORE any '/:id' GET
router.get('/', getClassrooms);
router.post('/', createClassroom);
router.patch('/:id', updateClassroom);
router.delete('/:id', deleteClassroom);
router.post('/:id/block', addManualBlock);
router.delete('/:id/block/:blockId', removeManualBlock);

module.exports = router;