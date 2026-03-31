import express from 'express';
import NotesController from '../controllers/notesController.js';
import auth from "../middleware/auth.js";

const router = express.Router();

router.post('/notes', auth, NotesController.createNote);
router.get('/notes', auth, NotesController.getNotes);
router.get('/notes/:id', auth, NotesController.getNoteById);
router.get('/notes/access-point/:access_point_id', auth, NotesController.getNotesByAccessPointId);
router.put('/notes/:id', auth, NotesController.updateNote);
router.delete('/notes/:id', auth, NotesController.deleteNote);

export default router;