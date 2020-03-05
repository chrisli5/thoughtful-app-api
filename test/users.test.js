const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { DATABASE_URL } = require('../src/config');

describe('Users Endpoint', () => {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: DATABASE_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())


    describe('POST /api/users - bad passwords', () => {
        it('prevents user creation - password too short', () => {
            return supertest(app)
                .post('/api/users')
                .send({
                    username: 'badUser',
                    password: 'Test1!'
                })
                .expect(400)
                .expect(res => {
                    expect(res.body.error).to.eql('Password be longer than 8 characters.')
                })
        })

        it('prevents user creation - password starts with a space', () => {
            return supertest(app)
                .post('/api/users')
                .send({
                    username: 'badUser',
                    password: ' Test1!Test1!'
                })
                .expect(400)
                .expect(res => {
                    expect(res.body.error).to.eql('Password must not start or end with empty spaces.')
                })
        })

        it('prevents user creation - password does not contain uppercase/lowercase/special char', () => {
            return supertest(app)
                .post('/api/users')
                .send({
                    username: 'badUser',
                    password: 'testingtestingtesting'
                })
                .expect(400)
                .expect(res => {
                    expect(res.body.error).to.eql('Password must contain one upper case, lower case, number and special character.')
                })
        })
    })

    describe('POST /api/users', () => {
        const newUser = {
            username: 'newUser2',
            password: 'newUserPassword1!'
        }

        after('delete user', () => {
            db
            .from('users')
            .where('username', newUser.username)
            .delete()
            .returning('*')
            .then(rows => rows[0])
        })

        it('creates a new user, responding with 201', () => {
            return supertest(app)
                .post('/api/users')
                .send(newUser)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.username).to.eql(newUser.username)
                })
        })

        it('prevents user creation - username already taken, responds with 400', () => {
            return supertest(app)
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect(res => {
                    expect(res.body.error).to.eql(`Username already taken.`)
                })
        })
    })
})