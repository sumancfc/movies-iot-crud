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
        movieId = '67b926c0c909e7c8cd7fdfc2';

        if (!movieId) {
            return test.fail();
        }

        const response = await request.get(`${BASE_URL}/movie/${movieId}`);
        expect(response.status()).toBe(200);
        const movie = await response.json();
        expect(movie).toHaveProperty('_id');
        expect(movie._id).toBe(movieId);
        expect(movie.name).toBe('Oppenheimer');
    });
});