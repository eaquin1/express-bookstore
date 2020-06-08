process.env.NODE_ENV = 'test';
const request = require("supertest")
const app = require("../app")
const db = require("../db");


beforeEach(async function() {
    let result = await db.query(`
    INSERT INTO 
        books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('0691161518', 'http://a.co/eobPtX2', 'Matthew Lane', 'english', 201, 'Harvard University Press', 'The Best Book in the World', 2007)
        RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`);
        testBook = result.rows[0]
})

afterEach(async function() {
    //delete any data created by test
    await db.query("DELETE FROM books")
})

afterAll(async function(){
    //close db connection
    await db.end()
})

describe("GET all books", function() {
    it("Gets a list of books",  async function(){
        const resp = await request(app).get('/books');
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            books: [testBook]
        })
    })
})

describe("GET /books/:isbn", function() {
    it("gets one book from the isbn number", async function(){
        const resp = await request(app).get(`/books/${testBook.isbn}`)
        expect(resp.statusCode).toEqual(200)
        expect(resp.body.book.isbn).toBe(testBook.isbn)
    })

    it("responds with a 404 if it can't find the book", async function(){
        const resp = await request(app).get('/book/12345')
        expect(resp.statusCode).toBe(404)
    })
})

describe("POST /books", function() {
    it("Creates a new book", async function() {
        const resp = await request(app).post('/books').send({
            isbn: "12345678",
            amazon_url: "https://google.com",
            author: "tester",
            language: "english",
            pages: 23,
            publisher: "me",
            title: "test test",
            year: 2000
        })
        expect(resp.statusCode).toEqual(201)
        expect(resp.body.book).toHaveProperty("language")
    })

    it("returns 400 if a json does not have required parameters", async function() {
        const resp = await request(app).post('/books').send({
            year: 1997
        })
        expect(resp.statusCode).toBe(400)
    })
})

describe("PUT /books/:id", function() {
    it("updates a book", async function() {
        const resp = await request(app).put(`/books/${testBook.isbn}`).send({
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Moi",
                "language": "french",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": 2000
        })
        expect(resp.statusCode).toBe(200)
        expect(resp.body.book.year).toBe(2000)
    })

    it("Prevents a bad book update", async function() {
        const resp = await request(app).put(`/books/${testBook.isbn}`).send({  
                "author": 12,
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "Power-Up"
        })
        expect(resp.statusCode).toBe(400)
    })
})

describe("DELETE /books/:id", function() {
    it("deletes a single book", async function(){
        const resp = await request(app).delete(`/books/${testBook.isbn}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({ message: "Book deleted" })
    })
})