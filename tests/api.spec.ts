import { test, expect, APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

test.describe('Movie API CRUD Tests', () => {
    let request: APIRequestContext;
    let movieId: string;

    test.beforeAll(async ({ playwright }) => {
        request = await playwright.request.newContext(); // Create a new APIRequestContext
    });

    test('GET /movies - should return all movies', async () => {
        const response = await request.get(`${BASE_URL}/movies`);
        expect(response.status()).toBe(200);
        const movies = await response.json();
        expect(Array.isArray(movies)).toBe(true);
    });

    test('POST /movie/add - should create a new movie', async () => {
        const newMovie = {
            name: 'Test Movie name',
            director: 'Test Director',
            actor: 'Test Actor',
            actress: 'Test Actress',
            genre: 'Test Genre',
            year: 2026,
        };

        const response = await request.post(`${BASE_URL}/movie/add`, {
            data: newMovie,
        });

        expect(response.status()).toBe(201);
        const responseBody = await response.json();
        console.log(responseBody);
        expect(responseBody.message).toBe("New movie has been created");
        expect(responseBody.movie).toHaveProperty('_id');
        movieId = responseBody.movie._id.$oid;
        expect(responseBody.movie.name).toBe(newMovie.name);
    });

    test('Get /movie/id - should return a single movie by id', async () => {
        movieId = '67ba45d07744b5106e57de88';

        if (!movieId) {
            return test.fail();
        }

        const response = await request.get(`${BASE_URL}/movie/${movieId}`);
        expect(response.status()).toBe(200);
        const movie = await response.json();
        expect(movie).toHaveProperty('_id');
        expect(movie._id).toBe(movieId);
        expect(movie.name).toBe('Test Movie name');
    });

    test('DELETE /movie/:id - should delete a movie', async () => {
        movieId = '67ba452bd163b6a5dbb166bf';

        if(!movieId){
            return test.fail();
        }

        const response = await request.delete(`${BASE_URL}/movie/${movieId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody.message).toBe('Movie has been deleted.');

        const getResponse = await request.get(`${BASE_URL}/movie/${movieId}`);
        expect(getResponse.status()).toBe(404);
    });

    test('GET /movie/:id - should return 404 if movie ID is not found', async () => {
        const invalidId = '67b926c0c909e7c8cd7fdfc2';
        const response = await request.get(`${BASE_URL}/movie/${invalidId}`);
        expect(response.status()).toBe(404);
        const responseBody = await response.json();
        expect(responseBody.message).toBe('Movie not found');
    });

    test('GET /movie/:id - should return 400 if movie ID is invalid', async () => {
        const invalidId = 'invalid-id';
        const response = await request.get(`${BASE_URL}/movie/${invalidId}`);
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe('Invalid movie ID');
    });

    test.afterAll(async () => {
        await request.dispose(); // Dispose of the APIRequestContext
    });
});