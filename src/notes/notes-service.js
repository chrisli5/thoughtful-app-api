const NotesService = {
    getAllNotes(knex, userId) {
        return knex
            .select('*')
            .from('notes')
            .where('user_id', userId)
    },
    getById(knex, id, userId) {
        return knex
            .select('*')
            .from('notes')
            .where({
                id,
                user_id: userId,
            })
            .first()
    },
    insertNote(knex, newNote) {
        return knex
            .insert(newNote)
            .into('notes')
            .returning('*')
            .then(rows => rows[0])
    },
    deleteNote(knex, id, userId) {
        return knex
            .from('notes')
            .where({
                id,
                user_id: userId,
            })
            .delete()
    },
    updateNote(knex, id, userId, noteFields) {
        return knex
            .from('notes')
            .where({
                id,
                user_id: userId,
            })
            .update(noteFields)
            .returning('*')
            .then(rows => rows[0])
    },
}

module.exports = NotesService;