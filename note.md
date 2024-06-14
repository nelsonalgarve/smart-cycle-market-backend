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

1. Read incomming data like: name, email, password
2. Validate if the data is ok or not
3. Send Error if not
4. Check if e already have an account with the same user
5. Send error if yes, otherwise create a new account and save user in DB
6. Generate and store verification token
7. Send verification mail with token to registered email
8. Send message back to check email

-   `verify`

1. Read incomming data like: id and token
2. Find the token inside DB
3. Send Error if token not found
4. Check if the token is valid or not
5. If not valid send error, otherwise update user is verified
6. Remove token from database
7. Send success message

-   `signin`

1. Read incoming data like : email - password.
2. Find user with provided email.
3. Send error if user not found.
4. Check if the password is valid or not (pass is encrypted).
5. If not valid send error otherwise generate access & refresh token.
6. Store refresh token in DB.
7. Send both tokens to user.
