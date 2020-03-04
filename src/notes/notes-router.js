const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const NotesService = require('./notes-service');
const { requireAuth } = require('../middleware/jwt-auth');

const notesRouter = express.Router();
const bodyParser = express.json();

const serializeNote = note => ({
    id: note.id,
    content: xss(note.content),
    createdAt: xss(note.date_created),
    mood: xss(note.mood),
    timeSpent: note.time_spent
})

notesRouter
    .route('/')
    .all(requireAuth)
    .get((req, res, next) => {
        NotesService.getAllNotes(req.app.get('db'), req.user.id)
            .then(notes => 
                res.json(notes.map(serializeNote))   
            )
            .catch(next)
    })

    .post(bodyParser, (req, res, next) => {
        const { user, body } = req;

        const newNote = {
            user_id: user.id,
            content: body.content,
            mood: body.mood,
            time_spent: body.timeSpent
        }

        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note => {
                logger.info(`Note with id ${note.id} created.`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `${note.id}`))
                    .json(serializeNote(note))
            })
            .catch(next)
    })

notesRouter
    .route('/:noteId')
    .all(requireAuth)
    .all((req, res, next) => {
        const { noteId } = req.params;
        const { user } = req;

        NotesService.getById(req.app.get('db'), noteId, user.id)
            .then(note => {
                if(!note) {
                    logger.error(`Note with id ${noteId} not found.`)
                    return res.status(404).json({
                        error: { message: `Note not found.`}
                    })
                }

                res.note = note;
                next();
            })
            .catch(next)
    })

    .get((req, res) => {
        res.json(serializeNote(res.note));
    })

    .delete((req, res, next) => {
        const { user } = req;
        const { noteId } = req.params;

        NotesService.deleteNote(req.app.get('db'), noteId, user.id)
            .then(numRowsAffected => {
                logger.info(`Note with id ${noteId} deleted.`)
                res.status(200).json({
                    id: parseInt(noteId),
                });
            })
            .catch(next)
    })

    .patch(bodyParser, (req, res, next) => {
        const { user, body } = req;
        const { noteId } = req.params;

        const content = body.content || '';
        const time_spent = body.timeSpent || 0;

        NotesService.updateNote(
            req.app.get('db'),
            noteId,
            user.id,
            {
                content,
                time_spent,
                mood: body.mood
            }
        )
            .then(note => {
                console.log(note);
                res.status(200).json(serializeNote(note))
            })
            .catch(next)
    })

    module.exports = notesRouter;