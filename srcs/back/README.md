---

## Users API Endpoints

| Endpoint                        | Method | Description                                    | Request Body                                              | Response Body                                               |
| ------------------------------- | ------ | ---------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/auth/signup`                  | POST   | Create a new user account                     | `{ "intraId": "string" }`                                  | User object containing user details                        |
| `/auth/signin`                  | POST   | Sign in with an existing user account         | `{ "intraId": "string" }`                                  | User object containing user details                        |
| `/auth/loginfortytwo/callback` | GET    | Callback endpoint for 42 login                | -                                                         | `'success'`                                                 |
| `/users/whoami`                 | GET    | Get the authenticated user's details          | -                                                         | User object containing user details                        |
| `/users/:id`                    | GET    | Get a user by ID                              | -                                                         | User object containing user details                        |
| `/users/:intraId`               | GET    | Get a user by intraId                         | -                                                         | User object containing user details                        |
| `/users/:id`                    | PATCH  | Update a user's details                       | `{ "property1": "value1", "property2": "value2", ... }`   | User object containing updated user details                |
| `/users/:id`                    | DELETE | Delete a user by ID                           | -                                                         | `null`                                                     |
| `/auth/loginfortytwo/callback` | GET    | Callback endpoint for 42 login                | -                                                         | `'success'`                                                 |

Note:
- The request body and response body are provided as JSON objects in the table.
- Replace `:id` and `:intraId` in the endpoints with the corresponding user ID and intraId, respectively, for specific operations.

Please ensure that the actual request bodies and response bodies adhere to the specified JSON format for successful API interactions.

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
