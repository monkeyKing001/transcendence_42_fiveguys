---

# API Documentation for Transcendence NestJS Application

## Base URL: `http://localhost:3001`

---

## Auth Endpoints

### Login with FortyTwo (OAuth 2.0)

**Endpoint:** `GET /auth/loginfortytwo/callback`

**Description:** Log in using the FortyTwo OAuth 2.0 authentication. This endpoint will return the user information obtained from FortyTwo after successful authentication.

**Response:**

- `200 OK`: The user information from FortyTwo is returned successfully.
- `401 Unauthorized`: If the authentication fails or the user information cannot be retrieved.

### Create a New User

**Endpoint:** `POST /auth/signup`

**Description:** Create a new user with the provided Intra ID.

**Request Body:**

```json
{
  "intraId": "example_intra_id"
}
```

**Response:**

- `200 OK`: The new user is created successfully. The user information is returned in the response.

### Sign In

**Endpoint:** `POST /auth/signin`

**Description:** Sign in with the provided Intra ID.

**Request Body:**

```json
{
  "intraId": "example_intra_id"
}
```

**Response:**

- `200 OK`: The user is signed in successfully. The user information is returned in the response.

---

## Users Endpoints

### Get User by ID

**Endpoint:** `GET /users/:id`

**Description:** Get user information by their ID.

**Response:**

- `200 OK`: The user information with the provided ID is returned.
- `404 Not Found`: If the user with the specified ID does not exist.

### Get User by Intra ID

**Endpoint:** `GET /users/:intraId`

**Description:** Get user information by their Intra ID.

**Response:**

- `200 OK`: The user information with the provided Intra ID is returned.
- `404 Not Found`: If the user with the specified Intra ID does not exist.

### Update User

**Endpoint:** `PATCH /users/:id`

**Description:** Update user information by their ID.

**Request Body:**

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**Response:**

- `200 OK`: The user information is updated successfully. The updated user information is returned in the response.
- `404 Not Found`: If the user with the specified ID does not exist.

### Delete User

**Endpoint:** `DELETE /users/:id`

**Description:** Delete user by their ID.

**Response:**

- `200 OK`: The user is deleted successfully.
- `404 Not Found`: If the user with the specified ID does not exist.

---

This is the API documentation for your NestJS application. You can explore and test the endpoints using Swagger UI at `http://localhost:3001/api`.

# Code Description for developers

<details>
<summary> <font size="5"> App </font> </summary>
<div markdown="1">


</div>
</details>



<details>
<summary> <font size="5"> Users </font> </summary>
<div markdown="1">

## @CurrentUser
### Why do we use CurrentUserInterceptor?
1. We want get userId in Session on our server. not in Repository
2.  
flow : 
client request -> interceptor get current User with findById and save user object in session -> Decorator get currentUser in Session 

</div>
</details>


<details>
<summary> <font size="5"> Auth </font> </summary>
<div markdown="1">


</div>
</details>


<details>
<summary> <font size="5"> Channel </font> </summary>
<div markdown="1">


</div>
</details>


<details>
<summary> <font size="5"> Game </font> </summary>
<div markdown="1">


</div>
</details>
