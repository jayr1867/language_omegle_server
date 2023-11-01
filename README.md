# language_omegle_server

A server that generates and retrieves access tokens for the app [language_omegle](https://github.com/jayr1867/language_omegle).  
Server is hosted on Render with the URL: `https://lang-server.onrender.com`

- The only endpoint supported for now is `/join-room`.

## `/join-room`

- **Method**: `POST`
- **Body**:

    ```json
    {
        "roomName": "name",
    }
    ```

- **Response**:

    ```json
    {
        "token": "token"
    }
    ```

- **Description**:
  - `roomName`: The name of the room to join. If the room does not exist, it will be created.
