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
    createdAt: xss(note.created_at),
})

notesRouter
    .route('/')
    .all(requireAuth)
    .get((req, res, next) => {
        NotesService.getAllNotes(req.app.get('db'))
            .then(notes => 
                res.json(notes.map(serializeNote))   
            )
            .catch(next)
    })

    .post(bodyParser, (req, res, next) => {
        NotesService.insertNote(
            req.app.get('db'),
            req.body.content
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
        const { noteId } = req.params
        NotesService.getById(req.app.get('db'), noteId)
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
        const { noteId } = req.params;
        NotesService.deleteNote(req.app.get('db'), noteId)
            .then(numRowsAffected => {
                logger.info(`Note with id ${noteId} deleted.`)
                res.status(204).end();
            })
            .catch(next)
    })

    .patch(bodyParser, (req, res, next) => {
        NotesService.updateNote(
            req.app.get('db'),
            req.params.noteId,
            req.body.content
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

    module.exports = notesRouter;