# Auth Routes

```
authRouter.post("/sign-up");
authRouter.post("/verify");
authRouter.post("/sign-in");
authRouter.post("/refresh-token");
authRouter.post("/sign-out");
authRouter.get("/profile");
authRouter.get("/profile/:id");
authRouter.post("/verify-token");
authRouter.post("/update-avatar");
authRouter.post("/update-profile");
authRouter.post("/forfget-pass");
authRouter.post("/verify-pass-reset-token");
authRouter.post("/reset-pass");
```

-   `sign-up`

1. Read incomming data like: name, email, password.
2. Validate if the data is ok or not.
3. Send Error if not.
4. Check if e already have an account with the same user.
5. Send error if yes, otherwise create a new account and save user in DB.
6. Generate and store verification token.
7. Send verification mail with token to registered email.
8. Send message back to check email.

-   `verify`

1. Read incomming data like: id and token.
2. Find the token inside DB.
3. Send Error if token not found.
4. Check if the token is valid or not.
5. If not valid send error, otherwise update user is verified.
6. Remove token from database.
7. Send success message.

-   `signin`

1. Read incoming data like : email - password.
2. Find user with provided email.
3. Send error if user not found.
4. Check if the password is valid or not (pass is encrypted).
5. If not valid send error otherwise generate access & refresh token.
6. Store refresh token in DB.
7. Send both tokens to user.

-   `verify-token`

1. Check if user is authenticated or not.
2. Remove previous token if any.
3. Create/store new token and send response back.

-   `refresh-token`

1. Read and verify refresh token.
2. Find user with payload.id and refresh token.
3. If the refresh token is valid nd no user found, token is compromised.
4. Remove all the previous tokens, and send error response.
5. If he token is valid and user found create new refresh and access token.
6. Remove previous token, update user and send new tokens.

-   `sign-out`

1. Remove de refresh token

-   `forget-pass`

1. Ask for user email.
2. Find user with the given email in dB.
3. Send error if no user.
4. Else generate password reset token (first remove if there is any).
5. Generate reset link (like we did for verification).
6. Send link inside user's email.
7. Send response back.

-   `/verify-pass-reset-token`

1. Read token and id.
2. Find token in the database with owner.id.
3. If there is no token send error.
4. Else compare token with encrypted value.
5. If not matched send error.
6. Else call next function.

-   `/reset-password`

1. Read userid, reset pass token nd password.
2. Validate all this things.
3. If valid find user with the given id.
4. Check if user is using same password.
5. If there is no user or user is using the same password
6. Else update new password
7. Remove password reset token
8. Send confirmation email
9. Send response back

-   `/update-profile`

1. User must be logged (Authenticated)
2. Name must be valid
3. Find user and update the name
4. Send the new profile back
