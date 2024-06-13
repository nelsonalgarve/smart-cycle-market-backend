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
